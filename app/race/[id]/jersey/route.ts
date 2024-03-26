import { isValidJersey } from "@/app/lib/utils"
import { getJerseyInfoForRace } from "@/app/queries/db"
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
