import { generateState } from "arctic";
import { strava } from "../../lib/auth";
import { cookies } from "next/headers";

const getStravaToken = async (code: string) => {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  return response.json();
};

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
