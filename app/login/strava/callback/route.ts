import { strava, lucia } from "../../../lib/auth";
import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import { PrismaClient } from "@prisma/client";

import type { User } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request): Promise<Response> {
  console.log("here");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get("strava_oauth_state")?.value ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await strava.validateAuthorizationCode(code);
    const stravaUserResponse = await fetch(
      "https://www.strava.com/api/v3/athlete",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );
    const stravaUser: StravaUser = await stravaUserResponse.json();
    console.log("stravaUser", stravaUser);
    const existingUser = (await prisma.user.findUnique({
      where: {
        strava_id: stravaUser.id,
      },
    })) as User | undefined;

    if (existingUser) {
      const session = await lucia.createSession(existingUser.id.toString(), {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    const userId = generateId(15);
    await prisma.user.create({
      data: {
        id: userId,
        strava_id: stravaUser.id,
        username: stravaUser.username,
        firstname: stravaUser.firstname,
        lastname: stravaUser.lastname,
        profile: stravaUser.profile,
      },
    });
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (e) {
    if (
      e instanceof OAuth2RequestError &&
      e.message === "bad_verification_code"
    ) {
      // invalid code
      return new Response(null, {
        status: 400,
      });
    }
    console.error(e);
    return new Response(null, {
      status: 500,
    });
  }
}

interface StravaUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
}
