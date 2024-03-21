"use client"
import {
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
import { getFormattedDate, getRelativeDayText } from "../lib/utils"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import JerseyTabs from "./JerseyTabs"
import { Jersey as JerseyType } from "@prisma/client"
import { differenceInSeconds, format, formatDistance } from "date-fns"

async function getResultsForRace(raceId: number, jersey: string) {
  return await fetch(`/race/${raceId}/results?jersey=${jersey}`).then((res) =>
    res.json()
  )
}

export default function RaceTable({ race }: { race: RaceWithParticipants }) {
  const [selectedTab, setSelectedTab] = useState<React.Key>("YELLOW")
  const tabs = ["YELLOW", "OLD", "GREEN", "POLKA"]

  const { data, isFetching } = useQuery<
    {
      User: {
        id: string
        strava_id: number
        firstname: string
        lastname: string
        profile: string
      }
      segment_efforts: {
        end_date: Date
        is_kom: boolean
        average_watts: number
      }[]
      jerseys: JerseyType[]
    }[]
  >({
    queryKey: ["results", race.id, selectedTab],
    queryFn: () => getResultsForRace(race.id, selectedTab as string),
  })
  console.log("data", data)

  const endTimeForFirst = data?.at(0)?.segment_efforts.at(0)?.end_date

  return (
    <div className="w-full">
      <DateHeader date={race.date} />
      <JerseyTabs
        tabs={tabs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isFetching={isFetching}
      >
        {data ? (
          <Table>
            <TableHeader>
              <TableColumn>Sæti</TableColumn>
              <TableColumn>Nafn</TableColumn>
              <TableColumn>Tími</TableColumn>
            </TableHeader>
            <TableBody emptyContent={"Engir þátttakendur"}>
              {data.map((p, i) => (
                <TableRow key={p.User.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="flex items-center">
                    <User
                      avatarProps={{
                        radius: "lg",
                        src: p.User.profile || "",
                      }}
                      name={p.User.firstname}
                    />
                    {p.jerseys.map((j) => (
                      <Jersey key={j} jersey={j} className="h-4 w-4" />
                    ))}
                  </TableCell>
                  <TableCell>
                    {p.segment_efforts.length > 0
                      ? i === 0
                        ? format(p.segment_efforts[0].end_date, "HH:MM")
                        : differenceInSeconds(
                            p.segment_efforts[0].end_date,
                            endTimeForFirst!
                          )
                      : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </JerseyTabs>
    </div>
  )

  function RTable({
    participants,
  }: {
    participants: {
      firstname: string
      lastname: string
      strava_id: number
      profile: string
      Participant: {
        race_id: number
        strava_activity_id: number
        Race: {
          date: string
        }
      }
    }[]
  }) {
    return (
      <Table>
        <TableHeader>
          <TableColumn>Sæti</TableColumn>
          <TableColumn>Nafn</TableColumn>
        </TableHeader>
        <TableBody>{[]}</TableBody>
      </Table>
    )
  }

  // return (
  //   <div className="w-full">
  //     <DateHeader date={race.date} />
  //     <Table isCompact isStriped>
  //       <TableHeader>
  //         <TableColumn>Sæti</TableColumn>
  //         <TableColumn>Nafn</TableColumn>
  //       </TableHeader>
  //       <TableBody emptyContent={"Engir þátttakendur"}>
  //         {race.Participant.sort(sortByJerseys).map((p, i) => (
  //           <TableRow key={p.id}>
  //             <TableCell>{i + 1}</TableCell>
  //             <TableCell className="flex items-center">
  //               <User
  //                 avatarProps={{ radius: "lg", src: p.User.profile || "" }}
  //                 name={p.User.firstname}
  //               />
  //               {p.jerseys.map((j) => (
  //                 <Jersey key={j} jersey={j} className="h-4 w-4" />
  //               ))}
  //             </TableCell>
  //           </TableRow>
  //         ))}
  //       </TableBody>
  //     </Table>
  //   </div>
  // );
}

// TODO: Sort by MV segment
const jerseyOrder = ["YELLOW", "OLD", "POLKA", "GREEN", null]
const sortByJerseys = (a: any, b: any) => {
  return jerseyOrder.indexOf(a.jersey) - jerseyOrder.indexOf(b.jersey)
}

function DateHeader({ date }: { date: Date }) {
  const dayText = getRelativeDayText(date)
  const formattedDate = getFormattedDate(date)
  return (
    <div className="flex items-center space-x-1 justify-center mb-4">
      <p className="text-md font-semibold text-gray-900">{dayText}</p>
      <p className="text-gray-600 text-sm">{"\u2022"}</p>
      <p className="text-md text-gray-500">{formattedDate}</p>
    </div>
  )
}
