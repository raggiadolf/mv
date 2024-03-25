import { cookies } from "next/headers"
import { lucia, validateRequest } from "../lib/auth"
import { redirect } from "next/navigation"

export async function GET() {
  const { session } = await validateRequest()
  if (!session) {
    return redirect("/races")
  }

  await lucia.invalidateSession(session.id)

  const sessionCookie = lucia.createBlankSessionCookie()
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )
  return redirect("/races")
}
