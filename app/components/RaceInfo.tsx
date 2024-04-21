"use client"

import { Jersey } from "./Jerseys"
import { Jersey as JerseyType } from "@prisma/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Skeleton,
  User as NextUIUser,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Listbox,
  ListboxItem,
} from "@nextui-org/react"
import classNames, {
  formatElapsedTime,
  getFormattedDate,
  getRelativeDayText,
  satisfiesRole,
  withOrdinalSuffix,
} from "../lib/utils"
import Link from "next/link"
import { ParticipantWithUser } from "../lib/db"
import { useUserContext } from "../UserContext"

async function getRaceInfo(id: number) {
  return await fetch(`/race/${id}/results/info`).then((res) => res.json())
}

export default function RaceInfo({
  id,
  participants,
  raceDate,
}: {
  id: number
  participants: ParticipantWithUser[]
  raceDate: Date
}) {
  const { data: raceInfo, isFetching: isFetchingRaceInfo } = useQuery<{
    totalNoOfUsers: number
    firstFinisher: {
      segment_efforts: {
        strava_segment_id: number
        elapsed_time_in_seconds: number
        distance_in_meters: number
        kom_rank?: number
      }[]
    }
  }>({
    queryKey: ["race", id],
    queryFn: () => getRaceInfo(id),
  })

  const finishingTime =
    raceInfo?.firstFinisher?.segment_efforts[0].elapsed_time_in_seconds || 0
  const finishingSpeed = finishingTime
    ? (
        ((raceInfo?.firstFinisher?.segment_efforts[0].distance_in_meters || 0) /
          finishingTime) *
        (18 / 5)
      ).toFixed(1)
    : 0
  const kom_rank = raceInfo?.firstFinisher?.segment_efforts[0].kom_rank
  const segment_id =
    raceInfo?.firstFinisher?.segment_efforts[0].strava_segment_id

  return (
    <div>
      {isFetchingRaceInfo ? (
        <Skeleton className="rounded-md w-[80px] h-[80px]" />
      ) : (
        <div className="grid grid-cols-2">
          <div className="flex flex-col space-y-6">
            <div>
              <Link href={`/race/${id}`}>
                <RelativeTime date={raceDate} />
              </Link>
            </div>
            <div>
              <div className="flex items-center">
                <UsersIcon className="w-4 h-4 mr-2" />
                <span className="text-sm font-extralight">
                  {participants.length}/{raceInfo!.totalNoOfUsers}
                </span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-2" />
                <span className="text-sm font-extralight">
                  {formatElapsedTime(finishingTime)}
                </span>
                {kom_rank && (
                  <a
                    href={`https://strava.com/segments/${segment_id}`}
                    target="_blank"
                    className="text-sm font-bold pl-1"
                  >
                    {kom_rank === 1
                      ? "👑"
                      : ` - ${withOrdinalSuffix(kom_rank)}`}
                  </a>
                )}
              </div>
              <div className="flex items-center col-span-2">
                <ForwardArrow className="w-4 h-4 mr-2" />
                <span className="text-sm font-extralight">{`${finishingSpeed} km/klst`}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <div className="flex justify-end">
              <JerseyWinners participants={participants} raceId={id} />
            </div>
            <div className="flex justify-end pb-4">
              <Link href={`/race/${id}`}>
                <ParticipantList participants={participants} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JerseyWinners({
  participants,
  raceId,
}: {
  participants: ParticipantWithUser[]
  raceId: number
}) {
  const { user } = useUserContext()
  const jerseys = Object.values(JerseyType)
  return (
    <div className="flex space-x-1">
      {jerseys.map((jersey: JerseyType) => {
        const participant = participants.find((p) => p.jerseys.includes(jersey))
        if (participant) {
          return (
            <UserWithJersey
              key={jersey}
              participant={participant}
              jersey={jersey}
              showAdminMenu={satisfiesRole("ADMIN", user)}
              participants={participants}
              raceId={raceId}
            />
          )
        }
      })}
    </div>
  )
}

function ParticipantList({
  participants,
}: {
  participants: ParticipantWithUser[]
}) {
  const numberfOfParticipantsToShow = 8
  const participantsWithoutJersey = participants
    .filter((p) => p.jerseys.length === 0)
    .slice(0, numberfOfParticipantsToShow)
  const jerseyUsersToAdd = participants
    .filter((p) => p.jerseys.length > 0)
    .slice(0, numberfOfParticipantsToShow - participantsWithoutJersey.length)
  const curatedParticipants = [
    ...participantsWithoutJersey,
    ...jerseyUsersToAdd,
  ]
  const remainingParticipants = participants.length - curatedParticipants.length
  return (
    <div className="isolate flex -space-x-4">
      {curatedParticipants.map((p) => (
        <NextUIUser
          key={p.User.id}
          className="rounded-full"
          avatarProps={{ src: p.User.profile || "", size: "sm" }}
          name=""
        />
      ))}
      {remainingParticipants > 0 && (
        <div className="rounded-full bg-stone-900 opacity-50 flex items-center justify-center w-8 h-8">
          <span className="text-xs opacity-100">+{remainingParticipants}</span>
        </div>
      )}
    </div>
  )
}

function UserWithJersey({
  participant,
  jersey,
  showAdminMenu = false,
  participants,
  raceId,
}: {
  participant?: ParticipantWithUser
  jersey: JerseyType
  showAdminMenu?: boolean
  participants: ParticipantWithUser[]
  raceId: number
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  return (
    <div
      className={classNames(
        "flex relative",
        showAdminMenu ? "cursor-pointer" : "cursor-default"
      )}
      onClick={showAdminMenu ? () => onOpen() : undefined}
    >
      <NextUIUser
        className="rounded-full"
        avatarProps={{ src: participant?.User.profile || "", size: "md" }}
        name=""
      />
      <Jersey
        className="h-8 w-8 absolute -bottom-2 right-0 block"
        jersey={jersey}
      />
      <SelectWinnerModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        participants={participants}
        jersey={jersey}
        raceId={raceId}
      />
    </div>
  )
}

async function updateJersey(
  jersey: JerseyType,
  participantId: number,
  raceId: number
) {
  return await fetch(`race/${raceId}/jersey`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jersey, participantId }),
  })
}

function SelectWinnerModal({
  isOpen,
  onOpenChange,
  participants,
  jersey,
  raceId,
}: {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  participants: ParticipantWithUser[]
  jersey: JerseyType
  raceId: number
}) {
  const jerseyKey = participants.find((p) => p.jerseys.includes(jersey))?.id
  const disabledKeys = jerseyKey ? [jerseyKey] : []
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (participantId: number) =>
      updateJersey(jersey, participantId, raceId),
    onSettled: async () => {
      return await queryClient.invalidateQueries({
        queryKey: ["race", raceId],
      })
    },
  })
  return (
    <Modal className="dark" isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <>
          <ModalHeader className="flex items-center text-white">
            <p>Veldu sigurvegara fyrir</p>
            <Jersey className="pl-2 h-8 w-8" jersey={jersey} />
          </ModalHeader>
          <ModalBody>
            <Listbox
              variant="faded"
              aria-label="Select a winner for this jersey"
              onAction={(key) => {
                mutation.mutate(key as number)
                onOpenChange(false)
              }}
              disabledKeys={disabledKeys}
            >
              {participants.map((p) => (
                <ListboxItem
                  key={p.id}
                  startContent={
                    <NextUIUser
                      className="rounded-full"
                      avatarProps={{ src: p.User.profile || "", size: "md" }}
                      name=""
                    />
                  }
                >
                  <p className="text-white">{p.User.firstname}</p>
                </ListboxItem>
              ))}
            </Listbox>
          </ModalBody>
        </>
      </ModalContent>
    </Modal>
  )
}

function RelativeTime({ date }: { date: Date }) {
  const dayText = getRelativeDayText(date)
  const formattedDate = getFormattedDate(date)

  return (
    <div className="flex flex-col justify-center">
      <p className="text-md font-medium text-white">{dayText}</p>
      <p className="text-md text-gray-200">{formattedDate}</p>
    </div>
  )
}

function UsersIcon({ className }: { className: string }) {
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
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  )
}
function ClockIcon({ className }: { className: string }) {
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
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

function ForwardArrow({ className }: { className: string }) {
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
        d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z"
      />
    </svg>
  )
}
