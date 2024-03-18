"use server";

import { revalidatePath } from "next/cache";

import { lucia, validateRequest } from "./lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createScheduledRace,
  deleteScheduledRace,
  updateScheduledRace,
} from "./queries/mv";
import { Jersey } from "@prisma/client";

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

export async function updateScheduled(
  raceId: number,
  title: string,
  weekday: number,
  hour: number,
  minute: number,
  raceSegments: {
    strava_segment_id: number;
    jersey: Jersey;
  }[]
) {
  "use server";
  await updateScheduledRace(raceId, title, weekday, hour, minute, raceSegments);
  revalidatePath("/race/create");
}

export async function createScheduled(
  title: string,
  weekday: number,
  hour: number,
  minute: number,
  raceSegments: {
    strava_segment_id: number;
    jersey: Jersey;
  }[]
) {
  "use server";
  await createScheduledRace(title, weekday, hour, minute, raceSegments);
  revalidatePath("/race/create");
}

export async function deleteScheduled(raceId: number) {
  "use server";
  await deleteScheduledRace(raceId);
  revalidatePath("/race/create");
}

interface ActionResult {
  error: string | null;
}
