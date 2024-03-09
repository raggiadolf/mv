import { validateRequest } from "../lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const { user } = await validateRequest();
  if (user) {
    return redirect("/");
  }
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="flex place-items-center">
        <a
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          href="/login/strava"
        >
          <svg
            viewBox="0 0 412 596"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="-ml-0.5 h-5 w-5"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M169.107 0.11731L0.616943 343.117H100.929L169.107 204.26L237.332 343.117H337.617L169.107 0.11731Z"
              fill="white"
            />
            <path
              opacity="0.4"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M287.486 595.883L411.383 343.117L337.62 343.117L287.486 445.444L237.317 343.117L163.574 343.117L287.486 595.883Z"
              fill="white"
            />
          </svg>
          Innskráning með Strava
        </a>
      </div>
    </main>
  );
}
