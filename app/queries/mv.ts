import { StravaTokens } from "arctic";
import prisma from "../lib/db";
import { StravaUser } from "../login/strava/callback/route";
import { generateId } from "lucia";
import { Jersey } from "@prisma/client";

// SCHEDULED RACES
export const getAllScheduledRaces = async () => {
  return await prisma.scheduledRace.findMany({
    orderBy: {
      weekday: "asc",
    },
    include: {
      RaceSegment: true,
    },
  });
};

export const updateScheduledRace = async (
  id: number,
  title: string,
  weekday: number,
  hour: number,
  minute: number,
  raceSegments: {
    strava_segment_id: number;
    jersey: Jersey;
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
  });
};

export const createScheduledRace = async (
  title: string,
  weekday: number,
  hour: number,
  minute: number,
  raceSegments: {
    strava_segment_id: number;
    jersey: Jersey;
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
  });
};

export const deleteScheduledRace = async (id: number) => {
  return await prisma.scheduledRace.delete({
    where: {
      id: id,
    },
  });
};

export const getScheduledRaceForRaceTime = async (date: Date) => {
  return await prisma.scheduledRace.findFirst({
    where: {
      weekday: date.getDay(),
    },
  });
};

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
  });
};

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
  });
};

export const findRaceOnDate = async (date: Date) => {
  return await prisma.race.findFirst({
    where: {
      date: {
        gte: new Date(date.toISOString().split("T")[0]),
        lte: new Date(`${date.toISOString().split("T")[0]}T23:59:59`),
      },
    },
  });
};

export const createDefaultMVRace = async (date: Date) => {
  return await prisma.race.create({
    data: {
      date: new Date(`${date.toISOString().split("T")[0]}T06:10:00`),
      race_type: "RACE",
      scheduled_race_id: 1,
    },
  });
};

// PARTICIPANTS
export const createParticipantFromStrava = async (
  userId: string,
  raceId: number,
  segmentEfforts: {
    strava_segment_id: number;
    elapsed_time_in_seconds: number;
    start_date: Date;
    end_date: Date;
    is_kom: boolean;
    average_watts: number;
    distance_in_meters: number;
  }[],
  stravaActivityId?: number
) => {
  return await prisma.participant.create({
    data: {
      user_id: userId,
      race_id: raceId,
      strava_activity_id: stravaActivityId,
      segment_efforts: {
        create: segmentEfforts,
      },
    },
  });
};

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
  });
};

export const deleteParticipant = async (userId: string, raceId: number) => {
  return await prisma.participant.delete({
    where: {
      race_id_user_id: {
        race_id: raceId,
        user_id: userId,
      },
    },
  });
};

// USERS
export const getUserByStravaId = async (stravaId: number) => {
  return await prisma.user.findUnique({
    where: {
      strava_id: stravaId,
    },
  });
};

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
  });
};

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
  });
};

export const createUser = async (
  stravaUser: StravaUser,
  tokens: StravaTokens
) => {
  const userId = generateId(15);
  return await prisma.user.create({
    data: {
      id: userId,
      strava_id: stravaUser.id,
      username: stravaUser.username,
      firstname: stravaUser.firstname,
      lastname: stravaUser.lastname,
      profile: stravaUser.profile,
      strava_refresh_token: tokens.refreshToken,
    },
  });
};

// RESULTS
export const getJerseyWinners = async (jersey: Jersey) => {
  return await prisma.user.findMany({
    where: {
      Participant: {
        some: {
          jersey: jersey,
        },
      },
    },
    select: {
      firstname: true,
      lastname: true,
      strava_id: true,
      profile: true,
      Participant: {
        where: { jersey: jersey },
        include: {
          Race: true,
        },
      },
      _count: {
        select: {
          Participant: { where: { jersey: jersey } },
        },
      },
    },
    orderBy: {
      Participant: {
        _count: "desc",
      },
    },
  });
};

export const calculateJerseysForRace = async (raceId: number) => {
  const scheduledRace = await prisma.scheduledRace.findFirst({
    where: {
      id: raceId,
    },
  });
  if (!scheduledRace) {
    // throw error
    return null;
  }
  const raceSegments = await prisma.raceSegment.findMany({
    where: {
      scheduledRaceId: scheduledRace.id,
    },
  });
  const participants = await prisma.participant.findMany({
    where: {
      race_id: raceId,
    },
    include: {
      segment_efforts: {
        where: {
          strava_segment_id: {
            in: raceSegments.map((segment) => segment.strava_segment_id),
          },
        },
      },
    },
  });

  console.log("participants", participants);
};
