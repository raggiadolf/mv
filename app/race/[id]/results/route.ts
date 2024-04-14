import { isValidJersey } from "@/app/lib/utils"
import { getResultsForRace, getResultsForRacePerJersey } from "@/app/queries/db"
import { Jersey } from "@prisma/client"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams
  let jersey = searchParams.get("jersey")
  if (jersey === "null") jersey = null
  const raceId = parseInt(params.id)

  if (jersey !== null && !isValidJersey(jersey)) {
    return new Response("Invalid jersey", { status: 400 })
  }

  const results = jersey
    ? await getResultsForRacePerJersey(raceId, jersey as Jersey)
    : await getResultsForRace(raceId)
  return new Response(JSON.stringify(results), { status: 200 })
}
