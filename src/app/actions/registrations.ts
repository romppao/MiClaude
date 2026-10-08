// Inscripción de peleadores en veladas e interclubs: abrir o cerrar (organizador), solicitar y retirar (peleador), y aceptar o rechazar
// una o varias solicitudes (organizador). Todo lo que se exporta aquí es un punto de entrada público del servidor (POST).
"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "../../lib/common/db";
import { requireOrganizer } from "../../lib/accounts/permissions";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { audit } from "../../lib/common/audit";
import { oneLine } from "../../lib/common/text";
import { fmtDate } from "../../lib/common/labels";
import { todayMadrid } from "../../lib/common/dates";
import { categoryLabel, parseCompetitionChoice } from "../../lib/common/disciplines";
import { publicFighterName } from "../../lib/common/names";
import { allow, HORA } from "../../lib/accounts/ratelimit";
import { APP_URL, sendMail } from "../../lib/common/mail";
import { REG_REPLY_MAX, REGISTRATIONS_PER_DAY, inscripcionAbierta, parseRegistration, parseRegistrationSettings, puedeResponderInscripcion, puedeRetirarInscripcion } from "../../lib/events/registrations";
import { checkLengths, go, ownEvent, str, withLock } from "./shared";

/** Correo después de responder (`after`): un proveedor lento no deja el botón colgado. Al contestarlo, le llega a `responderA`. */
function avisar(correo: string, asunto: string, texto: string, responderA?: string) {
  after(async () => {
    try { await sendMail(correo, asunto, texto, { replyTo: responderA }); } catch (e) { console.error(`[inscripciones] no se pudo enviar «${asunto}»: ${e instanceof Error ? e.message : String(e)}`); }
  });
}

/** El organizador abre o cierra la inscripción de su evento, con requisitos y fecha límite opcionales. */
export async function setRegistration(f: FormData) {
  const user = await requireOrganizer();
  const event = await ownEvent(str(f, "eventId"), user);
  const back = `/organizador/${event.slug}#inscripcion`;
  checkLengths(f, back, { note: 1000, until: 10 });
  const abrir = str(f, "abrir") === "1";
  const ajustes = parseRegistrationSettings({ note: str(f, "note"), until: str(f, "until"), hoy: todayMadrid(), diaEvento: event.date.toISOString().slice(0, 10) });
  if (!ajustes.ok) go(back, { problema: ajustes.problema });
  if (abrir && (event.status !== "SCHEDULED" || event.date.toISOString().slice(0, 10) < todayMadrid())) go(back, { problema: "inscripcion_evento_pasado" });
  await db.event.update({ where: { id: event.id }, data: { registrationOpen: abrir, ...ajustes.value } });
  await audit({ userId: user.id, entity: "EVENT", entityId: event.id, action: abrir ? "REGISTRATION_OPENED" : "REGISTRATION_CLOSED", after: ajustes.value });
  revalidatePath("/", "layout");
  go(back, { aviso: abrir ? "inscripcion_abierta" : "inscripcion_cerrada" });
}

/**
 * Un peleador pide participar. Hace falta su ficha (con la disciplina del evento) y el correo confirmado, y que la inscripción esté abierta.
 * Una solicitud por evento: si la retiró, puede volver a pedirla; si el organizador la rechazó, no (lo decide el organizador).
 */
export async function requestRegistration(f: FormData) {
  const eventId = str(f, "eventId");
  const user = await requireVerifiedUser("/veladas");
  const me = user.fighter;
  const event = eventId.length <= 40 ? await db.event.findUnique({ where: { id: eventId }, include: { organizer: true } }) : null;
  if (!event) go("/veladas", { problema: "no_existe" });
  const back = `/veladas/${event.slug}/inscribirme`;
  if (!me) go(back, { problema: "inscripcion_sin_ficha" });
  if (!inscripcionAbierta(event, todayMadrid())) go(`/veladas/${event.slug}`, { problema: "inscripcion_cerrada_ya" });
  const ficha = await db.fighterDiscipline.findUnique({ where: { fighterId_discipline: { fighterId: me.id, discipline: event.discipline } } });
  if (!ficha) go(back, { problema: "inscripcion_disciplina" });
  checkLengths(f, back, { weightKg: 6, message: 1000 });
  const categoria = parseCompetitionChoice(event.discipline, event.level, str(f, "weightClass"), str(f, "divisionId"));
  if (!categoria) go(back, { problema: "cartel_categoria" });
  const datos = parseRegistration({ weightKg: str(f, "weightKg"), message: str(f, "message") });
  if (!datos.ok) go(back, { problema: datos.problema });
  const valores = { divisionId: categoria.divisionId, weightClass: categoria.weightClass, ...datos.value };
  const r = await withLock(`inscripcion:${event.id}:${me.id}`, async (tx) => {
    const previa = await tx.eventRegistration.findUnique({ where: { eventId_fighterId: { eventId: event.id, fighterId: me.id } } });
    if (previa && previa.status !== "WITHDRAWN") go(back, { problema: previa.status === "DECLINED" ? "inscripcion_rechazada" : "inscripcion_repetida" });
    if (!(await allow(`inscripcion:${me.id}`, REGISTRATIONS_PER_DAY, 24 * HORA))) go(back, { problema: "inscripciones_diarias" });
    const guardada = previa
      ? await tx.eventRegistration.update({ where: { id: previa.id }, data: { ...valores, status: "PENDING", reply: null, answeredAt: null, createdAt: new Date() } })
      : await tx.eventRegistration.create({ data: { eventId: event.id, fighterId: me.id, ...valores } });
    await audit({ userId: user.id, entity: "EVENT", entityId: event.id, action: "REGISTRATION_REQUESTED", after: { inscripcion: guardada.id } }, tx);
    return guardada;
  });
  if (event.organizer) {
    const quien = oneLine(publicFighterName(me));
    avisar(event.organizer.email, `${quien} quiere participar en «${oneLine(event.name)}»`,
      `Hola ${oneLine(event.organizer.name)},\n\n${quien} ha pedido participar en «${oneLine(event.name)}» (${fmtDate(event.date)}).\nCategoría: ${categoryLabel(event.discipline, event.level, r.divisionId, r.weightClass)}${r.weightKg ? ` · ${String(r.weightKg).replace(".", ",")} kg` : ""}\n${r.message ? `Mensaje: ${r.message}\n` : ""}\nRevisa las solicitudes, filtra y elige a tus peleadores en ${APP_URL}/organizador/${event.slug}/inscripciones\n`,
      user.email);
  }
  revalidatePath("/", "layout");
  go(`/veladas/${event.slug}/inscribirme`, { aviso: "inscripcion_enviada" });
}

/** El peleador retira su solicitud (pendiente o ya aceptada). Se avisa al organizador. */
export async function withdrawRegistration(f: FormData) {
  const user = await requireVerifiedUser("/mis-inscripciones");
  const me = user.fighter;
  if (!me) go("/mi-ficha", { problema: "inscripcion_sin_ficha" });
  const r = await db.eventRegistration.findFirst({ where: { id: str(f, "registrationId"), fighterId: me.id }, include: { event: { include: { organizer: true } } } });
  const back = str(f, "desde") === "velada" && r ? `/veladas/${r.event.slug}/inscribirme` : "/mis-inscripciones";
  if (!r) go(back, { problema: "no_existe" });
  if (!puedeRetirarInscripcion(r.status)) go(back, { problema: "inscripcion_no_retirable" });
  const cambio = await db.eventRegistration.updateMany({ where: { id: r.id, status: { in: ["PENDING", "ACCEPTED"] } }, data: { status: "WITHDRAWN" } });
  if (!cambio.count) go(back, { problema: "inscripcion_no_retirable" });
  await audit({ userId: user.id, entity: "EVENT", entityId: r.eventId, action: "REGISTRATION_WITHDRAWN", after: { inscripcion: r.id } });
  if (r.event.organizer) avisar(r.event.organizer.email, `${oneLine(publicFighterName(me))} retira su inscripción`, `Hola ${oneLine(r.event.organizer.name)},\n\n${oneLine(publicFighterName(me))} ha retirado su solicitud para «${oneLine(r.event.name)}».\n\nTus solicitudes: ${APP_URL}/organizador/${r.event.slug}/inscripciones\n`, user.email);
  revalidatePath("/", "layout");
  go(back, { aviso: "inscripcion_retirada" });
}

/**
 * El organizador acepta o rechaza una o varias solicitudes (las marcadas en la lista), con un mensaje opcional para cada peleador.
 * Puede cambiar de opinión mientras el peleador no la retire. Vuelve a la lista con los mismos filtros.
 */
export async function answerRegistrations(f: FormData) {
  const user = await requireOrganizer();
  const event = await ownEvent(str(f, "eventId"), user);
  const base = `/organizador/${event.slug}/inscripciones`;
  const pedida = str(f, "back");
  const back = pedida.startsWith(`${base}?`) || pedida === base ? pedida : base;
  const ids = [...new Set(f.getAll("ids").map(String).filter((x) => x && x.length <= 40))].slice(0, 200);
  if (!ids.length) go(back, { problema: "inscripcion_ninguna_marcada" });
  const decision = str(f, "decision");
  if (decision !== "aceptar" && decision !== "rechazar") go(back, { problema: "decision_no_valida" });
  const reply = str(f, "reply").replace(/\s+/g, " ") || null;
  if (reply && reply.length > REG_REPLY_MAX) go(back, { problema: "solicitud_respuesta_larga" });
  const status = decision === "aceptar" ? "ACCEPTED" : "DECLINED";
  const filas = await db.eventRegistration.findMany({ where: { id: { in: ids }, eventId: event.id }, include: { fighter: { include: { user: true } } } });
  const cambian = filas.filter((r) => puedeResponderInscripcion(r.status) && r.status !== status);
  if (!cambian.length) go(back, { problema: "inscripcion_sin_cambios" });
  // Solo las que siguen en un estado que se puede responder: si un peleador la retiró mientras tanto, no se pisa.
  await db.eventRegistration.updateMany({ where: { id: { in: cambian.map((r) => r.id) }, status: { in: ["PENDING", "ACCEPTED", "DECLINED"] } }, data: { status, reply, answeredAt: new Date() } });
  await audit({ userId: user.id, entity: "EVENT", entityId: event.id, action: decision === "aceptar" ? "REGISTRATIONS_ACCEPTED" : "REGISTRATIONS_DECLINED", after: { inscripciones: cambian.map((r) => r.id) } });
  for (const r of cambian) {
    if (!r.fighter.user) continue;
    avisar(r.fighter.user.email, decision === "aceptar" ? `Te han aceptado en «${oneLine(event.name)}»` : `No has entrado en «${oneLine(event.name)}»`,
      `Hola ${oneLine(r.fighter.user.name)},\n\n${decision === "aceptar" ? `El organizador de «${oneLine(event.name)}» (${fmtDate(event.date)}, ${oneLine(event.city)}) ha aceptado tu solicitud. Te avisará cuando te empareje en el cartel.` : `El organizador de «${oneLine(event.name)}» no puede contar contigo esta vez.`}\n${reply ? `\nSu mensaje: ${reply}\n` : ""}\nTus inscripciones: ${APP_URL}/mis-inscripciones\n${decision === "aceptar" ? "Si respondes a este correo, le llega al organizador.\n" : ""}`,
      user.email);
  }
  revalidatePath("/", "layout");
  go(back, { aviso: decision === "aceptar" ? "inscripciones_aceptadas" : "inscripciones_rechazadas" });
}
