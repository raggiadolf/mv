import Link from "next/link";
import Image from "next/image";

import AttendancePill from "./AttendancePill";
import { validateRequest } from "../lib/auth";
import { Jersey } from "./Jerseys";
import { getFormattedDate, getRelativeDayText } from "../lib/utils";
import { getRaceById } from "../queries/mv";

export default async function RaceCard({ id }: { id: number }) {
  const { user } = await validateRequest();
  const race = await getRaceById(id);

  if (!race) return null;

  const displayUsers = getUsersToDisplay(race.Participant);

  return (
    <div className="flex flex-col px-4 py-4 bg-white shadow rounded-md space-y-4">
      <Link href={`/race/${race.id}`}>
        <RelativeTime date={race.date} />
      </Link>
      <div className="flex justify-between">
        {user ? (
          <AttendancePill
            present={race.Participant.some((p) => p.User.id === user.id)}
            userId={user.id}
            raceId={race.id}
          />
        ) : (
          <div />
        )}
        <dl className="flex flex-none items-center justify-end">
          <div className="isolate flex overflow-hidden">
            <dt className="sr-only">Participants</dt>
            {displayUsers.map((p, i) => (
              <dd key={p.id} className="relative inline-block">
                <Image
                  className="relative inline-block rounded-full ring-2 ring-white"
                  width={35}
                  height={35}
                  src={p.User.profile || ""}
                  alt={p.User.firstname || ""}
                />
                <Jersey
                  jersey={p.jersey}
                  className="h-4 w-4 absolute bottom-0 left-0 block"
                />
              </dd>
            ))}
          </div>
          <div className="ml-2">
            {displayUsers.length < race.Participant.length && (
              <span>+ {race.Participant.length - displayUsers.length}</span>
            )}
          </div>
        </dl>
      </div>
    </div>
  );
}

function RelativeTime({ date }: { date: Date }) {
  const dayText = getRelativeDayText(date);
  const formattedDate = getFormattedDate(date);

  return (
    <div className="flex items-center space-x-1 justify-center">
      <p className="text-sm font-semibold text-gray-900">{dayText}</p>
      <p className="text-gray-600 text-sm">{"\u2022"}</p>
      <p className="text-sm text-gray-500">{formattedDate}</p>
    </div>
  );
}

const jerseyOrder = ["YELLOW", "OLD", "POLKA", "GREEN", null];
const sortByJerseys = (a: any, b: any) => {
  return jerseyOrder.indexOf(a.jersey) - jerseyOrder.indexOf(b.jersey);
};
const getUsersToDisplay = (participants: any) => {
  const max = 4;
  const jerseyUsers = jerseyOrder
    .map((jersey) => {
      return {
        ...participants.find((p: any) => p.jerseys.includes(jersey)),
        jersey,
      };
    })
    .filter((p) => p.id);
  const fillerUsers = participants
    .filter((p: any) => !p.jerseys.length)
    .slice(0, max - jerseyUsers.length);
  return [...jerseyUsers, ...fillerUsers];
};
