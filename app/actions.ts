"use server";

import prisma from "./lib/db";

export async function updateAttendance(
  attendance: "present" | "absent",
  userId: string,
  raceId: number,
  stravaActivityId?: string
) {
  const res =
    attendance === "absent"
      ? await prisma.participant.delete({
          where: {
            race_id_user_id: {
              race_id: raceId,
              user_id: userId,
            },
          },
        })
      : await prisma.participant.create({
          data: {
            race_id: raceId,
            user_id: userId,
            strava_activity_id: stravaActivityId,
          },
        });

  console.log(res);
}
