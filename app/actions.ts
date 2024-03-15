"use server";

import { revalidatePath } from "next/cache";

import prisma from "./lib/db";
import { lucia, validateRequest } from "./lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function updateAttendance(
  attendance: "present" | "absent",
  userId: string,
  raceId: number,
  stravaActivityId?: number
) {
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

  revalidatePath("/races");
}

export async function logout(): Promise<ActionResult> {
  "use server";
  const { session } = await validateRequest();
  if (!session) {
    return { error: "Unauthorized" };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  return redirect("/login");
}

interface ActionResult {
  error: string | null;
}
