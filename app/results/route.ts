import { NextRequest } from "next/server";
import { getJerseyWinners } from "../queries/mv";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jersey = searchParams.get("jersey");

  if (
    jersey === "YELLOW" ||
    jersey === "GREEN" ||
    jersey === "POLKA" ||
    jersey === "OLD"
  ) {
    const results = await getJerseyWinners(jersey);
    return new Response(JSON.stringify(results), { status: 200 });
  }

  return new Response("Invalid jersey", { status: 400 });
}
