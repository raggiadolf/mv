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

export default function RaceTable({ race }: { race: RaceWithParticipants }) {
  return (
    <Table isCompact isStriped>
      <TableHeader>
        <TableColumn>NAME</TableColumn>
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
  );
}

const jerseyOrder = ["YELLOW", "OLD", "POLKA", "GREEN", null];
const sortByJerseys = (a: any, b: any) => {
  return jerseyOrder.indexOf(a.jersey) - jerseyOrder.indexOf(b.jersey);
};
