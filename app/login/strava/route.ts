import { generateState } from "arctic";
import { strava } from "../../lib/auth";
import { cookies } from "next/headers";

export async function GET(): Promise<Response> {
  const state = generateState();
  console.log("state", state);
  const url = await strava.createAuthorizationURL(state);

  cookies().set("strava_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return Response.redirect(url);
}
