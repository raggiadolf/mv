import Link from "next/link";
import Image from "next/image";

import AttendancePill from "./AttendancePill";
import { validateRequest } from "../lib/auth";
import { Jersey } from "./Jerseys";
import { getFormattedDate, getRelativeDayText } from "../lib/utils";
import { getJerseyInfoForRace, getRaceById } from "../queries/mv";
import { User, Jersey as JerseyType } from "@prisma/client";

export default async function RaceCard({ id }: { id: number }) {
  const { user } = await validateRequest();
  const race = await getRaceById(id);

  const jerseyToDisplay = "YELLOW";
  const yellowJerseyInfo = await getJerseyInfoForRace(id, jerseyToDisplay);

  if (!race) return null;

  const displayUsers = getUsersToDisplay(race.Participant);

  return (
    <div className="flex flex-col px-4 py-4 bg-white shadow rounded-md space-y-4">
      <div className="flex">
        <div className="grow">
          <Link href={`/race/${race.id}`}>
            <RelativeTime date={race.date} />
          </Link>
        </div>
        {user && (
          <div className="">
            <AttendancePill
              present={race.Participant.some((p) => p.User.id === user.id)}
              userId={user.id}
              raceId={race.id}
            />
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <div className="flex">
          {yellowJerseyInfo && (
            <>
              <div className="relative">
                <a
                  href={
                    yellowJerseyInfo.activity_id
                      ? `https://www.strava.com/activities/${yellowJerseyInfo.activity_id}`
                      : "#"
                  }
                  target="_blank"
                >
                  <Image
                    className="rounded-md"
                    width={75}
                    height={75}
                    src={yellowJerseyInfo.user.profile || ""}
                    alt={yellowJerseyInfo.user.firstname || ""}
                  />
                  <Jersey
                    className="h-8 w-8 absolute -bottom-1 -right-1 block"
                    jersey={jerseyToDisplay}
                  />
                </a>
              </div>
              <div className="flex flex-col ml-2 text-sm">
                <div>
                  <p className="font-bold">{yellowJerseyInfo.user.firstname}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <p>{`⏱️ ${yellowJerseyInfo.time}`}</p>
                </div>
                <div>
                  <p>{`🏎️ ${(
                    (yellowJerseyInfo.distance / yellowJerseyInfo.time) *
                    (18 / 5)
                  ).toFixed(1)} km/klst`}</p>
                </div>
                <div>
                  {yellowJerseyInfo.watts && (
                    <p>{`⚡ ${yellowJerseyInfo.watts}w`}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-end">
          <ParticipantList
            participants={displayUsers}
            jerseyToHide={jerseyToDisplay}
            noOfRaceParticipants={race.Participant.length}
          />
        </div>
      </div>
    </div>
  );
}

function ParticipantList({
  participants,
  jerseyToHide,
  noOfRaceParticipants,
}: {
  participants: any;
  jerseyToHide: JerseyType;
  noOfRaceParticipants: number;
}) {
  return (
    <dl className="flex flex-none items-center justify-end">
      <div className="isolate flex overflow-hidden">
        <dt className="sr-only">Participants</dt>
        {participants
          .filter((u: any) => u.jersey !== jerseyToHide)
          .map((p: any) => (
            <dd key={`${p.id}-${p.jersey}`} className="relative inline-block">
              <UserWithJersey user={p.User} jersey={p.jersey} />
            </dd>
          ))}
      </div>
      <div className="ml-2">
        {participants.length < noOfRaceParticipants && (
          <span>+ {noOfRaceParticipants - participants.length}</span>
        )}
      </div>
    </dl>
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

function UserWithJersey({ user, jersey }: { user: User; jersey: JerseyType }) {
  return (
    <>
      <Image
        className="relative inline-block rounded-full ring-2 ring-white"
        width={35}
        height={35}
        src={user.profile || ""}
        alt={user.firstname || ""}
      />
      <Jersey
        className="h-4 w-4 absolute bottom-0 left-0 block"
        jersey={jersey}
      />
    </>
  );
}

const jerseyOrder = ["YELLOW", "OLD", "POLKA", "GREEN", null];
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
