import GreenJersey from "./icons/GreenJersey";
import OldJersey from "./icons/OldJersey";
import PolkaDotJersey from "./icons/PolkaDotJersey";
import YellowJersey from "./icons/YellowJersey";
import prisma from "./lib/db";
import { format } from "date-fns";
import Image from "next/image";

const jerseyOrder = ["YELLOW", "OLD", "POLKA", "GREEN"];

export default async function Races() {
  const races = await prisma.race.findMany({
    orderBy: {
      date: "desc",
    },
    include: {
      Participant: {
        include: {
          User: true,
        },
      },
    },
  });
  console.log("races", races);
  return (
    <ul role="list" className="space-y-3">
      {races.map((race) => {
        return (
          <li
            key={race.id}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-4 sm:flex-nowrap bg-white shadow sm:rounded-md sm:px-6"
          >
            <div>
              <p className="text-sm font-semibold leading-6 text-gray-900">
                {race.title}
              </p>
              <div>
                <time className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                  {format(race.date, "LLLL d, yyyy")}
                </time>
              </div>
            </div>
            <dl className="flex w-full flex-none justify-between sm:w-auto">
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
                        width={40}
                        height={40}
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
          </li>
        );
      })}
    </ul>
  );
}
