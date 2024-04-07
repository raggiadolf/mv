import { getAllUsers } from "../queries/db"

export async function GET() {
  const users = await getAllUsers()
  return new Response(JSON.stringify(users), { status: 200 })
}
