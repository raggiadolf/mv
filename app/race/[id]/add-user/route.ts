import { validateRequest } from "@/app/lib/auth"
import { satisfiesRole } from "@/app/lib/utils"
import { addUserToRace, getRaceById, getStravaTokens } from "@/app/queries/db"
import { NextRequest } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await validateRequest()
  if (!user || !satisfiesRole("ADMIN", user)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await request.json()
  const userId = body.userId
  const raceId = parseInt(params.id)

  const tokens = await getStravaTokens(userId)
  const race = await getRaceById(raceId)

  if (!race || !tokens) {
    return new Response("Server error", { status: 500 })
  }

  await addUserToRace(userId, race, tokens?.accessToken)
  return new Response("Success", { status: 200 })
}
