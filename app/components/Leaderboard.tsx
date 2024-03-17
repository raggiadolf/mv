"use client";
import { Tabs, Tab } from "@nextui-org/react";
import { Jersey } from "../components/Jerseys";
import LeaderboardTable from "./LeaderboardTable";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

async function getResults(jersey: string) {
  return await fetch(`/results?jersey=${jersey}`).then((res) => res.json());
}

export default function Leaderboard() {
  const [selectedTab, setSelectedTab] = useState<React.Key>("YELLOW");
  const tabs = ["YELLOW", "OLD", "GREEN", "POLKA"];

  const { data, isFetching } = useQuery<
    {
      firstname: string;
      lastname: string;
      strava_id: number;
      profile: string;
      Participant: {
        race_id: number;
        strava_activity_id: number;
        Race: {
          date: string;
        };
      }[];
      _count: { Participant: number };
    }[]
  >({
    queryKey: ["results", selectedTab],
    queryFn: () => getResults(selectedTab as string),
  });

  return (
    <div className="flex w-full flex-col">
      <Tabs
        color="primary"
        variant="underlined"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider justify-center",
          cursor: "w-full bg-[#22d3ee]",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-[#06b6d4]",
        }}
        onSelectionChange={(key) => setSelectedTab(key)}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab}
            title={
              <Jersey
                jersey={tab as "YELLOW" | "OLD" | "GREEN" | "POLKA"}
                className="w-8 h-8"
              />
            }
          >
            {isFetching ? (
              <p>Sæki niðurstöður...</p>
            ) : (
              <LeaderboardTable participants={data || []} />
            )}
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}
