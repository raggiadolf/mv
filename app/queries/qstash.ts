"use server"
import { Client } from "@upstash/qstash"

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
})

export async function addUserToRaceTask(userId: string, raceId: number) {
  await qstashClient.publishJSON({
    url: "https://efb9-213-220-127-112.ngrok-free.app/task",
    body: {
      userId,
      raceId,
    },
  })
}
