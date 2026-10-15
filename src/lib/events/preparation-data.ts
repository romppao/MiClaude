import { db } from "../common/db";

/** Solo cantidades agregadas. Cuenta relaciones Follow de peleadores de ese cartel, sin duplicar por combate. */
export async function preparationAudience(eventId: string) {
  const [asistentes, seguidores] = await Promise.all([
    db.eventAttendance.count({ where: { eventId } }),
    db.follow.count({ where: { fighter: { OR: [{ boutsAsA: { some: { eventId } } }, { boutsAsB: { some: { eventId } } }] } } }),
  ]);
  return { asistentes, seguidores };
}
