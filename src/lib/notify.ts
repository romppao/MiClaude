import { db } from "./db";
import { APP_URL, sendMail } from "./mail";
import { fmtDate } from "./labels";
import { oneLine } from "./text";

/**
 * Avisa por correo a quienes siguen a los peleadores de un combate futuro.
 * Solo se llama con combates publicados por un organizador (no autodeclarados), para que nadie pueda
 * enviar avisos a los seguidores de otra persona inventándose combates.
 */
export async function notifyFollowersOfBout(boutId: string) {
  const bout = await db.bout.findUnique({ where: { id: boutId }, include: { event: true, fighterA: true, fighterB: true } });
  if (!bout || bout.event.date.getTime() <= Date.now()) return 0;
  const followers = await db.follow.findMany({
    where: { fighterId: { in: [bout.fighterAId, bout.fighterBId] }, user: { emailVerifiedAt: { not: null }, notifyEmails: true } },
    include: { user: true, fighter: true },
  });
  const byUser = new Map<string, { email: string; name: string; fighters: string[] }>();
  for (const f of followers) {
    const entry = byUser.get(f.userId) ?? { email: f.user.email, name: f.user.name, fighters: [] };
    entry.fighters.push(oneLine(`${f.fighter.firstName} ${f.fighter.lastName}`));
    byUser.set(f.userId, entry);
  }
  for (const u of byUser.values()) {
    await sendMail(
      u.email,
      `${u.fighters.join(" y ")} tiene un nuevo combate`,
      `Hola ${oneLine(u.name)},\n\n${oneLine(`${bout.fighterA.firstName} ${bout.fighterA.lastName}`)} y ${oneLine(`${bout.fighterB.firstName} ${bout.fighterB.lastName}`)} combatirán en «${oneLine(bout.event.name)}» (${fmtDate(bout.event.date)}, ${oneLine(bout.event.venue)}, ${oneLine(bout.event.city)}).\n\nMás información: ${APP_URL}/veladas/${bout.event.slug}\n\nRecibes este aviso porque sigues a ${u.fighters.join(" y ")}. Puedes dejar de seguirle en ${APP_URL}/siguiendo\n`,
    );
  }
  return byUser.size;
}
