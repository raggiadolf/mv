"use client"
import { Tabs, Tab } from "@nextui-org/react"
import { Jersey } from "./Jerseys"
import { Jersey as JerseyType } from "@prisma/client"

export default function JerseyTabs({
  tabs,
  selectedTab,
  setSelectedTab,
  children,
  isFetching,
}: {
  tabs: React.Key[]
  selectedTab: React.Key
  setSelectedTab: (key: React.Key) => void
  children: React.ReactNode
  isFetching: boolean
}) {
  return (
    <div className="flex w-full flex-col">
      <Tabs
        variant="light"
        classNames={{
          tabList: "gap-6 w-full relative justify-center",
          tab: "max-w-fit px-0 h-12",
          tabContent: "w-12 flex justify-center",
        }}
        onSelectionChange={(key) => setSelectedTab(key)}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab}
            title={<Jersey jersey={tab as JerseyType} className="w-8 h-8" />}
          >
            {isFetching ? <p>Sæki niðurstöður...</p> : children}
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}
