import { validateRequest } from "@/app/lib/auth"
import { satisfiesRole } from "@/app/lib/utils"
import { refreshAllParticipantsForRace } from "@/app/queries/mv"
import { NextRequest } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const raceId = parseInt(params.id)
  const { user } = await validateRequest()
  if (!user || !satisfiesRole("ADMIN", user)) {
    return new Response("Unauthorized", { status: 401 })
  }

  await refreshAllParticipantsForRace(raceId)
  return new Response("Refreshed", { status: 200 })
}
