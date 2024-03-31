import { NextResponse } from "next/server"
import {
  calculateJerseysForRace,
  createDefaultMVRace,
  createParticipantFromStrava,
  findRaceOnDate,
  getScheduledRaceForRaceTime,
  getStravaTokens,
  getUserByStravaId,
} from "../queries/db"
import { getRaceSegments, getStravaActivity } from "../queries/strava"

export async function POST(req: Request): Promise<NextResponse> {
  const data = await req.json()
  console.log("webhook event received!", data)
  if (data.object_type === "activity" && data.aspect_type === "create") {
    const user = await getUserByStravaId(parseInt(data.owner_id))
    if (!user?.strava_refresh_token) {
      console.error("No refresh token found for user", data.owner_id)
      return NextResponse.json({ received: true })
    }
    const tokens = await getStravaTokens(user.id)
    if (!tokens) {
      console.error("No tokens found for user", data.owner_id)
      return NextResponse.json({ received: true })
    }
    const activity = await getStravaActivity(data.object_id, tokens.accessToken)
    const scheduledRace = await getScheduledRaceForRaceTime(
      new Date(activity.start_date_local)
    )
    if (activity.type === "Ride" && scheduledRace) {
      // This lands within a scheduled race timeframe
      let race = await findRaceOnDate(new Date(activity.start_date_local))
      if (!race) {
        // Create if not available?
        race = await createDefaultMVRace(new Date(activity.start_date_local))
      }

      const raceSegments = await getRaceSegments(activity, scheduledRace)
      try {
        await createParticipantFromStrava(
          user.id,
          race.id,
          raceSegments,
          activity.id
        )
      } catch (e) {
        console.error("Error creating participant", e)
        return NextResponse.json({ received: true })
      }
      await calculateJerseysForRace(race.id)
    }
  }
  return NextResponse.json({ received: true })
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const mode = url.searchParams.get("hub.mode")
  const verifyToken = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")
  if (mode === "subscribe" && verifyToken === "STRAVA") {
    return NextResponse.json({ "hub.challenge": challenge })
  }
  return NextResponse.json({ error: "Invalid verify token" })
}
