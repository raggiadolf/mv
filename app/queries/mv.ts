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
  weekday: number,
  time: string,
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
      weekday: weekday,
      start_time: time,
      RaceSegment: {
        create: raceSegments,
      },
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
