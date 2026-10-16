// Invitaciones de organizadores y entrenadores a un peleador concreto: enviar, responder, retirar y ajustar quién puede invitarme.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { audit } from "../../lib/common/audit";
import { oneLine } from "../../lib/common/text";
import { todayMadrid } from "../../lib/common/dates";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { publicFighterName } from "../../lib/common/names";
import { allow, HORA } from "../../lib/accounts/ratelimit";
import { APP_URL, sendMail } from "../../lib/common/mail";
import { putNotification } from "../../lib/community/notifications";
import { hayBloqueo } from "../../lib/community/bloqueos";
import {
  INVITATIONS_PER_DAY, INVITATION_KIND_LABEL, INVITATION_MESSAGE_MAX, INVITATION_REPLY_MAX, caducaEn, contactoCompartido, desdeRepeticion, destinoDisponible,
  invitacionCaducada, parseAjustesDeContacto, parseInvitation, puedeInvitar, puedeResponderInvitacion, puedeRetirarInvitacion, veladaInvitable,
} from "../../lib/community/invitations";
import { checkLengths, go, str, withLock } from "./shared";
import { registrarFallo } from "../../lib/common/fallos";

const ENVIADAS = "/invitaciones";
const RECIBIDAS = "/propuestas#pestana-invitaciones";

/** Correo después de responder (`after`): un proveedor lento no deja el botón colgado. `responderA` solo cuando la otra persona quiso compartir su correo. */
function avisar(correo: string, asunto: string, texto: string, responderA?: string) {
  after(async () => {
    try { await sendMail(correo, asunto, texto, responderA ? { replyTo: responderA } : undefined); }
    catch (e) { await registrarFallo({ origen: "CORREO", contexto: `No se pudo enviar el correo «${asunto}»`, error: e }); }
  });
}

/** Nombre con el que se presenta quien invita: la organización (si es organizador) o el entrenador. */
async function nombreDeQuienInvita(user: { id: string; name: string; role: string }): Promise<string> {
  if (user.role === "ORGANIZER") return (await db.organizerRequest.findUnique({ where: { userId: user.id }, select: { orgName: true } }))?.orgName ?? oneLine(user.name);
  return (await db.trainer.findUnique({ where: { userId: user.id }, select: { name: true } }))?.name ?? oneLine(user.name);
}

/**
 * Un organizador aprobado o un entrenador invita a un peleador. Hace falta el correo confirmado; el peleador tiene que tener titular, ser
 * mayor de edad y tener abiertas las invitaciones; no puede haber bloqueo en ningún sentido (si lo hay, el error es el mismo que si no
 * estuviera disponible). Una sola invitación pendiente igual, y no se repite hasta 30 días después de un rechazo.
 */
export async function sendInvitation(f: FormData) {
  const toId = str(f, "toId");
  const user = await requireVerifiedUser(ENVIADAS);
  const quien = puedeInvitar({ role: user.role, emailVerifiedAt: user.emailVerifiedAt });
  if (!quien.ok) go(ENVIADAS, { problema: quien.problema });
  const hoy = todayMadrid();
  const destino = toId.length <= 40 ? await db.fighter.findUnique({ where: { id: toId }, include: { disciplines: true, user: true } }) : null;
  if (!destino) go("/peleadores", { problema: "no_existe" });
  const back = `/peleadores/${destino.slug}/invitar`;
  const disponible = destinoDisponible({ listed: destino.listed, hiddenAt: destino.hiddenAt, userId: destino.userId, acceptsInvitations: destino.acceptsInvitations, birthDate: destino.birthDate }, hoy);
  if (!disponible.ok) go(back, { problema: disponible.problema });
  // Nadie se invita a sí mismo (una cuenta con ficha propia que además organiza o entrena).
  if (destino.userId === user.id) go(back, { problema: "invitacion_no_disponible" });
  if (await hayBloqueo(user.id, destino.userId)) go(back, { problema: "invitacion_no_disponible" });
  checkLengths(f, back, { message: INVITATION_MESSAGE_MAX });

  const tipo = str(f, "kind");
  let evento: { id: string; name: string; slug: string; date: Date; discipline: string } | null = null;
  let enNombreDe: { id: string; firstName: string; lastName: string; disciplines: { discipline: string }[] } | null = null;
  if (tipo === "EVENT") {
    const e = str(f, "eventId") ? await db.event.findUnique({ where: { id: str(f, "eventId") } }) : null;
    if (!e) go(back, { problema: "invitacion_velada" });
    const v = veladaInvitable({ organizerId: e.organizerId, status: e.status, registrationOpen: e.registrationOpen, date: e.date, discipline: e.discipline }, { id: user.id, role: user.role }, hoy);
    if (!v.ok) go(back, { problema: v.problema });
    if (str(f, "discipline") !== e.discipline) go(back, { problema: "invitacion_disciplina" });
    const [enCartel, inscripcion] = await Promise.all([
      db.bout.findFirst({ where: { eventId: e.id, OR: [{ fighterAId: destino.id }, { fighterBId: destino.id }] }, select: { id: true } }),
      db.eventRegistration.findUnique({ where: { eventId_fighterId: { eventId: e.id, fighterId: destino.id } }, select: { status: true } }),
    ]);
    if (enCartel || (inscripcion && inscripcion.status !== "WITHDRAWN")) go(back, { problema: "invitacion_ya_inscrito" });
    evento = { id: e.id, name: e.name, slug: e.slug, date: e.date, discipline: e.discipline };
  } else if (tipo === "SPARRING" || tipo === "TRAIN") {
    if (user.role !== "TRAINER") go(back, { problema: "invitacion_sin_permiso" });
    const entrenador = await db.trainer.findUnique({ where: { userId: user.id }, include: { fighters: { include: { disciplines: true } } } });
    if (!entrenador) go(back, { problema: "invitacion_sin_permiso" });
    if (destino.trainerId === entrenador.id) go(back, { problema: "invitacion_mismo" });
    if (tipo === "SPARRING") {
      enNombreDe = entrenador.fighters.find((x) => x.id === str(f, "onBehalfOfId")) ?? null;
      if (!enNombreDe) go(back, { problema: "invitacion_peleador_ajeno" });
    }
  }
  const datos = parseInvitation({ kind: tipo, discipline: str(f, "discipline"), message: str(f, "message"), disciplinasDelDestino: destino.disciplines.map((d) => d.discipline), disciplinasDelPropio: enNombreDe?.disciplines.map((d) => d.discipline as never) });
  if (!datos.ok) go(back, { problema: datos.problema });

  const ahora = new Date();
  const invitacion = await withLock(`invitacion:${user.id}`, async (tx) => {
    const mismo = { fromUserId: user.id, toId: destino.id, kind: datos.value.kind, eventId: evento?.id ?? null };
    if (await tx.invitation.findFirst({ where: { ...mismo, status: "PENDING", expiresAt: { gt: ahora } }, select: { id: true } })) go(ENVIADAS, { problema: "invitacion_repetida" });
    if (await tx.invitation.findFirst({ where: { ...mismo, status: "DECLINED", answeredAt: { gte: desdeRepeticion(ahora) } }, select: { id: true } })) go(back, { problema: "invitacion_rechazada_reciente" });
    if (!(await allow(`invitacion:${user.id}`, INVITATIONS_PER_DAY, 24 * HORA))) go(back, { problema: "invitacion_diaria" });
    const creada = await tx.invitation.create({ data: { ...mismo, onBehalfOfId: enNombreDe?.id ?? null, discipline: datos.value.discipline, message: datos.value.message, expiresAt: caducaEn(ahora) } });
    await audit({ userId: user.id, entity: "INVITATION", entityId: creada.id, action: "INVITED", after: { tipo: creada.kind, a: destino.id, velada: evento?.id ?? null, disciplina: creada.discipline } }, tx);
    if (destino.userId) await putNotification(destino.userId, "INVITATION", "Has recibido una invitación", RECIBIDAS, `invitation:${creada.id}`, tx);
    return creada;
  });

  const nombre = await nombreDeQuienInvita(user);
  const cabecera = invitacion.kind === "EVENT" && evento ? `${nombre} te invita a participar en «${evento.name}» (${evento.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })})`
    : invitacion.kind === "SPARRING" && enNombreDe ? `${nombre} propone un sparring de ${DISCIPLINE_LABEL[datos.value.discipline]} a ${oneLine(publicFighterName(enNombreDe as never))}`
      : `${nombre} te invita a entrenar juntos`;
  if (destino.user) avisar(destino.user.email, cabecera,
    `Hola ${oneLine(destino.user.name)},\n\n${cabecera}.\n${datos.value.message ? `\nMensaje:\n${datos.value.message}\n` : ""}\nPuedes aceptarla o rechazarla aquí (tienes 14 días): ${APP_URL}/propuestas#pestana-invitaciones\nSi la aceptas, solo se comparte el contacto que tú elijas. Si no te interesa, puedes rechazarla, bloquear a quien la envía o avisarnos.`, user.email);
  revalidatePath("/", "layout");
  go(ENVIADAS, { aviso: "invitacion_enviada" });
}

/** El peleador invitado acepta (y se comparte el contacto que eligió) o rechaza, con un mensaje opcional. */
export async function answerInvitation(f: FormData) {
  const user = await requireVerifiedUser("/propuestas");
  const me = user.fighter;
  if (!me) go("/mi-ficha", { problema: "propuesta_sin_ficha" });
  checkLengths(f, RECIBIDAS, { reply: INVITATION_REPLY_MAX });
  const decision = str(f, "decision") === "accept" ? "ACCEPTED" : str(f, "decision") === "decline" ? "DECLINED" : null;
  if (!decision) go(RECIBIDAS, { problema: "no_existe" });
  const inv = await db.invitation.findUnique({ where: { id: str(f, "invitationId") }, include: { fromUser: true, event: true } });
  if (!inv || inv.toId !== me.id) go(RECIBIDAS, { problema: "no_existe" });
  const ahora = new Date();
  if (invitacionCaducada(inv, ahora)) {
    await db.invitation.updateMany({ where: { id: inv.id, status: "PENDING" }, data: { status: "EXPIRED" } });
    go(RECIBIDAS, { problema: "invitacion_caducada" });
  }
  if (!puedeResponderInvitacion(inv, ahora)) go(RECIBIDAS, { problema: "invitacion_no_pendiente" });
  const respuesta = oneLine(str(f, "reply")) || null;
  const contacto = decision === "ACCEPTED" ? contactoCompartido(me.contactChannel, { email: user.email, phone: me.contactPhone, instagram: me.contactInstagram }) : null;
  const respondida = await withLock(`invitacion-respuesta:${inv.id}`, async (tx) => {
    const { count } = await tx.invitation.updateMany({ where: { id: inv.id, status: "PENDING", expiresAt: { gt: ahora } }, data: { status: decision, reply: respuesta, contactShared: contacto, answeredAt: ahora } });
    if (!count) return false;
    await audit({ userId: user.id, entity: "INVITATION", entityId: inv.id, action: decision === "ACCEPTED" ? "INVITATION_ACCEPTED" : "INVITATION_DECLINED", after: { canal: decision === "ACCEPTED" ? me.contactChannel : null } }, tx);
    await putNotification(inv.fromUserId, "INVITATION_ANSWER", decision === "ACCEPTED" ? "Han aceptado tu invitación" : "Han rechazado tu invitación", ENVIADAS, `invitation-answer:${inv.id}`, tx);
    return true;
  });
  if (!respondida) go(RECIBIDAS, { problema: "invitacion_no_pendiente" });
  const quien = oneLine(publicFighterName(me));
  avisar(inv.fromUser.email, decision === "ACCEPTED" ? `${quien} ha aceptado tu invitación` : `${quien} ha rechazado tu invitación`,
    `Hola ${oneLine(inv.fromUser.name)},\n\n${quien} ha ${decision === "ACCEPTED" ? "aceptado" : "rechazado"} tu invitación (${INVITATION_KIND_LABEL[inv.kind].toLowerCase()}${inv.event ? ` «${inv.event.name}»` : ""}).\n${contacto ? `\nContacto que ha elegido compartir contigo:\n${contacto}\n` : ""}${respuesta ? `\nSu mensaje:\n${respuesta}\n` : ""}\nTodo queda en ${APP_URL}/invitaciones`,
    me.contactChannel === "EMAIL" && decision === "ACCEPTED" ? user.email : undefined);
  revalidatePath("/", "layout");
  go(RECIBIDAS, { aviso: decision === "ACCEPTED" ? "invitacion_aceptada" : "invitacion_rechazada" });
}

/** Quien invitó la retira mientras siga pendiente. */
export async function withdrawInvitation(f: FormData) {
  const user = await requireVerifiedUser(ENVIADAS);
  const inv = await db.invitation.findUnique({ where: { id: str(f, "invitationId") } });
  if (!inv || inv.fromUserId !== user.id) go(ENVIADAS, { problema: "no_existe" });
  if (!puedeRetirarInvitacion(inv)) go(ENVIADAS, { problema: "invitacion_no_pendiente" });
  await withLock(`invitacion-respuesta:${inv.id}`, async (tx) => {
    const { count } = await tx.invitation.updateMany({ where: { id: inv.id, status: "PENDING" }, data: { status: "WITHDRAWN", answeredAt: new Date() } });
    if (count) await audit({ userId: user.id, entity: "INVITATION", entityId: inv.id, action: "INVITATION_WITHDRAWN" }, tx);
  });
  revalidatePath("/", "layout");
  go(ENVIADAS, { aviso: "invitacion_retirada" });
}

/** «Quién puede invitarme» y «Cómo me contactan al aceptar», desde la ficha del propio peleador. */
export async function setInvitationSettings(f: FormData) {
  const user = await requireVerifiedUser("/propuestas");
  const me = user.fighter;
  if (!me) go("/mi-ficha", { problema: "propuesta_sin_ficha" });
  const datos = parseAjustesDeContacto({ accepts: str(f, "accepts"), channel: str(f, "channel"), phone: str(f, "phone"), instagram: str(f, "instagram") });
  if (!datos.ok) go(RECIBIDAS, { problema: datos.problema });
  await db.$transaction(async (tx) => {
    await tx.fighter.update({ where: { id: me.id }, data: datos.value });
    await audit({ userId: user.id, entity: "FIGHTER", entityId: me.id, action: "INVITATION_SETTINGS", after: { acepta: datos.value.acceptsInvitations, canal: datos.value.contactChannel } }, tx);
  });
  revalidatePath("/", "layout");
  go(RECIBIDAS, { aviso: "invitaciones_ajustes" });
}
