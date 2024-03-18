import { NextResponse } from "next/server";
import { StravaTokens } from "arctic";
import { strava } from "../lib/auth";
import { isFriday, addSeconds } from "date-fns";
import {
  createDefaultMVRace,
  createParticipantFromStrava,
  findRaceOnDate,
  getScheduledRaceForRaceTime,
  getUserByStravaId,
  updateUserStravaRefreshtokenByStravaId,
} from "../queries/mv";

export async function POST(req: Request): Promise<NextResponse> {
  const data = await req.json();
  console.log("webhook event received!", data);
  if (data.object_type === "activity" && data.aspect_type === "create") {
    const user = await getUserByStravaId(parseInt(data.owner_id));
    if (!user?.strava_refresh_token) {
      console.error("No refresh token found for user", data.owner_id);
      return NextResponse.json({ received: true });
    }
    const tokens: StravaTokens = await strava.refreshAccessToken(
      user.strava_refresh_token
    );
    await updateUserStravaRefreshtokenByStravaId(
      parseInt(data.owner_id),
      tokens.refreshToken
    );
    const res = await fetch(
      `https://www.strava.com/api/v3/activities/${data.object_id}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );
    const activity = await res.json();
    const scheduledRace = await getScheduledRaceForRaceTime(
      new Date(activity.start_date_local)
    );
    if (activity.type === "Ride" && scheduledRace) {
      // This lands within a scheduled race timeframe
      let race = await findRaceOnDate(new Date(activity.start_date_local));
      if (!race) {
        // Create if not available?
        race = await createDefaultMVRace(new Date(activity.start_date_local));
      }

      const raceSegments = activity.segment_efforts.map((se: any) => {
        const scheduledRaceSegment = scheduledRace.RaceSegment.find(
          (rs: any) => Number(rs.strava_segment_id) === se.segment.id
        );
        if (scheduledRaceSegment) {
          return {
            strava_segment_id: se.segment.id,
            elapsed_time_in_seconds: se.elapsed_time,
            start_date: se.start_date_local,
            end_date: addSeconds(se.start_date_local, se.elapsed_time),
            is_kom: !!se.is_kom,
            average_watts: se.average_watts,
            distance_in_meters: se.distance,
            race_segment_id: scheduledRaceSegment.id,
          };
        }
        return null;
      });
      const filteredRaceSegments = raceSegments.filter(Boolean);
      try {
        await createParticipantFromStrava(
          user.id,
          race.id,
          filteredRaceSegments,
          activity.id
        );
      } catch (e) {
        console.error("Error creating participant", e);
      }
    }
  }
  return NextResponse.json({ received: true });
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && verifyToken === "STRAVA") {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return NextResponse.json({ error: "Invalid verify token" });
}
