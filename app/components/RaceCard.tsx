import { getRaceById } from "../queries/db"
import RaceInfo from "./RaceInfo"

export default async function RaceCard({ id }: { id: number }) {
  const race = await getRaceById(id)

  if (!race) return null

  return (
    <div className="text-white bg-stone-800 px-6 py-6 shadow rounded-lg space-y-4">
      <RaceInfo participants={race.Participant} raceDate={race.date} id={id} />
    </div>
  )
}
