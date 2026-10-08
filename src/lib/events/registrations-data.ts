import type { Event, RegistrationStatus } from "@prisma/client";
import { db } from "../common/db";
import { computeRecords, combinedRecord, emptyTally } from "../fighters/record";
import { publicFighterName } from "../common/names";
import type { FilaInscripcion } from "./registrations";

/** Una solicitud con todo lo que ve el organizador al elegir: récord en la disciplina y el nivel del evento, aura, edad, gimnasio… */
export type SolicitudConDatos = FilaInscripcion & {
  fighterId: string; slug: string; edad: number | null; message: string | null; reply: string | null;
  derrotas: number; empates: number; status: RegistrationStatus;
};

const MAX = 500;

/**
 * Carga las solicitudes de un evento (como mucho 500) y calcula, para cada peleador, su récord en la disciplina y el nivel del evento
 * (combates registrados más los anteriores declarados con detalle), sus combates en total y su aura. Lo usan la lista del organizador
 * y su descarga en CSV, para que coincidan.
 */
export async function solicitudesDeEvento(event: Pick<Event, "id" | "discipline" | "level" | "date">): Promise<SolicitudConDatos[]> {
  const regs = await db.eventRegistration.findMany({ where: { eventId: event.id }, take: MAX, orderBy: { createdAt: "asc" }, include: { fighter: { include: { gym: true, disciplines: true } } } });
  const ids = regs.map((r) => r.fighterId);
  if (!ids.length) return [];
  const [bouts, auras] = await Promise.all([
    db.bout.findMany({ where: { OR: [{ fighterAId: { in: ids } }, { fighterBId: { in: ids } }], event: { discipline: event.discipline } }, select: { fighterAId: true, fighterBId: true, result: true, method: true, verification: true, event: { select: { discipline: true, level: true, status: true } } } }),
    db.aura.groupBy({ by: ["fighterId"], where: { fighterId: { in: ids } }, _count: { _all: true } }),
  ]);
  const auraDe = new Map(auras.map((a) => [a.fighterId, a._count._all]));
  return regs.map((r) => {
    const f = r.fighter;
    const propios = bouts.filter((b) => b.fighterAId === f.id || b.fighterBId === f.id);
    const tally = computeRecords(f.id, propios as Parameters<typeof computeRecords>[1])[event.discipline]?.[event.level] ?? emptyTally();
    const fd = f.disciplines.find((d) => d.discipline === event.discipline && d.level === event.level);
    const rec = combinedRecord(tally, fd ? { total: fd.priorTotal, wins: fd.priorWins, losses: fd.priorLosses, draws: fd.priorDraws } : null);
    const combates = rec.w + rec.l + rec.d + tally.nc + (rec.priorDetailed ? 0 : rec.priorTotal);
    const edad = f.birthDate ? Math.floor((event.date.getTime() - f.birthDate.getTime()) / 3.15576e10) : null;
    return {
      id: r.id, status: r.status, createdAt: r.createdAt, nombre: publicFighterName(f), gimnasio: f.gym?.name ?? null, provincia: f.province,
      divisionId: r.divisionId, weightClass: r.weightClass, weightKg: r.weightKg, combates, victorias: rec.w, derrotas: rec.l, empates: rec.d,
      aura: auraDe.get(f.id) ?? 0, fighterId: f.id, slug: f.slug, edad, message: r.message, reply: r.reply,
    };
  });
}
