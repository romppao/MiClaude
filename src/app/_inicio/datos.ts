import type { Discipline } from "@prisma/client";
import { db } from "../../lib/common/db";
import { calendarDayStart } from "../../lib/common/dates";

/** Consultas que comparten las pantallas de inicio (diseño v3). Los combates que cuentan: ni en revisión ni de veladas canceladas. */
export const CUENTA = { verification: { not: "DISPUTED" as const }, event: { status: { not: "CANCELLED" as const } } };

/** Próximas veladas de todas las disciplinas y provincias, por fecha (sin prioridad editorial). */
export const proximasVeladas = (take = 6, discipline?: Discipline) =>
  db.event.findMany({ where: { date: { gte: calendarDayStart() }, status: "SCHEDULED", ...(discipline && { discipline }) }, orderBy: [{ date: "asc" }, { id: "asc" }], take });

/** Peleadores con más aura del público (fichas públicas), con su disciplina principal. Empates por apellido. */
export async function peleadoresConAura(take = 6) {
  const grupos = await db.aura.groupBy({ by: ["fighterId"], where: { bout: CUENTA, fighter: { listed: true, hiddenAt: null } }, _count: { _all: true }, orderBy: { _count: { fighterId: "desc" } }, take: take * 3 });
  if (!grupos.length) return [];
  const fichas = await db.fighter.findMany({ where: { id: { in: grupos.map((g) => g.fighterId) } }, include: { disciplines: true } });
  return grupos
    .map((g) => ({ g, f: fichas.find((x) => x.id === g.fighterId) }))
    .filter((x): x is { g: (typeof grupos)[number]; f: (typeof fichas)[number] } => !!x.f && x.f.disciplines.length > 0)
    .sort((a, b) => b.g._count._all - a.g._count._all || a.f.lastName.localeCompare(b.f.lastName, "es"))
    .slice(0, take)
    .map(({ g, f }, i) => ({ id: f.id, slug: f.slug, name: `${f.firstName} ${f.lastName}`, discipline: f.disciplines[0].discipline, aura: g._count._all, pos: i + 1 }));
}
