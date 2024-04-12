import { NextRequest } from "next/server"
import { validateRequest } from "../../lib/auth"
import { satisfiesRole } from "../../lib/utils"
import { refreshAllRaces } from "../../queries/db"

export async function POST(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || !satisfiesRole("ADMIN", user)) {
    return new Response("Unauthorized", { status: 401 })
  }

  await refreshAllRaces()
  return new Response("Refreshed", { status: 200 })
}
