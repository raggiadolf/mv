import { validateRequest } from "@/app/lib/auth"
import { satisfiesRole } from "@/app/lib/utils"
import { setUserAsNotOldRider, setUserAsOldRider } from "@/app/queries/db"
import { NextRequest } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await validateRequest()
  if (!user || !satisfiesRole("ADMIN", user)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await request.json()
  if (body.status === "eligible") {
    await setUserAsNotOldRider(params.id)
  } else if (body.status === "not_eligible") {
    await setUserAsOldRider(params.id)
  } else {
    return new Response("Invalid status", { status: 400 })
  }

  return new Response("Success", { status: 200 })
}
