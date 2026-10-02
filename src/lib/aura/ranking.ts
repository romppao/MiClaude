import type { Discipline, Level } from "@prisma/client";
import { LEVEL_ORDER, weightClassesFor } from "../common/disciplines";
import { db } from "../common/db";

export type AuraEntry = { fighterId: string; name: string; slug: string; level: Level; weightClass: string | null; aura: number };
export type RankedEntry = AuraEntry & { position: number };
export type CategoryRanking = { level: Level; weightClass: string | null; entries: RankedEntry[] };

export const NO_CATEGORY = "Sin categoría";

/**
 * Ordena por aura dentro de cada nivel (profesional / amateur) y categoría de peso: las categorías no son las mismas en cada nivel, así que nunca se mezclan.
 * Salen primero los profesionales y, dentro de cada nivel, las categorías en el orden de la disciplina (de menos a más peso) y «Sin categoría» al final.
 * Los empates comparten posición (1, 1, 3…) y se desempatan por nombre para que el orden sea estable.
 */
export function rankByCategory(entries: AuraEntry[], discipline: Discipline): CategoryRanking[] {
  const groups = new Map<string, { level: Level; weightClass: string | null; entries: AuraEntry[] }>();
  for (const e of entries) {
    const key = `${e.level}|${e.weightClass ?? ""}`;
    const g = groups.get(key) ?? { level: e.level, weightClass: e.weightClass, entries: [] };
    g.entries.push(e);
    groups.set(key, g);
  }
  const posicion = (g: { level: Level; weightClass: string | null }) => {
    if (g.weightClass === null) return Infinity;
    const order = weightClassesFor(discipline, g.level).map((c) => c.valor);
    const i = order.indexOf(g.weightClass);
    return i === -1 ? order.length : i;
  };
  const sortedGroups = [...groups.values()].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) || posicion(a) - posicion(b));
  return sortedGroups.map(({ level, weightClass, entries: members }) => {
    const sorted = [...members].sort((a, b) => b.aura - a.aura || a.name.localeCompare(b.name, "es"));
    let prev = -1, pos = 0;
    const ranked = sorted.map((e, i) => {
      if (e.aura !== prev) { pos = i + 1; prev = e.aura; }
      return { ...e, position: pos };
    });
    return { level, weightClass, entries: ranked };
  });
}

/**
 * Aura recibida por cada peleador en una disciplina (según la disciplina del combate en el que se dio),
 * opcionalmente solo de una provincia y de los últimos `sinceDays` días. Devuelve el ránking ya agrupado por categoría.
 */
export async function auraRanking(opts: { discipline: Discipline; level?: Level; province?: string; sinceDays?: number }): Promise<CategoryRanking[]> {
  // La base de datos suma las auras de cada peleador; en memoria solo quedan los peleadores que tienen aura, no cada aura.
  const totals = await db.aura.groupBy({
    by: ["fighterId"],
    where: {
      bout: { verification: { not: "DISPUTED" }, event: { discipline: opts.discipline, status: { not: "CANCELLED" } } },
      ...(opts.sinceDays && { createdAt: { gte: new Date(Date.now() - opts.sinceDays * 864e5) } }),
      fighter: { listed: true, hiddenAt: null, ...(opts.province && { province: opts.province }) },
    },
    _count: { _all: true },
  });
  if (totals.length === 0) return [];
  const fighters = await db.fighter.findMany({
    where: { id: { in: totals.map((t) => t.fighterId) } },
    select: { id: true, firstName: true, lastName: true, slug: true, disciplines: { where: { discipline: opts.discipline }, select: { level: true, weightClass: true } } },
  });
  const byId = new Map(fighters.map((f) => [f.id, f]));
  const entries: AuraEntry[] = [];
  for (const t of totals) {
    const f = byId.get(t.fighterId);
    const d = f?.disciplines[0];
    if (f && (!opts.level || d?.level === opts.level)) entries.push({ fighterId: f.id, slug: f.slug, name: `${f.firstName} ${f.lastName}`, level: d?.level ?? "AMATEUR", weightClass: d?.weightClass ?? null, aura: t._count._all });
  }
  return rankByCategory(entries, opts.discipline);
}
