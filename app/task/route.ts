import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs"
import { NextRequest, NextResponse } from "next/server"
import {
  addUserToRace,
  getRaceById,
  getStravaRefreshToken,
  updateUserStravaRefreshTokenByUserId,
} from "../queries/db"
import { StravaTokens } from "arctic"
import { strava } from "../lib/auth"

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
  const user = await getStravaRefreshToken(data.userId)
  const race = await getRaceById(data.raceId)
  if (!user || !race) {
    // TODO: Throw error, user or race not found
    console.error("missing user or race")
    console.log("user", user)
    console.log("race", race)
    return NextResponse.json({ success: false })
  }
  const tokens: StravaTokens = await strava.refreshAccessToken(
    user.strava_refresh_token
  )
  await updateUserStravaRefreshTokenByUserId(data.userId, tokens.refreshToken)
  await addUserToRace(user, race, tokens.accessToken)
  // return new Response("Hello, world!", { status: 200 })
  return NextResponse.json({ success: true })
}

export const POST = verifySignatureAppRouter(handler)
