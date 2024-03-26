"use client"
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  User,
} from "@nextui-org/react"
import { RaceWithParticipants } from "../lib/db"

import { Jersey } from "./Jerseys"
import classNames, { getFormattedDate, getRelativeDayText } from "../lib/utils"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import JerseyTabs from "./JerseyTabs"
import { Jersey as JerseyType } from "@prisma/client"
import { differenceInMinutes, differenceInSeconds, format } from "date-fns"
import { useUserContext } from "../UserContext"
import { satisfiesRole } from "../lib/utils"

async function getResultsForRace(raceId: number, jersey: string) {
  return await fetch(`/race/${raceId}/results?jersey=${jersey}`).then((res) =>
    res.json()
  )
}

export default function RaceTable({ race }: { race: RaceWithParticipants }) {
  const [selectedTab, setSelectedTab] = useState<React.Key>(
    Object.values(JerseyType)[0]
  )
  const tabs = Object.values(JerseyType)

  const { user } = useUserContext()

  const { data, isFetching } = useQuery<
    {
      User: {
        id: string
        strava_id: number
        firstname: string
        lastname: string
        profile: string
      }
      segment_effort: {
        end_date: string
        is_kom: boolean
        average_watts: number
      }
      jerseys: JerseyType[]
    }[]
  >({
    queryKey: ["results", race.id, selectedTab],
    queryFn: () => getResultsForRace(race.id, selectedTab as string),
  })

  return (
    <div className="w-full text-white">
      <DateHeader date={race.date} />
      <JerseyTabs
        tabs={tabs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isFetching={isFetching}
      >
        {data ? (
          <Table
            classNames={{
              th: ["group-data-[first=true]: max-w-[1px]"],
            }}
          >
            <TableHeader>
              <TableColumn>Sæti</TableColumn>
              <TableColumn>Nafn</TableColumn>
              <TableColumn>Tími</TableColumn>
            </TableHeader>
            <TableBody emptyContent={"Engir þátttakendur"}>
              {data
                .sort(
                  (a, b) =>
                    new Date(a.segment_effort?.end_date).getTime() -
                    new Date(b.segment_effort?.end_date).getTime()
                )
                .map((p, i) => (
                  <TableRow key={p.User.id}>
                    <TableCell className="max-w-5">
                      {i === 0 ? (
                        <Jersey
                          jersey={selectedTab as JerseyType}
                          className="h-5 w-5"
                        />
                      ) : (
                        i + 1
                      )}
                    </TableCell>
                    <TableCell className="flex items-center">
                      <User
                        avatarProps={{
                          radius: "lg",
                          src: p.User.profile || "",
                        }}
                        name={`${p.User.firstname} ${p.User.lastname}`}
                      />
                    </TableCell>
                    <TableCell>
                      {p.segment_effort
                        ? i === 0
                          ? `-`
                          : `+ ${differenceInMinutes(
                              p.segment_effort.end_date,
                              data?.at(0)?.segment_effort?.end_date || 0
                            )
                              .toString()
                              .padStart(2, "0")}:${differenceInSeconds(
                              p.segment_effort.end_date,
                              data?.at(0)?.segment_effort?.end_date || 0
                            )
                              .toString()
                              .padStart(2, "0")}`
                        : null}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : null}
      </JerseyTabs>
      {satisfiesRole("ADMIN", user) && (
        <div className="flex justify-end">
          <AdminMenu raceId={race.id} />
        </div>
      )}
    </div>
  )
}

function DateHeader({ date }: { date: Date }) {
  const dayText = getRelativeDayText(date)
  const formattedDate = getFormattedDate(date)
  return (
    <div className="flex items-center space-x-1 justify-center mb-4">
      <p className="text-md font-semibold text-white">{dayText}</p>
      <p className="text-gray-300 text-sm">{"\u2022"}</p>
      <p className="text-md text-gray-200">{formattedDate}</p>
    </div>
  )
}

async function recalculateResultsForRace(raceId: number) {
  return await fetch(`/race/${raceId}/results/recalculate`, {
    method: "POST",
  })
}
async function refreshRace(raceId: number) {
  return await fetch(`/race/${raceId}/results/refresh`, {
    method: "POST",
  })
}

function AdminMenu({ raceId }: { raceId: number }) {
  const queryClient = useQueryClient()
  const recalculateMutation = useMutation({
    mutationFn: () => recalculateResultsForRace(raceId),
    onSettled: async () => {
      return await queryClient.invalidateQueries({
        queryKey: ["results", raceId],
      })
    },
  })
  const refreshRaceMutation = useMutation({
    mutationFn: () => refreshRace(raceId),
    onSettled: async () => {
      return await queryClient.invalidateQueries({
        queryKey: ["results", raceId],
      })
    },
  })
  const loading = recalculateMutation.isPending || refreshRaceMutation.isPending
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly variant="light" isDisabled={loading}>
          <SettingsIcon
            className={classNames("h-5 w-5", loading ? "animate-spin" : "")}
          />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        onAction={(key) => {
          if (key === "rerun_results") recalculateMutation.mutate()
          else if (key === "refresh_race") refreshRaceMutation.mutate()
        }}
      >
        <DropdownItem key="rerun_results" aria-label="Rerun results">
          <p className="font-semibold">Endurreikna úrslit</p>
        </DropdownItem>
        <DropdownItem key="refresh_race" aria-label="Refresh race">
          <p className="font-semibold">Endurhlaða keppni fyrir alla</p>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

function SettingsIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  )
}
