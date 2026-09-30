import type { Prior } from "./record";

export type PriorError = "prior_numero" | "prior_suma";
export type PriorParse = { ok: true; prior: Prior } | { ok: false; error: PriorError };

const MAX = 1000;

function toInt(raw: string | undefined): number | null | "bad" {
  const s = (raw ?? "").trim();
  if (s === "") return null;
  if (!/^\d+$/.test(s)) return "bad";
  const n = parseInt(s, 10);
  return n > MAX ? "bad" : n;
}

/**
 * Interpreta el «récord de partida» que escribe el propio deportista: cuántos combates llevaba antes de usar la app
 * y, si lo recuerda, su récord (victorias, derrotas, empates). Reglas:
 *  - si no recuerda el récord, basta con el total;
 *  - si rellena alguna cifra del récord, las que deje en blanco cuentan como 0;
 *  - si da el total y el récord, tienen que coincidir.
 * Es un dato declarado y no comprobable: la app lo muestra siempre como tal.
 */
export function parsePrior(raw: { total?: string; wins?: string; losses?: string; draws?: string }): PriorParse {
  const total = toInt(raw.total), w = toInt(raw.wins), l = toInt(raw.losses), d = toInt(raw.draws);
  if ([total, w, l, d].includes("bad")) return { ok: false, error: "prior_numero" };
  const t = total as number | null;
  const parts = [w, l, d] as (number | null)[];
  if (parts.every((x) => x === null)) return { ok: true, prior: { total: t, wins: null, losses: null, draws: null } };
  const [wins, losses, draws] = parts.map((x) => x ?? 0);
  const sum = wins + losses + draws;
  if (t !== null && t !== sum) return { ok: false, error: "prior_suma" };
  return { ok: true, prior: { total: sum, wins, losses, draws } };
}
