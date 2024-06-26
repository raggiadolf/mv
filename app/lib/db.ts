import { PrismaClient, Prisma } from "@prisma/client"

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma

/* types */
export type RaceWithParticipants = Prisma.RaceGetPayload<{
  include: {
    Participant: {
      include: {
        User: true
      }
    }
  }
}>

export type ScheduledRaceWithSegments = Prisma.ScheduledRaceGetPayload<{
  include: {
    RaceSegment: true
  }
}>

export type RaceWithScheduledRace = Prisma.RaceGetPayload<{
  include: {
    ScheduledRace: {
      include: {
        RaceSegment: true
      }
    }
  }
}>

export type ParticipantWithUser = Prisma.ParticipantGetPayload<{
  include: {
    User: true
  }
}>
