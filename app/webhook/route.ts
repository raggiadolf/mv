import { NextResponse } from "next/server";
import prisma from "../lib/db";
import { StravaTokens } from "arctic";
import { strava } from "../lib/auth";
import { isFriday, addSeconds } from "date-fns";

export async function POST(req: Request): Promise<NextResponse> {
  const data = await req.json();
  console.log("webhook event received!", data);
  if (data.object_type === "activity" && data.aspect_type === "create") {
    const user = await prisma.user.findUnique({
      where: {
        strava_id: parseInt(data.owner_id),
      },
      select: {
        strava_refresh_token: true,
        id: true,
      },
    });
    if (!user?.strava_refresh_token) {
      console.error("No refresh token found for user", data.owner_id);
      return NextResponse.json({ received: true });
    }
    const tokens: StravaTokens = await strava.refreshAccessToken(
      user.strava_refresh_token
    );
    await prisma.user.update({
      where: {
        strava_id: parseInt(data.owner_id),
      },
      data: {
        strava_refresh_token: tokens.refreshToken,
      },
    });
    const res = await fetch(
      `https://www.strava.com/api/v3/activities/${data.object_id}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );
    const activity = await res.json();
    console.log("activity", activity);
    if (
      activity.type === "Ride" &&
      isFriday(new Date(activity.start_date_local)) &&
      new Date(activity.start_date_local).getHours() >= 5 &&
      new Date(activity.start_date_local).getHours() <= 7
    ) {
      // This is probably a MV ride
      let race = await prisma.race.findFirst({
        where: {
          date: {
            gte: new Date(activity.start_date_local.split("T")[0]),
            lte: new Date(
              `${activity.start_date_local.split("T")[0]}T23:59:59`
            ),
          },
        },
        select: {
          id: true,
        },
      });
      if (!race) {
        // Create if not available?
        race = await prisma.race.create({
          data: {
            date: new Date(
              `${activity.start_date_local.split("T")[0]}T06:10:00`
            ),
            title: "Morgunvaktin",
            race_type: "RACE",
          },
        });
      }
      try {
        await prisma.participant.create({
          data: {
            user_id: user.id,
            race_id: race.id,
            strava_activity_id: activity.id,
            segment_efforts: {
              create: activity.segment_efforts.map((effort: any) => ({
                strava_segment_id: effort.segment.id,
                elapsed_time_in_seconds: effort.elapsed_time,
                start_date: effort.start_date_local,
                end_date: addSeconds(
                  effort.start_date_local,
                  effort.elapsed_time
                ),
                is_kom: !!effort.is_kom,
                average_watts: effort.average_watts,
                distance_in_meters: effort.distance,
              })),
            },
            // segment_efforts: activity.segment_efforts.map((effort: any) => ({
            //   strava_segment_id: effort.segment.id.toString(),
            //   elapsed_time_in_seconds: effort.elapsed_time,
            //   starte_date_local: new Date(effort.start_date_local),
            //   is_kom: effort.is_kom,
            //   average_watts: effort.average_watts,
            //   distance_in_meters: effort.distance,
            // })),
          },
        });
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
