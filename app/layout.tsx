import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { validateRequest } from "./lib/auth"
import NavBar from "./components/Navbar"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
import { UserContext } from "./UserContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Morgunvaktin",
  description: "MV",
  openGraph: {
    title: "Morgunvaktin",
    description: "MV",
    url: "https://morgunvaktin.app",
    siteName: "Morgunvaktin",
    images: [
      {
        url: "https://morgunvaktin.app/splash.png",
        width: 1200,
        height: 630,
        alt: "Morgunvaktin",
      },
    ],
  },
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
            <main className="dark flex min-h-screen flex-col items-center justify-between bg-gray-950 p-2">
              {children}
              <NavBar user={user} />
              <SpeedInsights />
              <Analytics />
            </main>
          </UserContext>
        </Providers>
      </body>
    </html>
  )
}
