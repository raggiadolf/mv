import { generateState } from "arctic"
import { STRAVA_SCOPES, strava } from "../../lib/auth"
import { cookies } from "next/headers"

export async function GET(): Promise<Response> {
  const state = generateState()
  const url = await strava.createAuthorizationURL(state, {
    scopes: [STRAVA_SCOPES.reduce((acc, scope) => acc + "," + scope)],
  })

  cookies().set("strava_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  })

  return Response.redirect(url)
}
