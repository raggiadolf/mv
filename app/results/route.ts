import { NextRequest } from "next/server"
import { getNumberOfJerseysForUser, getOverAllResults } from "../queries/db"
import { isValidJersey } from "../lib/utils"
import { Jersey } from "@prisma/client"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  let jersey = searchParams.get("jersey")
  if (jersey === "null") jersey = null

  if (jersey !== null && !isValidJersey(jersey)) {
    return new Response("Invalid jersey", { status: 400 })
  }

  const results = jersey
    ? await getNumberOfJerseysForUser(jersey as Jersey)
    : await getOverAllResults()
  return new Response(JSON.stringify(results), { status: 200 })
}
