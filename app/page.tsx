import { redirect } from "next/navigation";
import { lucia, validateRequest } from "./lib/auth";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import Image from "next/image";

export default async function Page() {
  const { user } = await validateRequest();
  if (!user) {
    return redirect("/login");
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="relative flex place-items-center">
        <h1>Hi, {user.firstname}</h1>
        <p>Your user ID is {user.id}.</p>
        <form action={logout}>
          <button>Sign out</button>
        </form>
      </div>
      <NavBar user={user} />
    </main>
  );
}

async function logout(): Promise<ActionResult> {
  "use server";
  const { session } = await validateRequest();
  if (!session) {
    return { error: "Unauthorized" };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  return redirect("/login");
}

interface ActionResult {
  error: string | null;
}

async function NavBar({ user }: { user: User }) {
  console.log("user", user);
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between">
      <div />
      <Image
        className="inline-block rounded-full"
        width={40}
        height={40}
        src={user.profile || ""}
        alt=""
      />
    </nav>
  );
}
