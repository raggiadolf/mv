"use client"
import { User } from "lucia"
import { createContext, useContext } from "react"

type UserContextProps = {
  user: User | null
}
const UserCtx = createContext<UserContextProps>({ user: null })
export function useUserContext() {
  return useContext(UserCtx)
}

export default function UserContext({
  user,
  children,
}: {
  user: User | null
  children: React.ReactNode
}) {
  return <UserCtx.Provider value={{ user }}>{children}</UserCtx.Provider>
}
