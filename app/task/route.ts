import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs"
import { NextRequest, NextResponse } from "next/server"
import { addUserToRace, getRaceById, getStravaTokens } from "../queries/db"

async function handler(request: NextRequest) {
  const data = await request.json()
  if (!data.userId || !data.raceId || typeof data.userId !== "string") {
    console.error("Error in data received in qstash handler")
    console.log("data.userId", data.userId)
    console.log("data.raceId", data.raceId)
    console.log("typeof data.userId", typeof data.userId)
    // TODO: Throw error
    return NextResponse.json({ success: false })
  }
  const tokens = await getStravaTokens(data.userId)
  const race = await getRaceById(data.raceId)
  if (!tokens || !race) {
    // TODO: Throw error, user tokens or race not found
    console.error("missing tokens or race")
    console.log("user", tokens)
    console.log("race", race)
    return NextResponse.json({ success: false })
  }
  await addUserToRace(data.userId, race, tokens.accessToken)
  return NextResponse.json({ success: true })
}

export const POST = verifySignatureAppRouter(handler)
