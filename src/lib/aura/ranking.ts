import type { Discipline, Level } from "@prisma/client";
import { divisionsFor } from "../common/competition";
import { DISCIPLINE_ORDER, LEVEL_ORDER, weightClassesFor } from "../common/disciplines";
import { AURA_POLICY, auraCategoryKey, boutBackingPoints, trajectoryByCategory } from "./trajectory";
import { calendarDayStart } from "../common/dates";
import { db } from "../common/db";

export type AuraEntry = { fighterId: string; name: string; slug: string; level: Level; weightClass: string | null; divisionId?: string | null; aura: number; trajectory?: number; backing?: number; community?: number; declared?: boolean };
export type RankedEntry = AuraEntry & { position: number };
export type CategoryRanking = { level: Level; weightClass: string | null; divisionId: string | null; entries: RankedEntry[] };

export const NO_CATEGORY = "Sin categoría";

/**
 * Ordena por aura dentro de cada nivel (profesional / amateur) y categoría de peso: las categorías no son las mismas en cada nivel, así que nunca se mezclan.
 * Salen primero los profesionales y, dentro de cada nivel, las categorías en el orden de la disciplina (de menos a más peso) y «Sin categoría» al final.
 * Los empates comparten posición (1, 1, 3…) y se desempatan por nombre para que el orden sea estable.
 */
export function rankByCategory(entries: AuraEntry[], discipline: Discipline): CategoryRanking[] {
  const groups = new Map<string, { level: Level; weightClass: string | null; divisionId: string | null; entries: AuraEntry[] }>();
  for (const e of entries) {
    const key = `${e.level}|${e.divisionId ?? ""}|${e.weightClass ?? ""}`;
    const g = groups.get(key) ?? { level: e.level, weightClass: e.weightClass, divisionId: e.divisionId ?? null, entries: [] };
    g.entries.push(e);
    groups.set(key, g);
  }
  const posicion = (g: { level: Level; weightClass: string | null; divisionId: string | null }) => {
    if (g.weightClass === null) return Infinity;
    const order = weightClassesFor(discipline, g.level, g.divisionId).map((c) => c.valor);
    const i = order.indexOf(g.weightClass);
    return i === -1 ? order.length : i;
  };
  const divisionOrder = (g: { level: Level; divisionId: string | null }) => g.divisionId ? divisionsFor(discipline, g.level).findIndex(d=>d.id===g.divisionId) : Infinity;
  const sortedGroups = [...groups.values()].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) || divisionOrder(a) - divisionOrder(b) || posicion(a) - posicion(b));
  return sortedGroups.map(({ level, weightClass, divisionId, entries: members }) => {
    const sorted = [...members].sort((a, b) => b.aura - a.aura || a.name.localeCompare(b.name, "es"));
    let prev = -1, pos = 0;
    const ranked = sorted.map((e, i) => {
      if (e.aura !== prev) { pos = i + 1; prev = e.aura; }
      return { ...e, position: pos };
    });
    return { level, weightClass, divisionId, entries: ranked };
  });
}

/** Aura total = trayectoria declarada + respaldo opcional + reconocimiento de la comunidad.
 * Cada categoría conserva su historia. El periodo limita el reconocimiento de la comunidad, no borra la carrera previa.
 */
export async function auraRanking(opts: { discipline?: Discipline; level?: Level; province?: string; sinceDays?: number; fighterId?: string } = {}): Promise<(CategoryRanking & { discipline: Discipline })[]> {
  const fighterWhere = { listed: true, hiddenAt: null, ...(opts.province && { province: opts.province }), ...(opts.fighterId && { id: opts.fighterId }) };
  const eventWhere = { discipline: opts.discipline, level: opts.level, date: { lt: new Date(calendarDayStart().getTime() + 864e5) }, status: { not: "CANCELLED" as const } };
  const [totals, achievements, supportedBouts] = await Promise.all([
    db.aura.groupBy({ by: ["fighterId", "boutId"], where: {
      bout: { verification: { not: "DISPUTED" }, event: eventWhere }, fighter: fighterWhere,
      ...(opts.sinceDays && { createdAt: { gte: new Date(Date.now() - opts.sinceDays * 864e5) } }),
    }, _count: { _all: true } }),
    db.fighterAchievement.findMany({ where: { fighter: fighterWhere, discipline: opts.discipline, level: opts.level, withdrawnAt: null, rejectedAt: null }, include: { supportAccreditation: true } }),
    db.bout.findMany({ where: { supportKind: { not: null }, verification: "VERIFIED", result: { not: null }, event: eventWhere, OR: [{ fighterA: fighterWhere }, { fighterB: fighterWhere }] }, include: { event: { select: { discipline: true, level: true } }, supportAccreditation: true } }),
  ]);
  const ids = [...new Set([...totals.map(t=>t.fighterId), ...achievements.map(a=>a.fighterId), ...supportedBouts.flatMap(b=>[b.fighterAId,b.fighterBId])])];
  if (!ids.length) return [];
  const [fighters, bouts] = await Promise.all([
    db.fighter.findMany({ where: { ...fighterWhere, id: opts.fighterId ?? { in: ids } }, select: { id: true, firstName: true, lastName: true, slug: true } }),
    totals.length ? db.bout.findMany({ where: { id: { in: [...new Set(totals.map(t=>t.boutId))] } }, select: { id: true, weightClass: true, divisionId: true, event: { select: { level: true, discipline: true } } } }) : Promise.resolve([]),
  ]);
  const byId = new Map(fighters.map(f=>[f.id,f])), byBout = new Map(bouts.map(b=>[b.id,b]));
  type Entry = AuraEntry & { discipline: Discipline; trajectory: number; backing: number; community: number; declared: boolean; titleBacking: number; boutBacking: number };
  const entries = new Map<string,Entry>();
  function entry(fighterId: string, g: { discipline: Discipline; level: Level; divisionId: string | null; weightClass: string | null }) {
    const f=byId.get(fighterId); if (!f) return null;
    const key = `${fighterId}|${auraCategoryKey(g)}`;
    let e=entries.get(key);
    if (!e) { e={ fighterId, slug:f.slug, name:`${f.firstName} ${f.lastName}`, ...g, aura:0, trajectory:0, backing:0, community:0, declared:false, titleBacking:0, boutBacking:0 }; entries.set(key,e); }
    return e;
  }
  for (const t of totals) {
    const b=byBout.get(t.boutId); if (!b) continue;
    const e=entry(t.fighterId,{...b.event, divisionId:b.divisionId, weightClass:b.weightClass}); if (e) e.community+=t._count._all;
  }
  for (const f of fighters) {
    for (const {achievement,trajectory,backing,declared} of trajectoryByCategory(achievements.filter(a=>a.fighterId===f.id)).values()) {
      const e=entry(f.id,achievement); if (e) { e.trajectory=trajectory; e.titleBacking=backing; e.declared=declared; }
    }
  }
  for (const b of supportedBouts) for (const fighterId of [b.fighterAId,b.fighterBId]) {
    const e=entry(fighterId,{...b.event,divisionId:b.divisionId,weightClass:b.weightClass}); if (e) e.boutBacking+=boutBackingPoints(b);
  }
  for (const e of entries.values()) { e.backing=e.titleBacking+Math.min(AURA_POLICY.maxBoutSupportPerCategory,e.boutBacking); e.aura=e.trajectory+e.backing+e.community; }
  return DISCIPLINE_ORDER.flatMap(discipline=>rankByCategory([...entries.values()].filter(e=>e.discipline===discipline && e.aura>0),discipline).map(g=>({...g,discipline})));
}
