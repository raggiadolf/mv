import RaceCard from "../components/RaceCard"
import { getAllRaces } from "../queries/db"

export default async function Races() {
  const races = await getAllRaces()
  return (
    <ul role="list" className="space-y-4 w-full max-w-[500px]">
      {races.map((race) => {
        return (
          <li key={race.id}>
            <RaceCard id={race.id} />
          </li>
        )
      })}
    </ul>
  )
}
