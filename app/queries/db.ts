import { StravaTokens } from "arctic"
import prisma, { RaceWithScheduledRace } from "../lib/db"
import { StravaUser } from "../login/strava/callback/route"
import { generateId } from "lucia"
import { Jersey, User } from "@prisma/client"
import { getHours, getISODay } from "date-fns"
import { strava } from "../lib/auth"
import {
  findActivitiesForUser,
  getRaceSegments,
  getStravaActivity,
} from "./strava"
import { addUserToRaceTask } from "./qstash"

declare global {
  interface BigInt {
    toJSON(): string
  }
}
BigInt.prototype.toJSON = function () {
  return this.toString()
}

// SCHEDULED RACES
export const getAllScheduledRaces = async () => {
  return await prisma.scheduledRace.findMany({
    orderBy: {
      weekday: "asc",
    },
    include: {
      RaceSegment: true,
    },
  })
}

export const updateScheduledRace = async (
  id: number,
  title: string,
  weekday: number,
  hour: number,
  minute: number,
  raceSegments: {
    strava_segment_id: number
    jersey: Jersey
  }[]
) => {
  return await prisma.scheduledRace.update({
    where: {
      id: id,
    },
    data: {
      title: title,
      weekday: weekday,
      start_hour: hour,
      start_minute: minute,
      RaceSegment: {
        deleteMany: {},
        create: raceSegments,
      },
    },
  })
}

export const createScheduledRace = async (
  title: string,
  weekday: number,
  hour: number,
  minute: number,
  raceSegments: {
    strava_segment_id: number
    jersey: Jersey
  }[]
) => {
  return await prisma.scheduledRace.create({
    data: {
      title: title,
      weekday: weekday,
      start_hour: hour,
      start_minute: minute,
      RaceSegment: {
        create: raceSegments,
      },
      race_type: "RACE",
    },
  })
}

export const deleteScheduledRace = async (id: number) => {
  return await prisma.scheduledRace.delete({
    where: {
      id: id,
    },
  })
}

export const getScheduledRaceForRaceTime = async (date: Date) => {
  const zeroBasedISODay = getISODay(date) - 1
  const startHourOfRide = getHours(date)
  const race = await prisma.scheduledRace.findFirst({
    where: {
      weekday: zeroBasedISODay,
      start_hour: {
        lte: startHourOfRide + 2,
        gte: startHourOfRide - 1,
      },
    },
    include: {
      RaceSegment: true,
    },
  })

  return race
}

// RACES
export const getAllRaces = async (season?: string) => {
  return await prisma.race.findMany({
    where: {
      ...(season
        ? {
            date: {
              gte: new Date(`${season}-01-01`),
              lte: new Date(`${season}-12-31`),
            },
          }
        : {}),
    },
    orderBy: {
      date: "desc",
    },
    include: {
      Participant: {
        include: {
          User: true,
        },
      },
    },
  })
}

export const getRaceById = async (id: number) => {
  return await prisma.race.findUnique({
    where: {
      id: id,
    },
    include: {
      Participant: {
        include: {
          User: true,
        },
      },
      ScheduledRace: {
        include: {
          RaceSegment: true,
        },
      },
    },
  })
}

export const findRaceOnDate = async (date: Date) => {
  return await prisma.race.findFirst({
    where: {
      date: {
        gte: new Date(date.toISOString().split("T")[0]),
        lte: new Date(`${date.toISOString().split("T")[0]}T23:59:59`),
      },
    },
    include: {
      ScheduledRace: true,
    },
  })
}

export const createDefaultMVRace = async (
  date: Date,
  scheduledRaceId: number
) => {
  return await prisma.race.create({
    data: {
      date: new Date(`${date.toISOString().split("T")[0]}T06:10:00`),
      scheduled_race_id: scheduledRaceId,
    },
    include: {
      ScheduledRace: true,
    },
  })
}

// PARTICIPANTS
export const getAllParticipantsForRace = async (raceId: number) => {
  return await prisma.participant.findMany({
    where: {
      race_id: raceId,
    },
    include: {
      User: true,
    },
  })
}

export const createParticipantFromStrava = async (
  userId: string,
  raceId: number,
  segmentEfforts: {
    strava_segment_id: number
    elapsed_time_in_seconds: number
    start_date: Date
    end_date: Date
    is_kom: boolean
    kom_rank?: number
    average_watts: number
    distance_in_meters: number
    race_segment_id: number
  }[],
  stravaActivityId?: number
) => {
  const participant = await prisma.participant.create({
    data: {
      user_id: userId,
      race_id: raceId,
      strava_activity_id: stravaActivityId,
      segment_efforts: {
        create: segmentEfforts.map((effort) => ({
          strava_segment_id: effort.strava_segment_id,
          elapsed_time_in_seconds: effort.elapsed_time_in_seconds,
          start_date: effort.start_date,
          end_date: effort.end_date,
          is_kom: effort.is_kom,
          kom_rank: effort.kom_rank,
          average_watts: effort.average_watts,
          distance_in_meters: effort.distance_in_meters,
          race_segment_id: effort.race_segment_id,
        })),
      },
    },
  })
  await calculateJerseysForRace(raceId)
  return participant
}

export const updateParticipant = async (
  userId: string,
  raceId: number,
  segmentEfforts: {
    strava_segment_id: number
    elapsed_time_in_seconds: number
    start_date: Date
    end_date: Date
    is_kom: boolean
    average_watts: number
    distance_in_meters: number
    race_segment_id: number
  }[],
  stravaActivityId: number,
  updateJerseys = true
) => {
  const participant = await prisma.participant.update({
    where: {
      race_id_user_id: {
        race_id: raceId,
        user_id: userId,
      },
    },
    data: {
      strava_activity_id: stravaActivityId,
      segment_efforts: {
        deleteMany: {},
        create: segmentEfforts.map((effort) => ({
          strava_segment_id: effort.strava_segment_id,
          elapsed_time_in_seconds: effort.elapsed_time_in_seconds,
          start_date: effort.start_date,
          end_date: effort.end_date,
          is_kom: effort.is_kom,
          average_watts: effort.average_watts,
          distance_in_meters: effort.distance_in_meters,
          race_segment_id: effort.race_segment_id,
        })),
      },
    },
  })
  updateJerseys && (await calculateJerseysForRace(raceId))
  return participant
}

export const upsertParticipant = async (
  userId: string,
  raceId: number,
  segmentEfforts: {
    strava_segment_id: number
    elapsed_time_in_seconds: number
    start_date: Date
    end_date: Date
    is_kom: boolean
    kom_rank?: number
    average_watts: number
    distance_in_meters: number
    race_segment_id: number
  }[],
  stravaActivityId: number
) => {
  const participant = await prisma.participant.upsert({
    where: {
      race_id_user_id: {
        race_id: raceId,
        user_id: userId,
      },
    },
    create: {
      user_id: userId,
      race_id: raceId,
      strava_activity_id: stravaActivityId,
      segment_efforts: {
        create: segmentEfforts.map((effort) => ({
          strava_segment_id: effort.strava_segment_id,
          elapsed_time_in_seconds: effort.elapsed_time_in_seconds,
          start_date: effort.start_date,
          end_date: effort.end_date,
          is_kom: effort.is_kom,
          kom_rank: effort.kom_rank,
          average_watts: effort.average_watts,
          distance_in_meters: effort.distance_in_meters,
          race_segment_id: effort.race_segment_id,
        })),
      },
    },
    update: {
      strava_activity_id: stravaActivityId,
      segment_efforts: {
        deleteMany: {},
        create: segmentEfforts.map((effort) => ({
          strava_segment_id: effort.strava_segment_id,
          elapsed_time_in_seconds: effort.elapsed_time_in_seconds,
          start_date: effort.start_date,
          end_date: effort.end_date,
          is_kom: effort.is_kom,
          kom_rank: effort.kom_rank,
          average_watts: effort.average_watts,
          distance_in_meters: effort.distance_in_meters,
          race_segment_id: effort.race_segment_id,
        })),
      },
    },
  })
  await calculateJerseysForRace(raceId)
  return participant
}

export const getParticipationByUserForRace = async (
  userId: string,
  raceId: number
) => {
  return await prisma.participant.findFirst({
    where: {
      user_id: userId,
      race_id: raceId,
    },
  })
}

export const createParticipant = async (
  userId: string,
  raceId: number,
  stravaActivityId?: number
) => {
  return await prisma.participant.create({
    data: {
      race_id: raceId,
      user_id: userId,
      strava_activity_id: stravaActivityId,
    },
  })
}

export const deleteParticipant = async (userId: string, raceId: number) => {
  return await prisma.participant.delete({
    where: {
      race_id_user_id: {
        race_id: raceId,
        user_id: userId,
      },
    },
  })
}

// USERS
export const getUserByStravaId = async (stravaId: number) => {
  return await prisma.user.findUnique({
    where: {
      strava_id: stravaId,
    },
  })
}

export const updateUserStravaRefreshTokenByUserId = async (
  userId: string,
  tokens: StravaTokens
) => {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      strava_refresh_token: tokens.refreshToken,
      strava_access_token: tokens.accessToken,
      access_token_expires_at: tokens.accessTokenExpiresAt,
    },
  })
}

export const getStravaTokens = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })

  if (!user) return null // TODO: Throw error

  if (user.access_token_expires_at < new Date()) {
    const tokens = await strava.refreshAccessToken(user.strava_refresh_token)
    await updateUserStravaRefreshTokenByUserId(user.id, tokens)
    return tokens
  }

  return {
    refreshToken: user.strava_refresh_token,
    accessToken: user.strava_access_token,
    accessTokenExpiresAt: user.access_token_expires_at,
  }
}

export const updateUserStravaRefreshtokenByStravaId = async (
  stravaId: number,
  tokens: StravaTokens
) => {
  return await prisma.user.update({
    where: {
      strava_id: stravaId,
    },
    data: {
      strava_refresh_token: tokens.refreshToken,
      strava_access_token: tokens.accessToken,
      access_token_expires_at: tokens.accessTokenExpiresAt,
    },
  })
}

export const createUser = async (
  stravaUser: StravaUser,
  tokens: StravaTokens
) => {
  const userId = generateId(15)
  const user = await prisma.user.create({
    data: {
      id: userId,
      strava_id: stravaUser.id,
      username: stravaUser.username,
      firstname: stravaUser.firstname,
      lastname: stravaUser.lastname,
      profile: stravaUser.profile,
      sex: stravaUser.sex,
      weight: stravaUser.weight,
      strava_refresh_token: tokens.refreshToken,
      strava_access_token: tokens.accessToken,
      access_token_expires_at: tokens.accessTokenExpiresAt,
    },
  })
  console.log("Created user: ", user.username, user.strava_id)
  addUserToRaces(user)
  return user
}

export const getAllUsers = async () => {
  const users = await prisma.user.findMany()
  return users
}

export const setUserAsOldRider = async (userId: string) => {
  console.log(`Setting user ${userId} as old rider`)
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      eligible_for_old: true,
    },
  })
}

export const setUserAsNotOldRider = async (userId: string) => {
  console.log(`Setting user ${userId} as not old rider`)
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      eligible_for_old: false,
    },
  })
}

// RESULTS
export const getResultsForRacePerJersey = async (
  raceId: number,
  jersey: Jersey
) => {
  const race = await prisma.race.findFirst({
    where: {
      id: raceId,
    },
    include: {
      ScheduledRace: true,
    },
  })
  const res = await prisma.participant.findMany({
    where: {
      race_id: raceId,
      segment_efforts: {
        some: {
          RaceSegment: {
            jersey: jersey,
          },
        },
      },
    },
    include: {
      User: true,
      segment_efforts: {
        take: 1,
        where: {
          RaceSegment: {
            jersey: jersey,
          },
        },
      },
    },
  })
  return {
    race_type: race?.ScheduledRace.race_type,
    participants: res.map((p) => ({
      User: p.User,
      jerseys: p.jerseys,
      strava_activity_id: p.strava_activity_id,
      segment_effort: p.segment_efforts?.at(0) || null,
    })),
  }
}

export const getResultsForRace = async (raceId: number) => {
  const race = await prisma.race.findFirst({
    where: {
      id: raceId,
    },
    include: {
      ScheduledRace: true,
    },
  })
  const res = await prisma.participant.findMany({
    where: {
      race_id: raceId,
      ...(race?.ScheduledRace.race_type === "RACE"
        ? {
            segment_efforts: {
              some: {
                RaceSegment: {
                  jersey: "YELLOW",
                },
              },
            },
          }
        : {}),
    },
    include: {
      User: true,
      segment_efforts: {
        take: 1,
        where: {
          RaceSegment: {
            jersey: "YELLOW",
          },
        },
      },
      Race: {
        include: {
          ScheduledRace: true,
        },
      },
    },
  })
  return {
    race_type: race?.ScheduledRace.race_type,
    participants: res.map((p) => ({
      User: p.User,
      jerseys: p.jerseys,
      strava_activity_id: p.strava_activity_id,
      segment_effort: p.segment_efforts?.at(0) || null,
    })),
  }
}

export const getResultInfoForRace = async (raceId: number) => {
  const race = await prisma.race.findFirst({
    where: {
      id: raceId,
    },
    include: {
      ScheduledRace: true,
    },
  })
  if (!race) return null // TODO: Throw error and handle gracefully
  const participants = await prisma.participant.findMany({
    where: {
      race_id: raceId,
    },
    include: {
      User: true,
      segment_efforts: {
        take: 1,
        where: {
          RaceSegment: {
            jersey: "YELLOW",
          },
        },
      },
    },
  })
  const totalNoOfUsers = await prisma.user.count()
  const firstFinisher = participants.find((p) => p.jerseys.includes("YELLOW"))

  const fastestSegment = participants.sort(
    (a, b) =>
      a.segment_efforts?.at(0)?.elapsed_time_in_seconds ||
      0 - (b.segment_efforts?.at(0)?.elapsed_time_in_seconds || 0)
  )

  return {
    totalNoOfUsers,
    firstFinisher,
    fastestSegment,
    race_type: race.ScheduledRace.race_type,
  }
}

export const getNumberOfJerseysForUser = async (jersey: Jersey) => {
  return await prisma.user.findMany({
    where: {
      Participant: {
        some: {
          jerseys: {
            has: jersey,
          },
        },
      },
    },
    select: {
      firstname: true,
      lastname: true,
      strava_id: true,
      profile: true,
      Participant: {
        where: {
          jerseys: {
            has: jersey,
          },
        },
        include: {
          Race: true,
        },
      },
      _count: {
        select: {
          Participant: {
            where: {
              jerseys: {
                has: jersey,
              },
            },
          },
        },
      },
    },
    orderBy: {
      Participant: {
        _count: "desc",
      },
    },
  })
}

export const getOverAllResults = async (season: string) => {
  const yearFrom = `${season}-01-01`
  const yearTo = `${season}-12-31`
  const res: any[] = await prisma.$queryRaw`
    SELECT
      u.id,
      u.strava_id,
      u.profile,
      u.firstname,
      u.lastname,
      COUNT(p) as participation_count,
      SUM(CASE WHEN 'YELLOW' = ANY(p.jerseys) THEN 1 ELSE 0 END) AS yellow_count,
      SUM(CASE WHEN 'OLD' = ANY(p.jerseys) THEN 1 ELSE 0 END) AS old_count,
      SUM(CASE WHEN 'GREEN' = ANY(p.jerseys) THEN 1 ELSE 0 END) AS green_count,
      SUM(CASE WHEN 'POLKA' = ANY(p.jerseys) THEN 1 ELSE 0 END) AS polka_count,
      SUM(CASE WHEN 'PINK' = ANY(p.jerseys) THEN 1 ELSE 0 END) AS pink_count
    FROM
      "User" u
      JOIN "Participant" p on u.id = p.user_id
      JOIN "Race" r on p.race_id = r.id
    WHERE
      ${season} = '' OR
      r.date >= ${yearFrom}::date AND r.date <= ${yearTo}::date
    GROUP BY
      u.id, u.profile, u.firstname, u.lastname, u.strava_id
  `

  const numberOfRaces = await prisma.race.count({
    where: {
      ...(season
        ? {
            date: {
              gte: new Date(`${season}-01-01`),
              lte: new Date(`${season}-12-31`),
            },
          }
        : {}),
    },
  })

  return res.map((p: any) => ({
    id: p.id,
    strava_id: p.strava_id,
    profile: p.profile,
    firstname: p.firstname,
    lastname: p.lastname,
    participation_count: Number(p.participation_count),
    yellow_count: Number(p.yellow_count),
    old_count: Number(p.old_count),
    green_count: Number(p.green_count),
    polka_count: Number(p.polka_count),
    pink_count: Number(p.pink_count),
    part_percentage: Math.round(
      (Number(p.participation_count) / numberOfRaces) * 100
    ),
  }))
}

export const calculateJerseysForRace = async (raceId: number) => {
  console.log(`Calculating jerseys for ${raceId}`)
  await removeAllJerseysFromRace(raceId)
  const race = await prisma.race.findFirst({
    where: {
      id: raceId,
    },
    include: {
      ScheduledRace: true,
    },
  })
  if (!race?.ScheduledRace) {
    // throw error
    return null
  }
  const raceSegments = await prisma.raceSegment.findMany({
    where: {
      scheduledRaceId: race.ScheduledRace.id,
    },
  })
  const participants = await prisma.participant.findMany({
    where: {
      race_id: race.id,
    },
    include: {
      segment_efforts: {
        where: {
          strava_segment_id: {
            in: raceSegments.map((segment) => segment.strava_segment_id),
          },
        },
      },
      User: {
        select: {
          eligible_for_old: true,
          sex: true,
        },
      },
    },
  })

  for (const segment of raceSegments) {
    const segmentEfforts = participants
      .map((p) => {
        return p.segment_efforts.find((effort) => {
          if (segment.jersey === "OLD") {
            return (
              effort.strava_segment_id === segment.strava_segment_id &&
              p.User.eligible_for_old
            )
          } else if (segment.jersey === "PINK") {
            return (
              effort.strava_segment_id === segment.strava_segment_id &&
              p.User.sex === "F"
            )
          }
          return effort.strava_segment_id === segment.strava_segment_id
        })
      })
      .filter(Boolean)
    const bestEffort = segmentEfforts
      ?.sort(
        (a, b) => (a?.end_date?.getTime() || 0) - (b?.end_date?.getTime() || 0)
      )
      .at(0)
    if (bestEffort) {
      console.log(`Adding ${segment.jersey} to ${bestEffort.participantId}`)
      await addJerseyToParticipant(bestEffort.participantId!, segment.jersey)
    }
  }

  await prisma.race.update({
    where: {
      id: raceId,
    },
    data: {
      updated_at: new Date(),
    },
  })
}

export const addJerseyToParticipant = async (
  participantId: number,
  jersey: Jersey
) => {
  const participantJerseys = await prisma.participant.findUnique({
    where: {
      id: participantId,
    },
    select: {
      jerseys: true,
      race_id: true,
    },
  })
  if (participantJerseys?.jerseys.includes(jersey)) {
    // throw error?
    return participantJerseys
  }
  if (!participantJerseys) {
    // throw error
    return null
  }

  await removeJerseyFromRace(participantJerseys?.race_id, jersey)

  return await prisma.participant.update({
    where: {
      id: participantId,
    },
    data: {
      jerseys: {
        push: jersey,
      },
    },
  })
}

export const removeJerseyFromParticipant = async (
  participantId: number,
  jersey: Jersey
) => {
  const participantJerseys = await prisma.participant.findUnique({
    where: {
      id: participantId,
    },
    select: {
      jerseys: true,
    },
  })
  if (!participantJerseys?.jerseys.includes(jersey)) {
    // throw error?
    return participantJerseys
  }

  return await prisma.participant.update({
    where: {
      id: participantId,
    },
    data: {
      jerseys: {
        set: participantJerseys.jerseys.filter((j) => j !== jersey),
      },
    },
  })
}

export const removeJerseyFromRace = async (raceId: number, jersey: Jersey) => {
  const participants = await prisma.participant.findMany({
    where: {
      race_id: raceId,
    },
    select: {
      id: true,
      jerseys: true,
    },
  })

  for (const participant of participants) {
    if (participant.jerseys.includes(jersey)) {
      await prisma.participant.update({
        where: {
          id: participant.id,
        },
        data: {
          jerseys: {
            set: participant.jerseys.filter((j) => j !== jersey),
          },
        },
      })
    }
  }
}

export const removeAllJerseysFromRace = async (raceId: number) => {
  await prisma.participant.updateMany({
    where: {
      race_id: raceId,
    },
    data: {
      jerseys: {
        set: [],
      },
    },
  })
}

export const getJerseyInfoForRace = async (raceId: number, jersey: Jersey) => {
  const participant = await prisma.participant.findFirst({
    where: {
      race_id: raceId,
      jerseys: {
        has: jersey,
      },
      segment_efforts: {
        some: {
          RaceSegment: {
            jersey: jersey,
          },
        },
      },
    },
    include: {
      User: true,
      segment_efforts: {
        where: {
          RaceSegment: {
            jersey: jersey,
          },
        },
      },
    },
  })
  if (!participant || !participant.segment_efforts[0]) {
    return null
  }
  const time = participant.segment_efforts[0].elapsed_time_in_seconds
  const distance = participant.segment_efforts[0].distance_in_meters
  const watts = participant.segment_efforts[0].average_watts
  const is_kom = participant.segment_efforts[0].is_kom
  return {
    time,
    distance,
    watts,
    is_kom,
    user: participant.User,
    activity_id: Number(participant.strava_activity_id),
  }
}

export const recalculateResultsForRace = async (raceId: number) => {
  const [race, participants] = await Promise.all([
    prisma.race.findFirst({
      where: {
        id: raceId,
      },
      include: {
        ScheduledRace: {
          include: {
            RaceSegment: true,
          },
        },
      },
    }),
    prisma.participant.findMany({
      where: {
        race_id: raceId,
      },
      include: {
        User: true,
      },
    }),
  ])
  if (!race) return // TODO: Throw error

  // Update each participant with new segment efforts
  for (const p of participants) {
    const tokens = await getStravaTokens(p.user_id)
    if (!tokens) return // TODO: Throw error
    const activity = await getStravaActivity(
      Number(p.strava_activity_id),
      tokens.accessToken
    )
    const raceSegmentEfforts = await getRaceSegments(
      activity,
      race.ScheduledRace,
      p.User
    )
    await updateParticipant(
      p.user_id,
      race.id,
      raceSegmentEfforts,
      activity.id,
      false
    )
  }
  await calculateJerseysForRace(raceId)
}

export const addUserToRaces = async (user: User) => {
  console.log(`Adding user ${user.id} to all races`)
  const races = await prisma.race.findMany({
    include: {
      ScheduledRace: {
        include: {
          RaceSegment: true,
        },
      },
    },
  })
  if (!races) {
    console.log("No races to add user to")
    return // TODO: Throw error
  }

  for (const race of races) {
    addUserToRaceTask(user.id, race.id)
  }
}

export const refreshAllParticipantsForRace = async (raceId: number) => {
  console.log(`Refreshing all participants for race ${raceId}`)
  const [race, users] = await Promise.all([
    prisma.race.findFirst({
      where: {
        id: raceId,
      },
      include: {
        ScheduledRace: {
          include: {
            RaceSegment: true,
          },
        },
      },
    }),
    prisma.user.findMany(),
  ])
  if (!race) return null // TODO: Throw error
  const participants = await Promise.all(
    users.map((u) => getParticipant(u, race))
  )
  console.log("participants", participants.filter(Boolean))
  await upsertManyParticipants(participants.filter(Boolean) as any)
  await calculateJerseysForRace(raceId)
  console.log(`Finished refreshing all participants for race ${raceId}`)
}

export const refreshAllRaces = async () => {
  console.log(`Refreshing all races`)
  const races = await prisma.race.findMany()
  for (const race of races) {
    await refreshAllParticipantsForRace(race.id)
  }
  console.log(`Finished refreshing all races`)
}

const getParticipant = async (user: User, race: RaceWithScheduledRace) => {
  const tokens = await getStravaTokens(user.id)
  if (!tokens) return null // TODO: Throw error
  console.log(`Fetching possible race activities for ${user.id} for ${race.id}`)
  const possibleRaceActivities = await findActivitiesForUser(
    race.date,
    tokens.accessToken
  )
  console.log(`Found ${possibleRaceActivities.length} activities for user`)
  for (const pra of possibleRaceActivities) {
    const activity = await getStravaActivity(pra.id, tokens.accessToken)
    console.log(`Checking activity ${activity.id}`)
    console.log("race", race.ScheduledRace)
    const raceSegmentEfforts = await getRaceSegments(
      activity,
      race.ScheduledRace,
      user
    )
    const yellowJerseySegmentId = raceSegmentEfforts.find(
      (effort) => effort.jersey === "YELLOW"
    )?.strava_segment_id
    if (
      (race.ScheduledRace.race_type === "GROUPRIDE" &&
        activity.segment_efforts.some(
          (se: any) => se.segment.id === 15536980
        )) ||
      (race.ScheduledRace.race_type !== "RACE" &&
        activity.segment_efforts.some(
          (se: any) => se.segment.id === yellowJerseySegmentId
        ))
    ) {
      return {
        user_id: user.id,
        race_id: race.id,
        strava_activity_id: activity.id,
        segment_efforts: raceSegmentEfforts.map((effort) => ({
          strava_segment_id: effort.strava_segment_id,
          elapsed_time_in_seconds: effort.elapsed_time_in_seconds,
          start_date: effort.start_date,
          end_date: effort.end_date,
          is_kom: effort.is_kom,
          kom_rank: effort.kom_rank,
          average_watts: effort.average_watts,
          distance_in_meters: effort.distance_in_meters,
          race_segment_id: effort.race_segment_id,
        })),
      }
    }
  }
}

export const addUserToRace = async (
  userId: string,
  race: RaceWithScheduledRace,
  accessToken: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })
  if (!user) return null // TODO: Throw error
  console.log(`Trying to add ${user.id} to ${race.id}`)
  const possibleRaceActivities = await findActivitiesForUser(
    race.date,
    accessToken
  )
  console.log(`Found ${possibleRaceActivities.length} activities for user`)

  for (const pra of possibleRaceActivities) {
    const activity = await getStravaActivity(pra.id, accessToken)
    console.log(`Checking activity ${activity.id}`)
    const raceSegmentEfforts = await getRaceSegments(
      activity,
      race.ScheduledRace,
      user
    )
    console.log(`Race efforts: ${JSON.stringify(raceSegmentEfforts)}`)
    const yellowJerseySegmentId = raceSegmentEfforts.find(
      (effort) => effort.jersey === "YELLOW"
    )?.strava_segment_id
    for (const e of raceSegmentEfforts) {
      delete e.jersey
    }
    if (
      activity.segment_efforts.some(
        (se: any) => se.segment.id === yellowJerseySegmentId
      )
    ) {
      console.log(
        `Found race activity for user ${user.id}, adding to race ${race.id}`
      )
      await upsertParticipant(user.id, race.id, raceSegmentEfforts, activity.id)
    }
  }
}

const upsertManyParticipants = async (
  participants: {
    user_id: string
    race_id: number
    strava_activity_id: number
    segment_efforts: {
      strava_segment_id: number
      elapsed_time_in_seconds: number
      start_date: Date
      end_date: Date
      is_kom: boolean
      kom_rank?: number
      average_watts: number
      distance_in_meters: number
      race_segment_id: number
    }[]
  }[]
) => {
  return await prisma.$transaction([
    prisma.participant.deleteMany({
      where: {
        race_id: {
          in: participants.map((p) => p.race_id),
        },
        user_id: {
          in: participants.map((p) => p.user_id),
        },
      },
    }),
    ...participants.map((p) => {
      return prisma.participant.create({
        data: {
          user_id: p.user_id,
          race_id: p.race_id,
          strava_activity_id: p.strava_activity_id,
          segment_efforts: {
            create: p.segment_efforts.map((effort) => ({
              strava_segment_id: effort.strava_segment_id,
              elapsed_time_in_seconds: effort.elapsed_time_in_seconds,
              start_date: effort.start_date,
              end_date: effort.end_date,
              is_kom: effort.is_kom,
              kom_rank: effort.kom_rank,
              average_watts: effort.average_watts,
              distance_in_meters: effort.distance_in_meters,
              race_segment_id: effort.race_segment_id,
            })),
          },
        },
      })
    }),
  ])
}
