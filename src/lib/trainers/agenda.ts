import { calendarDayStart } from "../common/dates";

/** Semana de lunes a domingo por el día de Madrid; day se guarda como DATE, sin hora. */
export function trainerWeek(now = new Date()) {
  const start = calendarDayStart(now);
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  return { gte: start, lt: new Date(start.getTime() + 7 * 864e5) };
}

export function agendaTime(fromMinute: number | null, toMinute: number | null) {
  const time = (x: number) => `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
  return fromMinute === null || toMinute === null ? "Horario por acordar" : `${time(fromMinute)}–${time(toMinute)}`;
}
