import {
  createParticipant,
  deleteParticipant,
  getParticipationByUserForRace,
} from "@/app/queries/db"
import { NextRequest } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const raceId = parseInt(params.id)

  if (body.attendance === "absent") {
    await deleteParticipant(body.userId, raceId)
  } else if (body.attendance === "present") {
    await createParticipant(body.userId, raceId, body.stravaActivityId)
  }
  return new Response(null, { status: 200 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("user_id")

  if (!userId) {
    return new Response("Invalid user", { status: 400 })
  }

  const participation = await getParticipationByUserForRace(
    userId,
    parseInt(params.id)
  )
  return new Response(JSON.stringify(participation), { status: 200 })
}
