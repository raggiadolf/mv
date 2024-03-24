import Link from "next/link"

import AttendancePill from "./AttendancePill"
import { validateRequest } from "../lib/auth"
import { getFormattedDate, getRelativeDayText } from "../lib/utils"
import { getRaceById } from "../queries/mv"
import RaceInfo from "./RaceInfo"

export default async function RaceCard({ id }: { id: number }) {
  const { user } = await validateRequest()
  const race = await getRaceById(id)

  if (!race) return null

  return (
    <div
      className="text-white border border-white flex flex-col px-4 py-4 bg-white shadow rounded-md space-y-4"
      style={{
        backgroundImage: `linear-gradient(-20deg, #2b5876 0%, #4e4376 100%)`,
      }}
    >
      <div className="flex">
        <div className="grow">
          <Link href={`/race/${race.id}`}>
            <RelativeTime date={race.date} />
          </Link>
        </div>
        {user && (
          <div className="-mt-3 -mr-3">
            <AttendancePill userId={user.id} raceId={race.id} />
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <RaceInfo id={id} />
      </div>
    </div>
  )
}

function RelativeTime({ date }: { date: Date }) {
  const dayText = getRelativeDayText(date)
  const formattedDate = getFormattedDate(date)

  return (
    <div className="flex items-center space-x-1 justify-center">
      <p className="text-sm font-semibold text-white">{dayText}</p>
      <p className="text-gray-300 text-sm">{"\u2022"}</p>
      <p className="text-sm text-gray-200">{formattedDate}</p>
    </div>
  )
}
