import { getJerseyInfoForRace } from "@/app/queries/mv";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const jersey = searchParams.get("jersey");
  const raceId = parseInt(params.id);

  if (
    jersey === "YELLOW" ||
    jersey === "GREEN" ||
    jersey === "POLKA" ||
    jersey === "OLD"
  ) {
    const results = await getJerseyInfoForRace(raceId, jersey);
    return new Response(JSON.stringify(results), { status: 200 });
  }

  return new Response("Invalid jersey", { status: 400 });
}
