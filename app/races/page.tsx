import prisma from "../lib/db";
import RaceCard from "../components/RaceCard";

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
  return (
    <ul role="list" className="space-y-3 w-full max-w-[500px]">
      {races.map((race) => {
        return (
          <li key={race.id}>
            <RaceCard id={race.id} />
          </li>
        );
      })}
    </ul>
  );
}
