import type { Discipline, Level, Method, Result, Verification } from "@prisma/client";

export type Tally = { w: number; l: number; d: number; nc: number; ko: number; sub: number; unverified: number };

export type BoutForRecord = {
  fighterAId: string;
  result: Result | null;
  method: Method | null;
  verification: Verification;
  event: { level: Level; status: string; discipline: Discipline };
};

const empty = (): Tally => ({ w: 0, l: 0, d: 0, nc: 0, ko: 0, sub: 0, unverified: 0 });

export type Records = Partial<Record<Discipline, Record<Level, Tally>>>;

/**
 * Récord registrado en la app, por disciplina y nivel (profesional / amateur), a partir de los combates con resultado.
 * Los DISPUTED no cuentan; `unverified` indica cuántos de los contados son solo autodeclarados.
 * `ko` cuenta victorias por KO/TKO/abandono y `sub` por sumisión.
 */
export function computeRecords(fighterId: string, bouts: BoutForRecord[]): Records {
  const records: Records = {};
  for (const b of bouts) {
    if (!b.result || b.event.status === "CANCELLED" || b.verification === "DISPUTED") continue;
    const perLevel = (records[b.event.discipline] ??= { PRO: empty(), AMATEUR: empty() });
    const r = perLevel[b.event.level];
    if (b.verification === "SELF_REPORTED") r.unverified++;
    if (b.result === "DRAW") r.d++;
    else if (b.result === "NO_CONTEST") r.nc++;
    else {
      const isA = b.fighterAId === fighterId;
      const won = (b.result === "A_WIN") === isA;
      if (won) {
        r.w++;
        if (b.method === "KO" || b.method === "TKO" || b.method === "RTD") r.ko++;
        if (b.method === "SUBMISSION") r.sub++;
      } else r.l++;
    }
  }
  return records;
}

export const emptyTally = empty;

export const formatRecord = (r: { w: number; l: number; d: number; nc?: number }) =>
  `${r.w}-${r.l}-${r.d}${r.nc ? ` (${r.nc} NC)` : ""}`;

/** Récord de partida declarado por el propio deportista (antes de usar la app). */
export type Prior = { total: number | null; wins: number | null; losses: number | null; draws: number | null };

export const priorIsDetailed = (p: Prior | null | undefined): p is { total: number; wins: number; losses: number; draws: number } =>
  !!p && p.total !== null && p.wins !== null && p.losses !== null && p.draws !== null;

/**
 * Récord que se muestra como cifra principal: lo registrado en la app más el récord de partida **solo si se dio con detalle**.
 * Si el deportista solo recuerda cuántos combates lleva, ese total no entra en las victorias/derrotas: se indica aparte.
 */
export function combinedRecord(t: Tally, prior: Prior | null | undefined) {
  if (priorIsDetailed(prior)) {
    return { w: t.w + prior.wins, l: t.l + prior.losses, d: t.d + prior.draws, priorTotal: prior.total, priorDetailed: true };
  }
  return { w: t.w, l: t.l, d: t.d, priorTotal: prior?.total ?? 0, priorDetailed: false };
}
