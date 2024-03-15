import { getAllScheduledRaces } from "@/app/queries/mv";
import Calendar from "./Calendar";

export default async function CreateRacePage() {
  const schedule = await getAllScheduledRaces();
  return <Calendar schedule={schedule} />;
}
