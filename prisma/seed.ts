import prisma from "../app/lib/db"

async function main() {
  // ScheduledRaces
  const fridayRace = await prisma.scheduledRace.upsert({
    where: { id: 1 },
    update: {},
    create: {
      race_type: "RACE",
      weekday: 4,
      start_hour: 6,
      start_minute: 10,
      title: "Morgunvakt",
    },
  })
  const fridaySegment = await prisma.raceSegment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      strava_segment_id: 28414406,
      jersey: "YELLOW",
      scheduledRaceId: fridayRace.id,
    },
  })
  // Users
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
      strava_refresh_token: "asdf",
      strava_access_token: "asdf",
      access_token_expires_at: new Date(),
    },
  })
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
      strava_refresh_token: "asdf",
      strava_access_token: "asdf",
      access_token_expires_at: new Date(),
    },
  })
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
      strava_refresh_token: "asdf",
      strava_access_token: "asdf",
      access_token_expires_at: new Date(),
    },
  })
  const thomas = await prisma.user.upsert({
    where: { strava_id: 4 },
    update: {},
    create: {
      id: "4",
      username: "thomas",
      firstname: "🐺 Thomas",
      lastname: "Jensen",
      strava_id: 4,
      profile:
        "https://dgalywyr863hv.cloudfront.net/pictures/athletes/9345719/2936658/7/large.jpg",
      strava_refresh_token: "asdf",
      strava_access_token: "asdf",
      access_token_expires_at: new Date(),
    },
  })
  const eyjo = await prisma.user.upsert({
    where: { strava_id: 5 },
    update: {},
    create: {
      id: "5",
      username: "eyjo",
      firstname: "Eyjólfur",
      lastname: "Guðgeirsson",
      strava_id: 5,
      profile:
        "https://dgalywyr863hv.cloudfront.net/pictures/athletes/8859398/2693445/7/large.jpg",
      strava_refresh_token: "asdf",
      strava_access_token: "asdf",
      access_token_expires_at: new Date(),
    },
  })
  const arnarGauti = await prisma.user.upsert({
    where: { strava_id: 6 },
    update: {},
    create: {
      id: "6",
      username: "arnarGauti",
      firstname: "Arnar Gauti",
      lastname: "Reynisson",
      strava_id: 6,
      profile:
        "https://dgalywyr863hv.cloudfront.net/pictures/athletes/3860912/1246488/7/large.jpg",
      strava_refresh_token: "asdf",
      strava_access_token: "asdf",
      access_token_expires_at: new Date(),
    },
  })

  // Races
  const race1 = await prisma.race.upsert({
    where: { id: 1 },
    update: {},
    create: {
      date: new Date("2023-06-02T06:00:00"),
      scheduled_race_id: fridayRace.id,
    },
  })
  const race2 = await prisma.race.upsert({
    where: { id: 2 },
    update: {},
    create: {
      date: new Date("2023-06-09T06:00:00"),
      scheduled_race_id: fridayRace.id,
    },
  })
  const race3 = await prisma.race.upsert({
    where: { id: 3 },
    update: {},
    create: {
      date: new Date("2023-06-16T06:00:00"),
      scheduled_race_id: fridayRace.id,
    },
  })
  const race4 = await prisma.race.upsert({
    where: { id: 4 },
    update: {},
    create: {
      date: new Date("2023-06-23T06:00:00"),
      scheduled_race_id: fridayRace.id,
    },
  })
  const race5 = await prisma.race.upsert({
    where: { id: 5 },
    update: {},
    create: {
      date: new Date("2023-06-30T06:00:00"),
      scheduled_race_id: fridayRace.id,
    },
  })

  // Race Participants
  const participant1 = await prisma.participant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      user_id: jonG.id,
      race_id: race5.id,
      jerseys: ["POLKA"],
      strava_activity_id: 1234,
    },
  })
  const participant2 = await prisma.participant.upsert({
    where: { id: 2 },
    update: {},
    create: {
      user_id: ingvar.id,
      race_id: race5.id,
      jerseys: ["YELLOW"],
      strava_activity_id: 1234,
    },
  })
  const participant3 = await prisma.participant.upsert({
    where: { id: 3 },
    update: {},
    create: {
      user_id: oskar.id,
      race_id: race5.id,
      jerseys: ["GREEN"],
      strava_activity_id: 1234,
    },
  })
  const participant4 = await prisma.participant.upsert({
    where: { id: 4 },
    update: {},
    create: {
      user_id: thomas.id,
      race_id: race5.id,
      jerseys: ["OLD"],
      strava_activity_id: 1234,
    },
  })
  const participant5 = await prisma.participant.upsert({
    where: { id: 5 },
    update: {},
    create: {
      user_id: eyjo.id,
      race_id: race5.id,
      strava_activity_id: 1234,
    },
  })
  const participant6 = await prisma.participant.upsert({
    where: { id: 6 },
    update: {},
    create: {
      user_id: arnarGauti.id,
      race_id: race5.id,
      strava_activity_id: 1234,
    },
  })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
