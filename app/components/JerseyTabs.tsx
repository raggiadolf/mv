"use client";
import { Tabs, Tab } from "@nextui-org/react";
import { Jersey } from "./Jerseys";

export default function JerseyTabs(
  {
    tabs,
    selectedTab,
    setSelectedTab,
    children,
    isFetching
  }: {
    tabs: React.Key[],
    selectedTab: React.Key,
    setSelectedTab: (key: React.Key) => void,
    children: React.ReactNode,
    isFetching: boolean
  }
) {

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
          <Tab key={tab} title={
            <Jersey jersey={tab as "YELLOW" | "OLD" | "GREEN" | "POLKA"} className="w-8 h-8" />
          }
          >
            {isFetching ? (
              <p>Sæki niðurstöður...</p>
            ) : (
              children
            )}
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}