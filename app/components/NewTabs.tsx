import { Button } from "@nextui-org/react"
import classNames from "../lib/utils"
import { Jersey } from "./Jerseys"
import { Jersey as JerseyType } from "@prisma/client"

export default function NewTabs({
  tabs,
  selectedTab,
  setSelectedTab,
  isFetching,
}: {
  tabs: React.Key[]
  selectedTab: React.Key | null
  setSelectedTab: (key: React.Key) => void
  isFetching: boolean
}) {
  return (
    <div className="space-x-1">
      {tabs.map((tab) => (
        <Button
          isIconOnly
          key={tab}
          variant="light"
          onClick={() => setSelectedTab(tab)}
          className={classNames(tab === selectedTab ? "bg-default/40" : "")}
        >
          <Jersey jersey={tab as JerseyType} className="w-8 h-8" />
        </Button>
      ))}
    </div>
  )
}
