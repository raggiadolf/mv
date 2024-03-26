import { NextRequest } from "next/server"
import { getNumberOfJerseysForUser } from "../queries/mv"
import { isValidJersey } from "../lib/utils"
import { Jersey } from "@prisma/client"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const jersey = searchParams.get("jersey")

  if (!isValidJersey(jersey)) {
    const results = await getNumberOfJerseysForUser(jersey as Jersey)
    return new Response(JSON.stringify(results), { status: 200 })
  }

  return new Response("Invalid jersey", { status: 400 })
}
