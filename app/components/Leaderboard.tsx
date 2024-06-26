"use client"
import LeaderboardTable from "./LeaderboardTable"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Jersey } from "@prisma/client"
import NewTabs from "./NewTabs"
import { useSearchParams } from "next/navigation"

async function getResults(jersey: string, season: string | null) {
  return await fetch(`/results?jersey=${jersey}&season=${season}`).then((res) =>
    res.json()
  )
}

export default function Leaderboard() {
  const searchParams = useSearchParams()
  const [selectedTab, setSelectedTab] = useState<React.Key | null>(null)
  const tabs = Object.values(Jersey)

  const { data, isFetching } = useQuery<
    {
      firstname: string
      lastname: string
      strava_id: number
      profile: string
      participation_count: number
      yellow_count: number
      old_count: number
      green_count: number
      polka_count: number
      pink_count: number
      part_percentage: number
    }[]
  >({
    queryKey: ["results", selectedTab, searchParams.get("season")],
    queryFn: () =>
      getResults(selectedTab as string, searchParams.get("season")),
  })

  return (
    <div className="w-full">
      {/* <div className="flex justify-end items-center px-4 pb-2">
        <NewTabs
          tabs={tabs}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          isFetching={isFetching}
        />
      </div> */}
      <LeaderboardTable participants={data} />
    </div>
  )
}
