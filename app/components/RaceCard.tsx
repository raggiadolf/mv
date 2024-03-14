import { format, isToday, isYesterday } from "date-fns";
import { is } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import prisma from "../lib/db";

import GreenJersey from "../icons/GreenJersey";
import OldJersey from "../icons/OldJersey";
import PolkaDotJersey from "../icons/PolkaDotJersey";
import YellowJersey from "../icons/YellowJersey";
import AttendancePill from "./AttendacePill";
import { validateRequest } from "../lib/auth";

const jerseyOrder = ["YELLOW", "OLD", "POLKA", "GREEN"];

export default async function RaceCard({ id }: { id: number }) {
  const { user } = await validateRequest();
  const race = await prisma.race.findUniqueOrThrow({
    where: {
      id: id,
    },
    include: {
      Participant: {
        include: {
          User: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col px-4 py-4 bg-white shadow rounded-md space-y-4">
      <Link href={`/race/${race.id}`}>
        <RelativeTime date={race.date} />
      </Link>
      <div className="flex justify-between">
        {user && (
          <AttendancePill present={true} userId={user.id} raceId={race.id} />
        )}
        <dl className="flex flex-none items-center justify-end">
          <div className="isolate flex overflow-hidden">
            <dt className="sr-only">Participants</dt>
            {race.Participant.filter((p) => p.jersey)
              .sort((a, b) => {
                return (
                  jerseyOrder.indexOf(a.jersey || "") -
                  jerseyOrder.indexOf(b.jersey || "")
                );
              })
              .map((p) => (
                <dd key={p.id} className="relative inline-block">
                  <Image
                    className="relative inline-block rounded-full ring-2 ring-white"
                    width={35}
                    height={35}
                    src={p.User.profile || ""}
                    alt={p.User.firstname || ""}
                  />
                  {(() => {
                    switch (p.jersey) {
                      case "YELLOW":
                        return (
                          <YellowJersey className="h-4 w-4 absolute bottom-0 left-0 block" />
                        );
                      case "GREEN":
                        return (
                          <GreenJersey className="h-4 w-4 absolute bottom-0 left-0 block" />
                        );
                      case "POLKA":
                        return (
                          <PolkaDotJersey className="h-4 w-4 absolute bottom-0 left-0 block" />
                        );
                      case "OLD":
                        return (
                          <OldJersey className="h-4 w-4 absolute bottom-0 left-0 block" />
                        );
                      default:
                        return null;
                    }
                  })()}
                </dd>
              ))}
          </div>
          <div className="ml-2">
            + {race.Participant.filter((p) => !p.jersey).length}
          </div>
        </dl>
      </div>
    </div>
  );
}

function RelativeTime({ date }: { date: Date }) {
  const dayText = isToday(date)
    ? "Í dag"
    : isYesterday(date)
    ? "Í gær"
    : format(date, "iiii", { locale: is });
  return (
    <div className="flex items-center space-x-1 justify-center">
      <p className="text-sm font-semibold text-gray-900">{dayText}</p>
      <p className="text-gray-600 text-sm">{"\u2022"}</p>
      <p className="text-sm text-gray-500">
        {format(date, "d. LLL").toLowerCase()}
      </p>
    </div>
  );
}
