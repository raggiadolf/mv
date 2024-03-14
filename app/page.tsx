import { redirect } from "next/navigation";
import { lucia, validateRequest } from "./lib/auth";
import { cookies } from "next/headers";

export default async function Page() {
  const { user } = await validateRequest();
  if (!user) {
    return redirect("/login");
  } else {
    return redirect("/races");
  }
  // return (
  //   <main className="flex min-h-screen flex-col items-center justify-between bg-gray-100 p-2">
  //     {/* <div className="relative flex place-items-center">
  //       <h1>Hi, {user.firstname}</h1>
  //       <p>Your user ID is {user.id}.</p>
  //       <form action={logout}>
  //         <button>Sign out</button>
  //       </form>
  //     </div> */}
  //     <Races />
  //     <NavBar user={user} />
  //   </main>
  // );
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
