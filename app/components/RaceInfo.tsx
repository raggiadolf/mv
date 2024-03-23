"use client"

import Image from "next/image"
import { Jersey } from "./Jerseys"
import { Jersey as JerseyType, Participant, User } from "@prisma/client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@nextui-org/react"
import classNames from "../lib/utils"

async function getJerseyInfo(id: number, jersey: JerseyType) {
  return await fetch(`/race/${id}/jersey?jersey=${jersey}`).then((res) =>
    res.json()
  )
}
async function getParticipants(id: number) {
  return await fetch(`/race/${id}/participants`).then((res) => res.json())
}

export default function RaceInfo({ id }: { id: number }) {
  const [jerseyToDisplay, setJerseyToDisplay] = useState<JerseyType>("YELLOW")
  const { data: jerseyInfo, isFetching: isFetchingInfo } = useQuery<{
    time: number
    distance: number
    watts: number
    is_kom: boolean
    user: User
    activity_id?: number
  }>({
    queryKey: ["race", id, jerseyToDisplay],
    queryFn: () => getJerseyInfo(id, jerseyToDisplay),
  })
  const { data: allParticipants } = useQuery<Participant[]>({
    queryKey: ["participants", id],
    queryFn: () => getParticipants(id),
  })

  const displayUsers = getUsersToDisplay(allParticipants || [])

  return (
    <>
      <div className="flex">
        {isFetchingInfo ? (
          <Skeleton className="rounded-md w-[80px] h-[80px]" />
        ) : jerseyInfo ? (
          <>
            <div className="relative">
              <a
                href={
                  jerseyInfo.activity_id
                    ? `https://www.strava.com/activities/${jerseyInfo.activity_id}`
                    : "#"
                }
                target="_blank"
              >
                <Image
                  className="rounded-md"
                  width={75}
                  height={75}
                  src={jerseyInfo.user.profile || ""}
                  alt={jerseyInfo.user.firstname || ""}
                />
                <Jersey
                  className="h-8 w-8 absolute -bottom-1 -right-1 block"
                  jersey={jerseyToDisplay}
                />
              </a>
            </div>
            <div className="flex flex-col ml-2 text-sm">
              <div>
                <p className="font-bold">{jerseyInfo.user.firstname}</p>
              </div>
              <div className="flex items-center space-x-1">
                <p>{`⏱️ ${(~~(jerseyInfo.time / 60))
                  .toString()
                  .padStart(2, "0")}:${(jerseyInfo.time % 60)
                  .toString()
                  .padStart(2, "0")}`}</p>
              </div>
              <div>
                <p>{`🏎️ ${(
                  (jerseyInfo.distance / jerseyInfo.time) *
                  (18 / 5)
                ).toFixed(1)} km/klst`}</p>
              </div>
              <div>
                {jerseyInfo.watts && <p>{`⚡ ${jerseyInfo.watts}w`}</p>}
              </div>
            </div>
          </>
        ) : (
          <div /> // TODO: Empty state
        )}
      </div>
      <div className="flex items-end">
        <ParticipantList
          participants={displayUsers}
          jerseyToHide={jerseyToDisplay}
          noOfRaceParticipants={allParticipants?.length || 0}
          setJerseyToDisplay={setJerseyToDisplay}
        />
      </div>
    </>
  )
}

function ParticipantList({
  participants,
  jerseyToHide,
  noOfRaceParticipants,
  setJerseyToDisplay,
}: {
  participants: any
  jerseyToHide: JerseyType
  noOfRaceParticipants: number
  setJerseyToDisplay: (jersey: JerseyType) => void
}) {
  return (
    <dl className="flex flex-none items-center justify-end">
      <div className="isolate flex overflow-hidden">
        <dt className="sr-only">Participants</dt>
        {participants
          .filter((u: any) => u.jersey !== jerseyToHide)
          .map((p: any) => (
            <dd
              onClick={
                p.jersey ? () => setJerseyToDisplay(p.jersey) : undefined
              }
              key={`${p.id}-${p.jersey}`}
              className={classNames(
                "relative inline-block",
                p.jersey ? "cursor-pointer" : "cursor-default"
              )}
            >
              <UserWithJersey user={p.User} jersey={p.jersey} />
            </dd>
          ))}
      </div>
      <div className="ml-2">
        {participants.length < noOfRaceParticipants && (
          <span>+ {noOfRaceParticipants - participants.length}</span>
        )}
      </div>
    </dl>
  )
}

function UserWithJersey({ user, jersey }: { user: User; jersey: JerseyType }) {
  return (
    <>
      <Image
        className="relative inline-block rounded-full ring-2 ring-white"
        width={35}
        height={35}
        src={user.profile || ""}
        alt={user.firstname || ""}
      />
      <Jersey
        className="h-4 w-4 absolute bottom-0 left-0 block"
        jersey={jersey}
      />
    </>
  )
}

const jerseyOrder = ["YELLOW", "OLD", "POLKA", "GREEN", null]
const getUsersToDisplay = (participants: any) => {
  const max = 4
  const jerseyUsers = jerseyOrder
    .map((jersey) => {
      return {
        ...participants.find((p: any) => p.jerseys.includes(jersey)),
        jersey,
      }
    })
    .filter((p) => p.id)
  const fillerUsers = participants
    .filter((p: any) => !p.jerseys.length)
    .slice(0, max - jerseyUsers.length)
  return [...jerseyUsers, ...fillerUsers]
}
