import type { Result } from "@prisma/client";
import { eventDayReached } from "../common/dates";

/** La publicación de un cartel no verifica un resultado que todavía no existe. */
export function estadoSinResultado(bout: { result: Result | null; event: { date: Date } }, now = new Date()): string | null {
  if (!eventDayReached(bout.event.date, now)) return "Programado";
  return bout.result ? null : "Resultado por anotar";
}
