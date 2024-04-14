import { getResultInfoForRace } from "@/app/queries/db"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const raceId = parseInt(params.id)

  const results = await getResultInfoForRace(raceId)
  return new Response(JSON.stringify(results), { status: 200 })
}
