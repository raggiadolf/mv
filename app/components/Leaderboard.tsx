"use client"
import LeaderboardTable from "./LeaderboardTable"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import JerseyTabs from "./JerseyTabs"
import { Jersey } from "@prisma/client"

async function getResults(jersey: string) {
  return await fetch(`/results?jersey=${jersey}`).then((res) => res.json())
}

export default function Leaderboard() {
  const [selectedTab, setSelectedTab] = useState<React.Key>("YELLOW")
  const tabs = Object.values(Jersey)

  const { data, isFetching } = useQuery<
    {
      firstname: string
      lastname: string
      strava_id: number
      profile: string
      Participant: {
        race_id: number
        strava_activity_id: number
        Race: {
          date: string
        }
      }[]
      _count: { Participant: number }
    }[]
  >({
    queryKey: ["results", selectedTab],
    queryFn: () => getResults(selectedTab as string),
  })

  return (
    <JerseyTabs
      tabs={tabs}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      isFetching={isFetching}
    >
      {data ? <LeaderboardTable participants={data} /> : null}
    </JerseyTabs>
  )
}
