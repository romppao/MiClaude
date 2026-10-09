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
import { CATEGORIAS_MAX, REG_REPLY_MAX, REGISTRATIONS_PER_DAY, categoriaSinSitio, claveCategoria, inscripcionAbierta, ocupacion, parsePlazas, parseRegistration, parseRegistrationSettings, puedeResponderInscripcion, puedeRetirarInscripcion } from "../../lib/events/registrations";
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
 * El organizador ofrece una categoría (división y peso) con un número de plazas, o cambia las plazas de una que ya ofrece.
 * No puede dejar menos plazas que peleadores aceptados en ella.
 */
export async function setSlot(f: FormData) {
  const user = await requireOrganizer();
  const event = await ownEvent(str(f, "eventId"), user);
  const back = `/organizador/${event.slug}#plazas`;
  const categoria = parseCompetitionChoice(event.discipline, event.level, str(f, "weightClass"), str(f, "divisionId"));
  if (!categoria || !categoria.weightClass) go(back, { problema: "plazas_categoria" });
  const places = parsePlazas(str(f, "places"));
  if (!places) go(back, { problema: "plazas_numero" });
  const divisionId = categoria.divisionId ?? "";
  const weightClass = categoria.weightClass;
  await withLock(`inscripciones:${event.id}`, async (tx) => {
    const existentes = await tx.eventSlot.findMany({ where: { eventId: event.id } });
    const misma = existentes.find((x) => x.divisionId === divisionId && x.weightClass === weightClass);
    if (!misma && existentes.length >= CATEGORIAS_MAX) go(back, { problema: "plazas_demasiadas" });
    const aceptadas = await tx.eventRegistration.count({ where: { eventId: event.id, status: "ACCEPTED", divisionId: divisionId || null, weightClass } });
    if (places < aceptadas) go(back, { problema: "plazas_menos_que_aceptados" });
    await tx.eventSlot.upsert({ where: { eventId_divisionId_weightClass: { eventId: event.id, divisionId, weightClass } }, create: { eventId: event.id, divisionId, weightClass, places }, update: { places } });
    await audit({ userId: user.id, entity: "EVENT", entityId: event.id, action: "REGISTRATION_SLOT_SET", after: { divisionId, weightClass, places } }, tx);
  });
  revalidatePath("/", "layout");
  go(back, { aviso: "plazas_guardadas" });
}

/** El organizador deja de ofrecer una categoría. Las solicitudes que ya tiene en ella siguen en su lista. */
export async function removeSlot(f: FormData) {
  const user = await requireOrganizer();
  const event = await ownEvent(str(f, "eventId"), user);
  const back = `/organizador/${event.slug}#plazas`;
  const quitada = await db.eventSlot.deleteMany({ where: { id: str(f, "slotId"), eventId: event.id } });
  if (!quitada.count) go(back, { problema: "no_existe" });
  await audit({ userId: user.id, entity: "EVENT", entityId: event.id, action: "REGISTRATION_SLOT_REMOVED", after: { plaza: str(f, "slotId") } });
  revalidatePath("/", "layout");
  go(back, { aviso: "plazas_quitadas" });
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
  checkLengths(f, back, { weightKg: 6, message: 1000, categoria: 120 });
  // Con plazas por categoría, el formulario envía «categoria» = «división|peso»; si no, los dos campos sueltos.
  const elegida = str(f, "categoria");
  const [divisionElegida, pesoElegido] = elegida ? [elegida.split("|")[0] ?? "", elegida.split("|")[1] ?? ""] : [str(f, "divisionId"), str(f, "weightClass")];
  const categoria = parseCompetitionChoice(event.discipline, event.level, pesoElegido, divisionElegida);
  if (!categoria) go(back, { problema: "cartel_categoria" });
  // Con plazas por categoría, solo se puede pedir una de las ofrecidas.
  const plazas = await db.eventSlot.findMany({ where: { eventId: event.id } });
  if (plazas.length && !plazas.some((p) => claveCategoria(p.divisionId, p.weightClass) === claveCategoria(categoria.divisionId, categoria.weightClass))) go(back, { problema: "inscripcion_categoria_no_ofrecida" });
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
  const llena = plazas.length ? ocupacion(plazas, await db.eventRegistration.findMany({ where: { eventId: event.id }, select: { status: true, divisionId: true, weightClass: true } })).get(claveCategoria(r.divisionId, r.weightClass))?.llena : false;
  go(`/veladas/${event.slug}/inscribirme`, { aviso: llena ? "inscripcion_en_espera" : "inscripcion_enviada" });
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
  // Botón de una sola tarjeta: `solo` = «id:aceptar» o «id:rechazar». Si no, las marcadas en la lista con la decisión del lote.
  const [soloId, soloDecision] = str(f, "solo").split(":");
  const ids = soloId ? [soloId].filter((x) => x.length <= 40) : [...new Set(f.getAll("ids").map(String).filter((x) => x && x.length <= 40))].slice(0, 200);
  if (!ids.length) go(back, { problema: "inscripcion_ninguna_marcada" });
  const decision = soloId ? soloDecision ?? "" : str(f, "decision");
  if (decision !== "aceptar" && decision !== "rechazar") go(back, { problema: "decision_no_valida" });
  const reply = str(f, "reply").replace(/\s+/g, " ") || null;
  if (reply && reply.length > REG_REPLY_MAX) go(back, { problema: "solicitud_respuesta_larga" });
  const status = decision === "aceptar" ? "ACCEPTED" : "DECLINED";
  // Bajo un bloqueo por evento: dos respuestas a la vez no pueden pasarse de las plazas de una categoría.
  const cambian = await withLock(`inscripciones:${event.id}`, async (tx) => {
    const filas = await tx.eventRegistration.findMany({ where: { id: { in: ids }, eventId: event.id }, include: { fighter: { include: { user: true } } } });
    const elegidas = filas.filter((r) => puedeResponderInscripcion(r.status) && r.status !== status);
    if (!elegidas.length) go(back, { problema: "inscripcion_sin_cambios" });
    if (status === "ACCEPTED") {
      const plazas = await tx.eventSlot.findMany({ where: { eventId: event.id } });
      if (plazas.length) {
        const todas = await tx.eventRegistration.findMany({ where: { eventId: event.id }, select: { status: true, divisionId: true, weightClass: true } });
        if (categoriaSinSitio(ocupacion(plazas, todas), elegidas)) go(back, { problema: "inscripcion_sin_plazas" });
      }
    }
    // Solo las que siguen en un estado que se puede responder: si un peleador la retiró mientras tanto, no se pisa.
    await tx.eventRegistration.updateMany({ where: { id: { in: elegidas.map((r) => r.id) }, status: { in: ["PENDING", "ACCEPTED", "DECLINED"] } }, data: { status, reply, answeredAt: new Date() } });
    return elegidas;
  });
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
