"use client"

import { NextUIProvider } from "@nextui-org/react"
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [client] = useState(
    new QueryClient({
      defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
    })
  )

  return (
    <QueryClientProvider client={client}>
      <ReactQueryStreamedHydration>
        <NextUIProvider navigate={router.push}>{children}</NextUIProvider>
      </ReactQueryStreamedHydration>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
