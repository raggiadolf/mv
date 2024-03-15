import { format, isToday, isYesterday } from "date-fns";
import { is } from "date-fns/locale";

export default function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function getRelativeDayText(date: Date) {
  return isToday(date)
    ? "Í dag"
    : isYesterday(date)
    ? "Í gær"
    : format(date, "iiii", { locale: is });
}

export function getFormattedDate(date: Date) {
  return format(date, "d. LLL").toLowerCase();
}
