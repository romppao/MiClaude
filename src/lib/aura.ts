import type { Discipline } from "@prisma/client";
import { WEIGHT_CLASSES } from "./disciplines";
import { db } from "./db";

export type AuraEntry = { fighterId: string; name: string; slug: string; weightClass: string | null; aura: number };
export type RankedEntry = AuraEntry & { position: number };
export type CategoryRanking = { weightClass: string | null; entries: RankedEntry[] };

export const NO_CATEGORY = "Sin categoría";

/**
 * Ordena por aura dentro de cada categoría de peso. Las categorías salen en el orden de la disciplina (de menos a más peso)
 * y «Sin categoría» al final. Los empates comparten posición (1, 1, 3…) y se desempatan por nombre para que el orden sea estable.
 */
export function rankByCategory(entries: AuraEntry[], discipline: Discipline): CategoryRanking[] {
  const order = WEIGHT_CLASSES[discipline];
  const groups = new Map<string | null, AuraEntry[]>();
  for (const e of entries) groups.set(e.weightClass, [...(groups.get(e.weightClass) ?? []), e]);
  const keys = [...groups.keys()].sort((a, b) => {
    const ia = a === null ? Infinity : order.indexOf(a) === -1 ? order.length : order.indexOf(a);
    const ib = b === null ? Infinity : order.indexOf(b) === -1 ? order.length : order.indexOf(b);
    return ia - ib;
  });
  return keys.map((weightClass) => {
    const sorted = [...groups.get(weightClass)!].sort((a, b) => b.aura - a.aura || a.name.localeCompare(b.name, "es"));
    let prev = -1, pos = 0;
    const ranked = sorted.map((e, i) => {
      if (e.aura !== prev) { pos = i + 1; prev = e.aura; }
      return { ...e, position: pos };
    });
    return { weightClass, entries: ranked };
  });
}

/**
 * Aura recibida por cada peleador en una disciplina (según la disciplina del combate en el que se dio),
 * opcionalmente solo de una provincia y de los últimos `sinceDays` días. Devuelve el ránking ya agrupado por categoría.
 */
export async function auraRanking(opts: { discipline: Discipline; province?: string; sinceDays?: number }): Promise<CategoryRanking[]> {
  const auras = await db.aura.findMany({
    where: {
      bout: { verification: { not: "DISPUTED" }, event: { discipline: opts.discipline, status: { not: "CANCELLED" } } },
      ...(opts.sinceDays && { createdAt: { gte: new Date(Date.now() - opts.sinceDays * 864e5) } }),
      fighter: { listed: true, hiddenAt: null, ...(opts.province && { province: opts.province }) },
    },
    select: { fighterId: true, fighter: { select: { firstName: true, lastName: true, slug: true, disciplines: { where: { discipline: opts.discipline }, select: { weightClass: true } } } } },
  });
  const byFighter = new Map<string, AuraEntry>();
  for (const a of auras) {
    const cur = byFighter.get(a.fighterId);
    if (cur) cur.aura++;
    else byFighter.set(a.fighterId, {
      fighterId: a.fighterId, slug: a.fighter.slug, name: `${a.fighter.firstName} ${a.fighter.lastName}`,
      weightClass: a.fighter.disciplines[0]?.weightClass ?? null, aura: 1,
    });
  }
  return rankByCategory([...byFighter.values()], opts.discipline);
}
