"use client"
import { User } from "lucia"
import { Role } from "@prisma/client"
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

export function satisfiesRole(role: Role, user: User | null) {
  const roles = Object.values(Role)
  return user && roles.indexOf(role) <= roles.indexOf(user.role)
}
