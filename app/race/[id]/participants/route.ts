import { getAllParticipantsForRace } from "@/app/queries/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const raceId = parseInt(params.id)

  const participation = await getAllParticipantsForRace(raceId)
  return new Response(JSON.stringify(participation), { status: 200 })
}
