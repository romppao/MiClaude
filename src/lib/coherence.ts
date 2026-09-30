/**
 * Comprobaciones de coherencia de los combates. Son señales para el moderador, no rechazos automáticos:
 * un dato raro se guarda, pero queda marcado para revisarlo.
 */
export type Flag = "MISMO_DIA" | "MUY_SEGUIDOS";

export const FLAG_LABEL: Record<Flag, string> = {
  MISMO_DIA: "Otro combate del mismo boxeador el mismo día",
  MUY_SEGUIDOS: "Menos de 7 días desde otro combate del mismo boxeador",
};

export const MIN_DAYS_BETWEEN_BOUTS = 7;

const dayNumber = (d: Date) => Math.floor(d.getTime() / 864e5);

/** Señales para un combate en `eventDate` dado el resto de fechas de combates (de otros eventos) del mismo boxeador. */
export function proximityFlags(eventDate: Date, otherDates: Date[], minDays = MIN_DAYS_BETWEEN_BOUTS): Flag[] {
  const flags = new Set<Flag>();
  for (const other of otherDates) {
    const gap = Math.abs(dayNumber(eventDate) - dayNumber(other));
    if (gap === 0) flags.add("MISMO_DIA");
    else if (gap < minDays) flags.add("MUY_SEGUIDOS");
  }
  return [...flags];
}
