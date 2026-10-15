import { notifyFollowedBout, notifyInApp } from "./notifications";
import { db } from "../common/db";
import { APP_URL, sendMail } from "../common/mail";
import { unsubscribeLink } from "../accounts/auth";
import { fmtDate } from "../common/labels";
import { oneLine } from "../common/text";
import { registrarFallo } from "../common/fallos";
import { titular } from "../common/titular";

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
  await notifyFollowedBout(boutId, "BOUT_ANNOUNCED");
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
        `${u.fighters.join(" y ")} ${u.fighters.length > 1 ? "tienen" : "tiene"} un nuevo combate`,
        `Hola ${oneLine(u.name)},\n\n${fullName(bout.fighterA)} y ${fullName(bout.fighterB)} combatirán en «${oneLine(bout.event.name)}» (${fmtDate(bout.event.date)}, ${oneLine(bout.event.venue)}, ${oneLine(bout.event.city)}).\n\nMás información: ${APP_URL}/veladas/${bout.event.slug}\n\nRecibes este aviso porque sigues a ${u.fighters.join(" y ")}. Puedes dejar de seguir ${u.fighters.length > 1 ? "a cada uno" : "a este peleador"} en ${APP_URL}/siguiendo\nSi no quieres recibir más avisos por correo electrónico, pulsa aquí: ${baja}\n`,
        { unsubscribeUrl: baja },
      );
      if (ok) sent++;
    } catch (e) {
      await registrarFallo({ origen: "AVISOS", contexto: "No se pudo avisar a un seguidor de un combate nuevo", error: e });
    }
  }
  return sent;
}

/**
 * Responde por correo a quien hizo una solicitud (reclamar una ficha, ser organizador) cuando un moderador decide.
 * Es un mensaje del servicio, no publicidad: se envía aunque la persona haya desactivado los avisos de nuevos combates.
 * Nunca lanza: si el correo falla, la decisión ya está guardada y la persona la verá igualmente en la aplicación.
 */
export async function notifyDecision(userId: string, asunto: string, cuerpo: string): Promise<boolean> {
  try {
    const u = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!u) return false;
    return await sendMail(u.email, asunto, `Hola ${oneLine(u.name)},\n\n${cuerpo}\n\nUn saludo,\nLona\n`);
  } catch (e) {
    await registrarFallo({ origen: "AVISOS", contexto: "No se pudo responder por correo a una solicitud", error: e });
    return false;
  }
}

/**
 * Avisa al rival (si tiene cuenta) de que otro peleador ha registrado un combate contra él y necesita su respuesta. Sin este aviso, el combate
 * quedaría «pendiente de confirmar» sin que el rival se enterase. Nunca lanza (ver notifyDecision).
 */
export async function notifyRivalOfBout(boutId: string): Promise<boolean> {
  try {
    const bout = await db.bout.findUnique({ where: { id: boutId }, include: { event: true, fighterA: true, fighterB: true } });
    if (!bout || bout.verification !== "SELF_REPORTED" || !bout.fighterB.userId) return false;
    await notifyInApp(bout.fighterB.userId, "BOUT_DECLARED", "Otro peleador ha declarado un combate contigo", "/mi-ficha#por-confirmar", `declared:${bout.id}`);
    return await notifyDecision(bout.fighterB.userId, `${fullName(bout.fighterA)} ha registrado un combate contra ti`,
      `${fullName(bout.fighterA)} ha registrado en Lona un combate contra ti en «${oneLine(bout.event.name)}» (${fmtDate(bout.event.date)}).\n\nEntra en «Mi ficha» y confirma que es correcto o indica que no lo es: ${APP_URL}/mi-ficha\nEl resultado se muestra como declarado en ambas fichas. Confirmarlo es opcional; si hay un error, tu aviso solicita revisión a moderación.`);
  } catch (e) {
    await registrarFallo({ origen: "AVISOS", contexto: "No se pudo avisar al rival de un combate registrado", error: e });
    return false;
  }
}

/** Avisa a quien registró un combate de lo que ha respondido su rival (y, si lo rechaza, del motivo). Nunca lanza. */
export async function notifyAuthorOfAnswer(boutId: string, confirmed: boolean, motivo?: string | null): Promise<boolean> {
  try {
    const bout = await db.bout.findUnique({ where: { id: boutId }, include: { event: true, fighterA: true, fighterB: true } });
    if (!bout?.createdById) return false;
    const rival = fullName(bout.fighterB);
    return await notifyDecision(bout.createdById, confirmed ? `${rival} ha confirmado tu combate` : `${rival} dice que tu combate no es correcto`,
      confirmed
        ? `${rival} ha confirmado el combate «${oneLine(bout.event.name)}» (${fmtDate(bout.event.date)}). Ya figura como confirmado por el rival.\n\nPuedes verlo en ${APP_URL}/mi-ficha`
        : `${rival} ha indicado que el combate «${oneLine(bout.event.name)}» (${fmtDate(bout.event.date)}) no es correcto${motivo ? `. Motivo: ${oneLine(motivo)}` : ""}.\n\nSe ha solicitado una revisión. El aviso del rival no elimina automáticamente el resultado ni su aura. Si ha sido un error al registrarlo, avisa desde tu ficha pública. ${APP_URL}/mi-ficha`);
  } catch (e) {
    await registrarFallo({ origen: "AVISOS", contexto: "No se pudo avisar al autor de la respuesta de su rival", error: e });
    return false;
  }
}

/**
 * Lo que la ley exige decir a quien se le retira algo y a quien avisa (DSA, arts. 16.5, 17 y 20): que lo ha decidido una persona, sin
 * sistemas automáticos, y cómo reclamar (la reclamación interna va al contacto del aviso legal y la revisa otra persona del equipo).
 */
function comoReclamar(): string {
  const { contacto } = titular();
  return `Esta decisión la ha tomado una persona del equipo de moderación de Lona; no usamos sistemas automáticos para decidir.\n\nSi no estás de acuerdo, escribe ${contacto ? `a ${contacto}` : "al contacto que figura en el aviso legal"} en los próximos seis meses explicando por qué, e indica la referencia de abajo: otra persona del equipo revisará la decisión y te responderá. También puedes acudir a un órgano de resolución extrajudicial de litigios certificado o a los tribunales. Las normas están en ${APP_URL}/condiciones`;
}

/** Acusa recibo de un aviso enviado desde /avisar (DSA, art. 16.4). Nunca lanza. */
export async function acusarReciboDeAviso(reportId: string, correo: string): Promise<boolean> {
  try {
    const r = await db.report.findUnique({ where: { id: reportId }, select: { id: true, entityId: true, reporterName: true } });
    if (!r) return false;
    return await sendMail(correo, "Hemos recibido tu aviso",
      `Hola${r.reporterName ? ` ${oneLine(r.reporterName)}` : ""},\n\nHemos recibido tu aviso sobre ${APP_URL}${oneLine(r.entityId)}\n\nLo revisará una persona del equipo de moderación (no usamos sistemas automáticos para decidir) y te escribiremos con la decisión y sus motivos.\n\nReferencia del aviso: ${r.id}\n\nUn saludo,\nLona\n`);
  } catch (e) {
    await registrarFallo({ origen: "AVISOS", contexto: "No se pudo acusar recibo de un aviso", error: e });
    return false;
  }
}

/**
 * Tras resolver un aviso, escribe a quien avisó con la decisión (DSA, art. 16.5) y, si se ha retirado algo, a su autor con los motivos
 * (art. 17). `retirado` dice si moderación actuó sobre el contenido. Si la misma persona avisó y es la autora, solo recibe un correo. Nunca lanza.
 */
export async function notificarResolucionDeAviso(reportId: string, retirado: boolean, motivoLegible: string): Promise<void> {
  try {
    const r = await db.report.findUnique({ where: { id: reportId }, include: { user: { select: { id: true, email: true, name: true } } } });
    if (!r) return;
    const nota = r.resolutionNote ? `\n\nNota de moderación: ${r.resolutionNote}` : "";
    const sobre = r.entity === "PAGINA" ? `la página ${APP_URL}${oneLine(r.entityId)}` : r.entity === "BOUT" ? "un combate" : r.entity === "FIGHTER" ? "una ficha" : r.entity === "AURA" ? "un comentario" : r.entity === "GYM" ? "un gimnasio" : "un vídeo o una foto";
    const decision = retirado ? "Hemos actuado: el contenido se ha retirado o ha dejado de contar mientras se revisa."
      : r.status === "RESOLVED" ? "Hemos revisado el contenido y lo hemos corregido."
      : "Hemos revisado el contenido y no hemos encontrado motivos para retirarlo.";
    const destino = r.user?.email ?? r.reporterEmail;
    const nombre = r.user?.name ?? r.reporterName;
    if (destino) await sendMail(destino, "Hemos revisado tu aviso",
      `Hola${nombre ? ` ${oneLine(nombre)}` : ""},\n\nHemos revisado tu aviso sobre ${sobre} (motivo: ${motivoLegible}).\n\n${decision}${nota}\n\n${comoReclamar()}\n\nReferencia del aviso: ${r.id}\n\nUn saludo,\nLona\n`);
    if (!retirado) return;
    const autor = await autorDe(r.entity, r.entityId);
    if (!autor || autor.userId === r.userId) return;
    await notifyDecision(autor.userId, "Hemos retirado un contenido tuyo",
      `${autor.que}\n\nMotivo: ${motivoLegible}. Lo hemos decidido tras revisar un aviso, de acuerdo con nuestras condiciones de uso (${APP_URL}/condiciones).${nota}\n\n${comoReclamar()}\n\nReferencia: ${r.id}`);
  } catch (e) {
    await registrarFallo({ origen: "AVISOS", contexto: "No se pudo comunicar por correo la resolución de un aviso", error: e });
  }
}

/** Quién publicó lo avisado y una frase que lo describa, para el correo de motivos. Las fichas y las páginas no tienen un autor al que avisar. */
async function autorDe(entity: string, id: string): Promise<{ userId: string; que: string } | null> {
  if (entity === "AURA") {
    const a = await db.aura.findUnique({ where: { id }, select: { userId: true, comment: true, fighter: { select: { firstName: true, lastName: true } } } });
    return a ? { userId: a.userId, que: `Hemos retirado tu comentario${a.comment ? ` «${oneLine(a.comment)}»` : ""} en la ficha de ${fullName(a.fighter)}. Tu aura se mantiene; solo deja de mostrarse el texto.` } : null;
  }
  if (entity === "MEDIA") {
    const m = await db.mediaItem.findUnique({ where: { id }, select: { uploaderId: true, kind: true, caption: true, event: { select: { name: true } } } });
    return m ? { userId: m.uploaderId, que: `Hemos retirado ${m.kind === "PHOTO" ? "tu foto" : "tu vídeo"}${m.caption ? ` «${oneLine(m.caption)}»` : ""} de la velada «${oneLine(m.event.name)}». Ya no se muestra en la velada ni en las fichas.` } : null;
  }
  if (entity === "GYM") {
    const g = await db.gym.findUnique({ where: { id }, select: { ownerUserId: true, name: true } });
    return g?.ownerUserId ? { userId: g.ownerUserId, que: `Hemos retirado del directorio de Lona el gimnasio «${oneLine(g.name)}», que gestionas.` } : null;
  }
  if (entity === "BOUT") {
    const b = await db.bout.findUnique({ where: { id }, select: { createdById: true, fighterA: { select: { firstName: true, lastName: true } }, fighterB: { select: { firstName: true, lastName: true } }, event: { select: { name: true } } } });
    return b?.createdById ? { userId: b.createdById, que: `El combate que registraste (${fullName(b.fighterA)} contra ${fullName(b.fighterB)}, «${oneLine(b.event.name)}») ha pasado a «en revisión»: deja de contar en el récord y en el ránking hasta que se aclare.` } : null;
  }
  return null;
}
