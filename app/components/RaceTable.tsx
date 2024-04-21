"use client"
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  User,
  useDisclosure,
} from "@nextui-org/react"
import { RaceWithParticipants } from "../lib/db"

import { Jersey } from "./Jerseys"
import classNames, {
  formatElapsedTime,
  getDifferenceInMinutesAndSeconds,
  getFormattedDate,
  getRelativeDayText,
} from "../lib/utils"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Jersey as JerseyType, User as UserType } from "@prisma/client"
import { useUserContext } from "../UserContext"
import { satisfiesRole } from "../lib/utils"
import NewTabs from "./NewTabs"

async function getResultsForRace(raceId: number, jersey: string) {
  return await fetch(`/race/${raceId}/results?jersey=${jersey}`).then((res) =>
    res.json()
  )
}

export default function RaceTable({ race }: { race: RaceWithParticipants }) {
  const availableJerseys = race.Participant.reduce((acc, p) => {
    return [...acc, ...p.jerseys]
  }, [] as JerseyType[])
  const [selectedTab, setSelectedTab] = useState<React.Key | null>(null)
  const tabs = availableJerseys

  const handleTabChange = (key: React.Key) => {
    if (key === selectedTab) setSelectedTab(null)
    else setSelectedTab(key)
  }

  const { user } = useUserContext()

  const { data, isFetching } = useQuery<{
    participants: {
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
        elapsed_time_in_seconds: number
        distance_in_meters: number
      }
      jerseys: JerseyType[]
      strava_activity_id: number
    }[]
    race_type: "RACE" | "GROUPRIDE"
  }>({
    queryKey: ["results", race.id, selectedTab],
    queryFn: () => getResultsForRace(race.id, selectedTab as string),
  })
  const isRace = data?.race_type === "RACE"

  return (
    <div className="w-full text-white">
      <div className="flex justify-between items-center px-4 pb-2">
        <DateHeader date={race.date} />
        <NewTabs
          tabs={tabs}
          selectedTab={selectedTab}
          setSelectedTab={handleTabChange}
          isFetching={isFetching}
        />
      </div>
      <Table>
        <TableHeader>
          <TableColumn className="text-center">Sæti</TableColumn>
          <TableColumn>Nafn</TableColumn>
          <TableColumn>Tími</TableColumn>
          <TableColumn className="hidden md:table-cell">Wött</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isFetching}
          loadingContent={<div>Hleð...</div>}
          emptyContent={"Engir þátttakendur"}
        >
          {data
            ? data.participants
                .sort(
                  (a, b) =>
                    new Date(a.segment_effort?.end_date).getTime() -
                    new Date(b.segment_effort?.end_date).getTime()
                )
                .map((p, i) => (
                  <TableRow key={p.User.id}>
                    <TableCell className="text-center">{i + 1}</TableCell>
                    <TableCell className="flex items-center">
                      <a
                        href={`https://strava.com/activities/${p.strava_activity_id}`}
                        target="_blank"
                        className="text-sm"
                      >
                        <User
                          avatarProps={{
                            radius: "lg",
                            src: p.User.profile || "",
                          }}
                          description={
                            <div className="flex">
                              {p.jerseys?.map((jersey) => (
                                <Jersey
                                  key={jersey}
                                  jersey={jersey}
                                  className="h-4 w-4"
                                />
                              ))}
                            </div>
                          }
                          name={p.User.firstname}
                        />
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <a
                          href={`https://strava.com/activities/${p.strava_activity_id}`}
                          target="_blank"
                          className="text-sm"
                        >
                          {isRace && p.segment_effort
                            ? i === 0
                              ? `${formatElapsedTime(
                                  p.segment_effort.elapsed_time_in_seconds
                                )}`
                              : `+ ${getDifferenceInMinutesAndSeconds(
                                  new Date(p.segment_effort.end_date),
                                  new Date(
                                    data?.participants.at(0)?.segment_effort
                                      ?.end_date || ""
                                  )
                                )}`
                            : "☕️"}
                        </a>
                        <p className="text-xs font-light">
                          {isRace &&
                            `${(
                              (p.segment_effort?.distance_in_meters /
                                p.segment_effort?.elapsed_time_in_seconds) *
                              (18 / 5)
                            )
                              .toFixed(1)
                              .replace(".", ",")} km/klst`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col">
                        {isRace ? (
                          <>
                            <p className="text-sm">
                              {p.segment_effort?.average_watts
                                ? `${p.segment_effort.average_watts.toFixed()}`
                                : `-`}
                            </p>
                            <p className="text-xs font-light">avg w</p>
                          </>
                        ) : (
                          <p className="text-sm">💆</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            : []}
        </TableBody>
      </Table>
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
    <div className="flex flex-col justify-center">
      <p className="text-md font-medium text-white">{dayText}</p>
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
async function addUserToRace(userId: string, raceId: number) {
  return await fetch(`/race/${raceId}/add-user`, {
    method: "POST",
    body: JSON.stringify({ userId }),
    headers: {
      "Content-Type": "application/json",
    },
  })
}

function AdminMenu({ raceId }: { raceId: number }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
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
    <>
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
            else if (key === "add-user") onOpen()
          }}
        >
          <DropdownItem key="rerun_results" aria-label="Rerun results">
            <p className="font-semibold">
              Endurreikna úrslit fyrir núverandi þátttakendur
            </p>
          </DropdownItem>
          <DropdownItem key="refresh_race" aria-label="Refresh race">
            <p className="font-semibold">Sækja aftur fyrir alla notendur</p>
          </DropdownItem>
          <DropdownItem key="add-user" aria-label="Add user">
            <p className="font-semibold">Bæta við notanda</p>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <AddUserModal isOpen={isOpen} onClose={onOpenChange} raceId={raceId} />
    </>
  )
}

function AddUserModal({
  raceId,
  isOpen,
  onClose,
}: {
  raceId: number
  isOpen: boolean
  onClose: () => void
}) {
  const { data, isFetching } = useQuery<UserType[]>({
    queryKey: ["users"],
    queryFn: () => fetch("/user").then((res) => res.json()),
    enabled: isOpen,
  })
  const mutation = useMutation({
    mutationFn: (data: { userId: string }) =>
      addUserToRace(data.userId, raceId),
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="dark text-white">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Bæta við notanda</ModalHeader>
            <ModalBody>
              {isFetching ? (
                <Spinner />
              ) : (
                <div className="space-y-2">
                  {data?.map((user) => (
                    <div key={user.id} className="flex justify-between">
                      <User
                        avatarProps={{
                          radius: "lg",
                          src: user.profile || "",
                        }}
                        name={`${user.firstname} ${user.lastname}`}
                      />
                      <Button
                        onClick={() => mutation.mutate({ userId: user.id })}
                      >
                        Bæta við
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
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
