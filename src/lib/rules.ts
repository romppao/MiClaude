import type { Discipline, Method, Result, Verification } from "@prisma/client";
import { eventDayReached } from "./dates";
import { METHODS_BY_DISCIPLINE } from "./disciplines";
import { hasOwn } from "./safe";

// ---------- Aura ----------

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

// ---------- Resultado y forma de terminar ----------

export const OUTCOME_TO_RESULT = { WIN: "A_WIN", LOSS: "B_WIN", DRAW: "DRAW", NC: "NO_CONTEST" } as const satisfies Record<string, Result>;
export type OutcomeKey = keyof typeof OUTCOME_TO_RESULT;

const FINISHES: Method[] = ["KO", "TKO", "RTD", "SUBMISSION", "DQ"];

export type OutcomeProblema = "resultado_invalido" | "combate_metodo_falta" | "combate_metodo" | "combate_asalto";

/**
 * Valida el resultado de un combate contra su disciplina. Desde el punto de vista de la esquina roja (A):
 *  - victoria o derrota: hace falta una forma de terminar propia de la disciplina (no «empate» ni «sin decisión»);
 *  - empate y sin decisión: la forma de terminar se fija sola;
 *  - el asalto solo tiene sentido en las finalizaciones (KO, TKO, abandono, sumisión, descalificación) y va de 1 al número de asaltos.
 */
export function validateOutcome(input: { discipline: Discipline; outcome: string; method: string; endRound?: number | null; rounds?: number | null }):
  | { ok: true; result: Result; method: Method; endRound: number | null }
  | { ok: false; problema: OutcomeProblema } {
  if (!hasOwn(OUTCOME_TO_RESULT, input.outcome)) return { ok: false, problema: "resultado_invalido" };
  const result: Result = OUTCOME_TO_RESULT[input.outcome as OutcomeKey];
  if (result === "DRAW") return { ok: true, result, method: "DRAW", endRound: null };
  if (result === "NO_CONTEST") return { ok: true, result, method: "NC", endRound: null };
  if (!input.method) return { ok: false, problema: "combate_metodo_falta" };
  const allowed: Method[] = METHODS_BY_DISCIPLINE[input.discipline].filter((m) => m !== "DRAW");
  const method = input.method as Method;
  if (!allowed.includes(method)) return { ok: false, problema: "combate_metodo" };
  let endRound: number | null = null;
  if (input.endRound != null && FINISHES.includes(method)) {
    const max = input.rounds && input.rounds > 0 ? input.rounds : 12;
    if (!Number.isInteger(input.endRound) || input.endRound < 1 || input.endRound > max) return { ok: false, problema: "combate_asalto" };
    endRound = input.endRound;
  }
  return { ok: true, result, method, endRound };
}

/** Clave canónica de un enfrentamiento: los dos ids ordenados, para que A-B y B-A sean el mismo combate. */
export const pairKey = (a: string, b: string): string => [a, b].sort().join(":");
