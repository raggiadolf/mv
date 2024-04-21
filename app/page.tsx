import { redirect } from "next/navigation"

export default async function Page() {
  return redirect("/races?season=2024")
}
