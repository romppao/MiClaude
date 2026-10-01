import type { Result, Verification } from "@prisma/client";
import { eventDayReached } from "../common/dates";

export type AuraProblema = "aura_no_existe" | "aura_revision" | "aura_cancelado" | "aura_futuro" | "aura_sin_resultado" | "aura_propio";

export type BoutForAura = {
  fighterAId: string;
  fighterBId: string;
  verification: Verification;
  result: Result | null;
  event: { date: Date; status: string };
};

/**
 * Reglas para dar aura, en un solo sitio (las usan la acción del servidor y la interfaz):
 * el peleador debe participar en el combate, el combate no puede estar en revisión ni cancelado, debe haberse celebrado
 * y tener resultado, y quien lo da no puede ser uno de los participantes.
 */
export function canGiveAura(input: { bout: BoutForAura; fighterId: string; viewerFighterId?: string | null; now?: Date }): { ok: true } | { ok: false; problema: AuraProblema } {
  const { bout, fighterId, viewerFighterId, now } = input;
  if (fighterId !== bout.fighterAId && fighterId !== bout.fighterBId) return { ok: false, problema: "aura_no_existe" };
  if (bout.verification === "DISPUTED") return { ok: false, problema: "aura_revision" };
  if (bout.event.status === "CANCELLED") return { ok: false, problema: "aura_cancelado" };
  if (!eventDayReached(bout.event.date, now)) return { ok: false, problema: "aura_futuro" };
  if (!bout.result) return { ok: false, problema: "aura_sin_resultado" };
  if (viewerFighterId && (viewerFighterId === bout.fighterAId || viewerFighterId === bout.fighterBId)) return { ok: false, problema: "aura_propio" };
  return { ok: true };
}

export const AURA_COMMENT_MAX = 500;
export const AURA_PER_DAY = 20;
