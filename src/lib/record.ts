import type { Level, Method, Result } from "@prisma/client";

export type Record = { w: number; l: number; d: number; nc: number; ko: number };

export type BoutForRecord = {
  boxerAId: string;
  result: Result | null;
  method: Method | null;
  event: { level: Level; status: string };
};

const empty = (): Record => ({ w: 0, l: 0, d: 0, nc: 0, ko: 0 });

/** Calcula el récord por nivel (profesional / amateur) a partir de los combates con resultado. */
export function computeRecords(boxerId: string, bouts: BoutForRecord[]) {
  const records: { PRO: Record; AMATEUR: Record } = { PRO: empty(), AMATEUR: empty() };
  for (const b of bouts) {
    if (!b.result || b.event.status === "CANCELLED") continue;
    const r = records[b.event.level];
    if (b.result === "DRAW") r.d++;
    else if (b.result === "NO_CONTEST") r.nc++;
    else {
      const isA = b.boxerAId === boxerId;
      const won = (b.result === "A_WIN") === isA;
      if (won) {
        r.w++;
        if (b.method === "KO" || b.method === "TKO" || b.method === "RTD") r.ko++;
      } else r.l++;
    }
  }
  return records;
}

export const formatRecord = (r: Record) =>
  `${r.w}-${r.l}-${r.d}${r.nc ? ` (${r.nc} NC)` : ""}`;
