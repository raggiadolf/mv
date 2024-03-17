import RaceTable from "@/app/components/RaceTable";

export default async function Race({ params }: { params: { id: string } }) {
  let race;
  try {
    race = await prisma?.race.findUniqueOrThrow({
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
  } catch (e) {
    console.error(e);
    return null;
  }
  console.log("race", race);
  if (!race) return null; // TODO: Empty state
  return <RaceTable race={race} />;
}
