import { db } from "./db";
import { APP_URL, sendMail } from "./mail";
import { fmtDate } from "./labels";

/**
 * Avisa por correo a quienes siguen a los boxeadores de un combate futuro.
 * Solo se llama con combates publicados por un organizador (no autodeclarados), para que nadie pueda
 * enviar avisos a los seguidores de otra persona inventándose combates.
 */
export async function notifyFollowersOfBout(boutId: string) {
  const bout = await db.bout.findUnique({ where: { id: boutId }, include: { event: true, boxerA: true, boxerB: true } });
  if (!bout || bout.event.date.getTime() <= Date.now()) return 0;
  const followers = await db.follow.findMany({
    where: { boxerId: { in: [bout.boxerAId, bout.boxerBId] }, user: { emailVerifiedAt: { not: null } } },
    include: { user: true, boxer: true },
  });
  const byUser = new Map<string, { email: string; name: string; boxers: string[] }>();
  for (const f of followers) {
    const entry = byUser.get(f.userId) ?? { email: f.user.email, name: f.user.name, boxers: [] };
    entry.boxers.push(`${f.boxer.firstName} ${f.boxer.lastName}`);
    byUser.set(f.userId, entry);
  }
  for (const u of byUser.values()) {
    await sendMail(
      u.email,
      `${u.boxers.join(" y ")} tiene un nuevo combate`,
      `Hola ${u.name},\n\n${bout.boxerA.firstName} ${bout.boxerA.lastName} y ${bout.boxerB.firstName} ${bout.boxerB.lastName} combatirán en «${bout.event.name}» (${fmtDate(bout.event.date)}, ${bout.event.venue}, ${bout.event.city}).\n\nMás información: ${APP_URL}/veladas/${bout.event.slug}\n\nRecibes este aviso porque sigues a ${u.boxers.join(" y ")}. Puedes dejar de seguirle en ${APP_URL}/siguiendo\n`,
    );
  }
  return byUser.size;
}
