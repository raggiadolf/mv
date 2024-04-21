import WelcomeLoginModal from "../components/WelcomeLoginModal"
import RaceCard from "../components/RaceCard"
import { validateRequest } from "../lib/auth"
import { getAllRaces } from "../queries/db"
import { satisfiesRole } from "../lib/utils"

export default async function Races({
  searchParams,
}: {
  searchParams: {
    season?: string
  }
}) {
  const races = await getAllRaces(searchParams.season)
  const { user } = await validateRequest()
  const isAdmin = satisfiesRole("ADMIN", user)
  return (
    <>
      <ul role="list" className="space-y-4 w-full max-w-[500px]">
        {races
          .filter((r) => isAdmin || r.Participant.length > 0)
          .map((race) => {
            return (
              <li key={race.id}>
                <RaceCard id={race.id} />
              </li>
            )
          })}
      </ul>
      <WelcomeLoginModal user={user} />
    </>
  )
}
