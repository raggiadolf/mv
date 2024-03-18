"use client";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { updateAttendance } from "../actions";

export default function AttendancePill({
  present,
  userId,
  raceId,
  stravaActivityId,
}: {
  present: boolean;
  userId: string;
  raceId: number;
  stravaActivityId?: number;
}) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="light" isIconOnly>
          {present ? <CheckCircle /> : <CrossCircle />}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Attendance"
        color={present ? "success" : "warning"}
        variant="faded"
        onAction={(e) =>
          updateAttendance(
            e.toString() as "present" | "absent",
            userId,
            raceId,
            stravaActivityId
          )
        }
      >
        <DropdownItem key={present ? "absent" : "present"}>
          {!present ? "Mætti" : "Mætti ekki"}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
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
  );
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
  );
}
