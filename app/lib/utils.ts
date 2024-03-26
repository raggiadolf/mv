import { Jersey, Role } from "@prisma/client"
import { format, isToday, isYesterday } from "date-fns"
import { is } from "date-fns/locale"
import { User } from "lucia"

export default function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

export function getRelativeDayText(date: Date) {
  return isToday(date)
    ? "Í dag"
    : isYesterday(date)
    ? "Í gær"
    : format(date, "iiii", { locale: is })
}

export function getFormattedDate(date: Date) {
  return format(date, "d. LLL").toLowerCase()
}

export function satisfiesRole(role: Role, user: User | null) {
  const roles = Object.values(Role)
  return user && roles.indexOf(role) <= roles.indexOf(user.role)
}

export function getValidJerseys() {
  return Object.values(Jersey)
}

export function isValidJersey(jersey: string | null) {
  if (!jersey) return false
  return getValidJerseys().includes(jersey as Jersey)
}
