import type { Discipline, Method, Result } from "@prisma/client";
import { METHODS_BY_DISCIPLINE } from "../common/disciplines";
import { hasOwn } from "../common/safe";

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
