import RaceTable from "@/app/components/RaceTable"
import { getRaceById } from "@/app/queries/mv"

export default async function Race({ params }: { params: { id: string } }) {
  const race = await getRaceById(parseInt(params.id))
  if (!race) return null // TODO: Empty state
  return <RaceTable race={race} />
}
