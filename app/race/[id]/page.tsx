import RaceTable from "@/app/components/RaceTable";

export default async function Race({ params }: { params: { id: string } }) {
  const race = await prisma?.race.findUniqueOrThrow({
    where: {
      id: parseInt(params.id),
    },
    include: {
      Participant: {
        include: {
          User: true,
        },
      },
    },
  });
  if (!race) return null; // TODO: Empty state
  return <RaceTable race={race} />;
}
