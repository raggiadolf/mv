import prisma from "./db";

async function main() {
  const jonG = await prisma.user.upsert({
    where: { strava_id: 1 },
    update: {},
    create: {
      id: "1",
      username: "jonG",
      firstname: "Jon",
      lastname: "Geir",
      strava_id: 1,
      profile:
        "https://dgalywyr863hv.cloudfront.net/pictures/athletes/34368479/12094008/15/large.jpg",
    },
  });
  const ingvar = await prisma.user.upsert({
    where: { strava_id: 2 },
    update: {},
    create: {
      id: "2",
      username: "ingvar",
      firstname: "🐏 Ingvar",
      lastname: "Ómarsson",
      strava_id: 2,
      profile:
        "https://dgalywyr863hv.cloudfront.net/pictures/athletes/10807/9892/13/large.jpg",
    },
  });
  const oskar = await prisma.user.upsert({
    where: { strava_id: 3 },
    update: {},
    create: {
      id: "3",
      username: "oskar",
      firstname: "🐺 Óskar",
      lastname: "Ómarsson",
      strava_id: 3,
      profile:
        "https://dgalywyr863hv.cloudfront.net/pictures/athletes/125100/16169/7/large.jpg",
    },
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
