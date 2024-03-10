import { NextResponse } from "next/server";
import prisma from "../lib/db";
import { StravaTokens } from "arctic";
import { strava } from "../lib/auth";
import { isFriday } from "date-fns";

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
    if (
      activity.type === "Ride" &&
      isFriday(new Date(activity.start_date_local)) &&
      new Date(activity.start_date_local).getHours() >= 5 &&
      new Date(activity.start_date_local).getHours() <= 7
    ) {
      // This is probably a MV ride
      let race = await prisma.race.findFirst({
        where: {
          date: { equals: new Date(activity.start_date_local.split("T")[0]) },
        },
        select: {
          id: true,
        },
      });
      if (!race) {
        race = await prisma.race.create({
          data: {
            date: new Date(
              `${activity.start_date_local.split("T")[0]}T06:10:00`
            ),
            title: "Morgunvaktin",
          },
        });
      }
      await prisma.participant.create({
        data: {
          user_id: user.id,
          race_id: race.id,
          strava_activity_id: activity.id.toString(),
        },
      });
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
