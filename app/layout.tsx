import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { validateRequest } from "./lib/auth"
import NavBar from "./components/Navbar"
import { SpeedInsights } from "@vercel/speed-insights/next"
import UserContext from "./UserContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Morgunvaktin",
  description: "MV",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = await validateRequest()
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <UserContext user={user}>
            <main className="flex min-h-screen flex-col items-center justify-between bg-gray-100 p-2">
              {children}
              <NavBar user={user} />
              <SpeedInsights />
            </main>
          </UserContext>
        </Providers>
      </body>
    </html>
  )
}
