import { db } from "./db";
import { APP_URL, sendMail } from "./mail";
import { unsubscribeLink } from "./auth";
import { fmtDate } from "./labels";
import { oneLine } from "./text";

const fullName = (f: { firstName: string; lastName: string }) => oneLine(`${f.firstName} ${f.lastName}`);

/**
 * Avisa por correo a quienes siguen a los peleadores de un combate futuro (y no han desactivado los avisos).
 * Solo se llama con combates publicados por un organizador (no autodeclarados), para que nadie pueda
 * enviar avisos a los seguidores de otra persona inventándose combates. Un fallo con una persona no impide avisar a las demás.
 * Devuelve cuántas personas recibieron el aviso.
 */
export async function notifyFollowersOfBout(boutId: string): Promise<number> {
  const bout = await db.bout.findUnique({ where: { id: boutId }, include: { event: true, fighterA: true, fighterB: true } });
  if (!bout || bout.event.date.getTime() <= Date.now()) return 0;
  const followers = await db.follow.findMany({
    where: { fighterId: { in: [bout.fighterAId, bout.fighterBId] }, user: { emailVerifiedAt: { not: null }, notifyEmails: true } },
    include: { user: true, fighter: true },
  });
  const byUser = new Map<string, { id: string; email: string; name: string; fighters: string[] }>();
  for (const f of followers) {
    const entry = byUser.get(f.userId) ?? { id: f.userId, email: f.user.email, name: f.user.name, fighters: [] };
    entry.fighters.push(fullName(f.fighter));
    byUser.set(f.userId, entry);
  }
  let sent = 0;
  for (const u of byUser.values()) {
    try {
      const baja = await unsubscribeLink(u.id);
      const ok = await sendMail(
        u.email,
        `${u.fighters.join(" y ")} tiene un nuevo combate`,
        `Hola ${oneLine(u.name)},\n\n${fullName(bout.fighterA)} y ${fullName(bout.fighterB)} combatirán en «${oneLine(bout.event.name)}» (${fmtDate(bout.event.date)}, ${oneLine(bout.event.venue)}, ${oneLine(bout.event.city)}).\n\nMás información: ${APP_URL}/veladas/${bout.event.slug}\n\nRecibes este aviso porque sigues a ${u.fighters.join(" y ")}. Puedes dejar de seguirle en ${APP_URL}/siguiendo\nSi no quieres recibir más avisos por correo electrónico, pulsa aquí: ${baja}\n`,
        { unsubscribeUrl: baja },
      );
      if (ok) sent++;
    } catch (e) {
      console.error(`[avisos] no se pudo avisar a un seguidor: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return sent;
}
