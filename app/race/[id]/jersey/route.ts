import { isValidJersey } from "@/app/lib/utils"
import { addJerseyToParticipant, getJerseyInfoForRace } from "@/app/queries/db"
import { Jersey } from "@prisma/client"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams
  const jersey = searchParams.get("jersey")
  const raceId = parseInt(params.id)

  if (!isValidJersey(jersey)) {
    return new Response("Invalid jersey", { status: 400 })
  }

  const results = await getJerseyInfoForRace(raceId, jersey as Jersey)
  return new Response(JSON.stringify(results), { status: 200 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const jersey = body.jersey as Jersey
  const participantId = parseInt(body.participantId)
  const raceId = parseInt(params.id)

  await addJerseyToParticipant(participantId, jersey)

  return new Response(JSON.stringify({}), { status: 200 })
}
