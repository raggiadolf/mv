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
        <TableColumn>JERSEY</TableColumn>
        <TableColumn>NAME</TableColumn>
      </TableHeader>
      <TableBody emptyContent={"Engir þátttakendur"}>
        {race.Participant.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <Jersey jersey={p.jersey} className="h-10 w-10" />
            </TableCell>
            <TableCell>
              <User
                avatarProps={{ radius: "lg", src: p.User.profile || "" }}
                name={p.User.firstname}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
