"use client"
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
} from "@nextui-org/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

async function updateAttendance(
  raceId: number,
  userId: string,
  attendance: "present" | "absent",
  stravaActivityId?: number
) {
  return await fetch(`/race/${raceId}/attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, stravaActivityId, attendance }),
  })
}

async function getAttendance(raceId: number, userId: string) {
  return await fetch(`/race/${raceId}/attendance?user_id=${userId}`).then(
    (res) => res.json()
  )
}

export default function AttendancePill({
  userId,
  raceId,
  stravaActivityId,
}: {
  userId: string
  raceId: number
  stravaActivityId?: number
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () =>
      updateAttendance(
        raceId,
        userId,
        present ? "absent" : "present",
        stravaActivityId
      ),
    onSettled: async () => {
      return await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["attendance", raceId, userId],
        }),
        queryClient.invalidateQueries({ queryKey: ["participants", raceId] }),
      ])
    },
  })
  const { data, isFetching } = useQuery({
    queryKey: ["attendance", raceId, userId],
    queryFn: () => getAttendance(raceId, userId),
  })
  const present = !!data

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="light" isIconOnly disabled={isFetching}>
          {isFetching ? (
            <Spinner size="sm" />
          ) : present ? (
            <CheckCircle />
          ) : (
            <CrossCircle />
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Attendance"
        color={present ? "danger" : "success"}
        variant="faded"
        onAction={(_e) => {
          mutation.mutate()
        }}
      >
        <DropdownItem key={present ? "absent" : "present"}>
          {!present ? "Mætti" : "Mætti ekki"}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

function CheckCircle() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-6 h-6 text-green-500"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

function CrossCircle() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-6 h-6 text-red-500"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}
