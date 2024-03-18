"use client";

import Image from "next/image";
import { Jersey } from "./Jerseys";
import { Jersey as JerseyType, Participant, User } from "@prisma/client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@nextui-org/react";

async function getJerseyInfo(id: number, jersey: JerseyType) {
  return await fetch(`/race/${id}/jersey?jersey=${jersey}`).then((res) =>
    res.json()
  );
}

export default function RaceInfo({
  id,
  participants,
}: {
  id: number;
  participants: Participant[];
}) {
  const [jerseyToDisplay, setJerseyToDisplay] = useState<JerseyType>("YELLOW");
  const { data, isFetching } = useQuery<{
    time: number;
    distance: number;
    watts: number;
    is_kom: boolean;
    user: User;
    activity_id?: number;
  }>({
    queryKey: ["race", id, jerseyToDisplay],
    queryFn: () => getJerseyInfo(id, jerseyToDisplay),
  });
  console.log("data", data);
  console.log("jerseyToDisplay", jerseyToDisplay);

  const displayUsers = getUsersToDisplay(participants);

  return (
    <>
      <div className="flex">
        {isFetching ? (
          <Spinner size="lg" />
        ) : data ? (
          <>
            <div className="relative">
              <a
                href={
                  data.activity_id
                    ? `https://www.strava.com/activities/${data.activity_id}`
                    : "#"
                }
                target="_blank"
              >
                <Image
                  className="rounded-md"
                  width={75}
                  height={75}
                  src={data.user.profile || ""}
                  alt={data.user.firstname || ""}
                />
                <Jersey
                  className="h-8 w-8 absolute -bottom-1 -right-1 block"
                  jersey={jerseyToDisplay}
                />
              </a>
            </div>
            <div className="flex flex-col ml-2 text-sm">
              <div>
                <p className="font-bold">{data.user.firstname}</p>
              </div>
              <div className="flex items-center space-x-1">
                <p>{`⏱️ ${~~(data.time / 60)}:${data.time % 60}`}</p>
              </div>
              <div>
                <p>{`🏎️ ${((data.distance / data.time) * (18 / 5)).toFixed(
                  1
                )} km/klst`}</p>
              </div>
              <div>{data.watts && <p>{`⚡ ${data.watts}w`}</p>}</div>
            </div>
          </>
        ) : (
          <div /> // TODO: Empty state
        )}
      </div>
      <div className="flex items-end">
        <ParticipantList
          participants={displayUsers}
          jerseyToHide={jerseyToDisplay}
          noOfRaceParticipants={participants.length}
          setJerseyToDisplay={setJerseyToDisplay}
        />
      </div>
    </>
  );
}

function ParticipantList({
  participants,
  jerseyToHide,
  noOfRaceParticipants,
  setJerseyToDisplay,
}: {
  participants: any;
  jerseyToHide: JerseyType;
  noOfRaceParticipants: number;
  setJerseyToDisplay: (jersey: JerseyType) => void;
}) {
  return (
    <dl className="flex flex-none items-center justify-end">
      <div className="isolate flex overflow-hidden">
        <dt className="sr-only">Participants</dt>
        {participants
          .filter((u: any) => u.jersey !== jerseyToHide)
          .map((p: any) => (
            <dd
              onClick={() => setJerseyToDisplay(p.jersey)}
              key={`${p.id}-${p.jersey}`}
              className="relative inline-block cursor-pointer"
            >
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
