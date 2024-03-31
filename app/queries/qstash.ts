"use server"
import { Client } from "@upstash/qstash"

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
})

export async function addUserToRaceTask(userId: string, raceId: number) {
  try {
    await qstashClient.publishJSON({
      url: process.env.QSTASH_API_URL!,
      body: {
        userId,
        raceId,
      },
    })
  } catch (e) {
    console.error("Error adding task to qstash", e)
  }
}
