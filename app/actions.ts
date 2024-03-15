"use server";

import { revalidatePath } from "next/cache";

import { lucia, validateRequest } from "./lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createParticipant, deleteParticipant } from "./queries/mv";

export async function updateAttendance(
  attendance: "present" | "absent",
  userId: string,
  raceId: number,
  stravaActivityId?: number
) {
  attendance === "absent"
    ? await deleteParticipant(userId, raceId)
    : await createParticipant(userId, raceId, stravaActivityId);

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
