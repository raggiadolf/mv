"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  User,
} from "@nextui-org/react";
import { RaceWithParticipants } from "../lib/db";

import { Jersey } from "./Jerseys";
import { getFormattedDate, getRelativeDayText } from "../lib/utils";

export default function RaceTable({ race }: { race: RaceWithParticipants }) {
  return (
    <div className="w-full">
      <DateHeader date={race.date} />
      <Table isCompact isStriped>
        <TableHeader>
          <TableColumn>Nafn</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"Engir þátttakendur"}>
          {race.Participant.sort(sortByJerseys).map((p) => (
            <TableRow key={p.id}>
              <TableCell className="flex items-center">
                <User
                  avatarProps={{ radius: "lg", src: p.User.profile || "" }}
                  name={p.User.firstname}
                />
                <Jersey jersey={p.jersey} className="ml-2 h-6 w-6" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const jerseyOrder = ["YELLOW", "OLD", "POLKA", "GREEN", null];
const sortByJerseys = (a: any, b: any) => {
  return jerseyOrder.indexOf(a.jersey) - jerseyOrder.indexOf(b.jersey);
};

function DateHeader({ date }: { date: Date }) {
  const dayText = getRelativeDayText(date);
  const formattedDate = getFormattedDate(date);
  return (
    <div className="flex items-center space-x-1 justify-center mb-4">
      <p className="text-md font-semibold text-gray-900">{dayText}</p>
      <p className="text-gray-600 text-sm">{"\u2022"}</p>
      <p className="text-md text-gray-500">{formattedDate}</p>
    </div>
  );
}
