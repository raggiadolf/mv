import { strava, lucia } from "../../../lib/auth"
import { cookies } from "next/headers"
import { OAuth2RequestError } from "arctic"

import type { User } from "@prisma/client"
import {
  createUser,
  getUserByStravaId,
  updateUserStravaRefreshTokenByUserId,
} from "@/app/queries/db"

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const storedState = cookies().get("strava_oauth_state")?.value ?? null
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
    })
  }

  try {
    const tokens = await strava.validateAuthorizationCode(code)
    const stravaUserResponse = await fetch(
      "https://www.strava.com/api/v3/athlete",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    )
    const stravaUser: StravaUser = await stravaUserResponse.json()
    const existingUser = (await getUserByStravaId(stravaUser.id)) as
      | User
      | undefined

    if (existingUser) {
      const session = await lucia.createSession(existingUser.id.toString(), {})
      const sessionCookie = lucia.createSessionCookie(session.id)
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      )
      await updateUserStravaRefreshTokenByUserId(
        existingUser.id,
        tokens.refreshToken
      )
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      })
    }

    const { id: userId } = await createUser(stravaUser, tokens)
    const session = await lucia.createSession(userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    )
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    })
  } catch (e) {
    if (
      e instanceof OAuth2RequestError &&
      e.message === "bad_verification_code"
    ) {
      // invalid code
      return new Response(null, {
        status: 400,
      })
    }
    console.error(e)
    return new Response(null, {
      status: 500,
    })
  }
}

export interface StravaUser {
  id: number
  username: string
  firstname: string
  lastname: string
  profile: string
}
