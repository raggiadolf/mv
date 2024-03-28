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
    : format(date, "eeee", { locale: is }).charAt(0).toUpperCase() +
      format(date, "eeee", { locale: is }).slice(1)
}

export function getFormattedDate(date: Date) {
  return format(date, "dd.MM.yyyy")
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

export function withOrdinalSuffix(i: number) {
  const j = i % 10,
    k = i % 100
  if (j === 1 && k !== 11) {
    return i + "st"
  }
  if (j === 2 && k !== 12) {
    return i + "nd"
  }
  if (j === 3 && k !== 13) {
    return i + "rd"
  }
  return i + "th"
}
