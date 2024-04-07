import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  User,
} from "@nextui-org/react"
import { formatDistanceToNow, formatRelative } from "date-fns"
import { is } from "date-fns/locale"
import { Jersey } from "./Jerseys"

export default function LeaderboardTable({
  participants,
}: {
  participants?: {
    firstname: string
    lastname: string
    strava_id: number
    profile: string
    participation_count: number
    yellow_count: number
    old_count: number
    green_count: number
    polka_count: number
    pink_count: number
    part_percentage: number
  }[]
}) {
  return (
    <Table className="text-white">
      <TableHeader>
        <TableColumn>Nafn</TableColumn>
        <TableColumn className="text-center">Vaktir</TableColumn>
        <TableColumn className="text-center">Mætingahlutfall</TableColumn>
      </TableHeader>
      <TableBody>
        {participants
          ? participants
              .sort((a, b) => b.part_percentage - a.part_percentage)
              .map((p) => {
                return (
                  <TableRow key={p.strava_id}>
                    <TableCell>
                      <User
                        avatarProps={{ radius: "lg", src: p.profile }}
                        name={`${p.firstname} ${p.lastname}`}
                        description={
                          <div className="flex items-center space-x-1">
                            {p.yellow_count > 0 && (
                              <>
                                <p className="text-white">{`${p.yellow_count}x `}</p>
                                <Jersey jersey="YELLOW" className="w-6 h-6" />
                              </>
                            )}
                            {p.old_count > 0 && (
                              <>
                                <p className="text-white">{`${p.old_count}x `}</p>
                                <Jersey jersey="OLD" className="w-6 h-6" />
                              </>
                            )}
                            {p.pink_count > 0 && (
                              <>
                                <p className="text-white">{`${p.pink_count}x `}</p>
                                <Jersey jersey="PINK" className="w-6 h-6" />
                              </>
                            )}
                            {p.green_count > 0 && (
                              <>
                                <p className="text-white">{`${p.green_count}x `}</p>
                                <Jersey jersey="GREEN" className="w-6 h-6" />
                              </>
                            )}
                            {p.polka_count > 0 && (
                              <>
                                <p className="text-white">{`${p.polka_count}x `}</p>
                                <Jersey jersey="POLKA" className="w-6 h-6" />
                              </>
                            )}
                          </div>
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {p.participation_count}
                    </TableCell>
                    <TableCell className="text-center">{`${p.part_percentage}%`}</TableCell>
                  </TableRow>
                )
              })
          : []}
      </TableBody>
    </Table>
  )
}
