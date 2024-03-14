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
  console.log("race", race);
  return <div>{params.id}</div>;
}
