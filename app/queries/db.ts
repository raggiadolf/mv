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
export const getAllRaces = async () => {
  return await prisma.race.findMany({
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
  })
}

export const createDefaultMVRace = async (date: Date) => {
  return await prisma.race.create({
    data: {
      date: new Date(`${date.toISOString().split("T")[0]}T06:10:00`),
      scheduled_race_id: 1,
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
  stravaActivityId: number
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
        create: segmentEfforts,
      },
    },
  })
  await calculateJerseysForRace(raceId)
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
        create: segmentEfforts,
      },
    },
    update: {
      strava_activity_id: stravaActivityId,
      segment_efforts: {
        deleteMany: {},
        create: segmentEfforts,
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
  refreshToken: string
) => {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      strava_refresh_token: refreshToken,
    },
  })
}

export const updateUserStravaRefreshtokenByStravaId = async (
  stravaId: number,
  refreshToken: string
) => {
  return await prisma.user.update({
    where: {
      strava_id: stravaId,
    },
    data: {
      strava_refresh_token: refreshToken,
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
    },
  })
  console.log("Created user: ", user.username, user.strava_id)
  await addUserToRaces(user)
  return user
}

// RESULTS
export const getResultsForRacePerJersey = async (
  raceId: number,
  jersey: Jersey
) => {
  const res = await prisma.participant.findMany({
    where: {
      race_id: raceId,
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
  return res.map((p) => ({
    User: p.User,
    jerseys: p.jerseys,
    strava_activity_id: p.strava_activity_id,
    segment_effort: p.segment_efforts?.at(0) || null,
  }))
}

export const getResultsForRace = async (raceId: number) => {
  const res = await prisma.participant.findMany({
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
  return res.map((p) => ({
    User: p.User,
    jerseys: p.jerseys,
    strava_activity_id: p.strava_activity_id,
    segment_effort: p.segment_efforts?.at(0) || null,
  }))
}

export const getResultInfoForRace = async (raceId: number) => {
  const race = await prisma.race.findFirst({
    where: {
      id: raceId,
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

export const calculateJerseysForRace = async (raceId: number) => {
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
    const tokens: StravaTokens = await strava.refreshAccessToken(
      p.User.strava_refresh_token
    )
    await updateUserStravaRefreshTokenByUserId(p.User.id, tokens.refreshToken)
    const activity = await getStravaActivity(
      Number(p.strava_activity_id),
      tokens.accessToken
    )
    const raceSegmentEfforts = await getRaceSegments(
      activity,
      race.ScheduledRace
    )
    await updateParticipant(p.user_id, race.id, raceSegmentEfforts, activity.id)
  }
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

  const tokens: StravaTokens = await strava.refreshAccessToken(
    user.strava_refresh_token
  )
  await updateUserStravaRefreshTokenByUserId(user.id, tokens.refreshToken)

  for (const race of races) {
    await addUserToRace(user, race, tokens.accessToken)
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
  for (const user of users) {
    const tokens: StravaTokens = await strava.refreshAccessToken(
      user.strava_refresh_token
    )
    await updateUserStravaRefreshTokenByUserId(user.id, tokens.refreshToken)
    await addUserToRace(user, race, tokens.accessToken)
  }
  console.log(`Finished refreshing all participants for race ${raceId}`)
}

const addUserToRace = async (
  user: User,
  race: RaceWithScheduledRace,
  accessToken: string
) => {
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
      race.ScheduledRace
    )
    console.log(`Race efforts: ${raceSegmentEfforts}`)
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
    } else {
      console.log(`No race segments in ${activity.id}`)
    }
  }
}
