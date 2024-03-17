"use client";
import { Tabs, Tab } from "@nextui-org/react";
import { Jersey } from "../components/Jerseys";
import LeaderboardTable from "./LeaderboardTable";
import { useEffect, useState } from "react";

export default function Leaderboard() {
  const [selectedTab, setSelectedTab] = useState<React.Key>("YELLOW");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = ["YELLOW", "OLD", "GREEN", "POLKA"];

  useEffect(() => {
    setIsLoading(true);
    fetch(`/results?jersey=${selectedTab}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data);
        setIsLoading(false);
      });
  }, [selectedTab]);

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
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <LeaderboardTable participants={results} />
            )}
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}
