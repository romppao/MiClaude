import type { Prisma } from "@prisma/client";

/** La disponibilidad caduca a los 60 días aunque todavía no haya pasado la limpieza periódica. */
export const AVAILABILITY_DAYS = 60;
export const availabilityCutoff = (now = new Date()) => new Date(now.getTime() - AVAILABILITY_DAYS * 864e5);
export function availableFighters(now = new Date()): Prisma.FighterWhereInput {
  return { availableToFight: true, availableSince: { gt: availabilityCutoff(now) } };
}
export function isAvailable(f: { availableToFight: boolean; availableSince: Date | null }, now = new Date()) {
  return f.availableToFight && !!f.availableSince && f.availableSince > availabilityCutoff(now);
}
/** Peso opcional en kilos: vacío significa no publicar peso; inválido se rechaza. */
export function parseCurrentWeight(raw: string): number | null | undefined {
  if (!raw.trim()) return null;
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(raw.trim())) return undefined;
  const weight = Number(raw.replace(",", "."));
  return weight >= 20 && weight <= 300 ? weight : undefined;
}
