// Retos a combate y propuestas de sparring entre peleadores: proponer, responder y cancelar.
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
import { PROPOSAL_KIND_LABEL, PROPOSAL_REPLY_MAX, PROPOSALS_PER_DAY, parseProposal, puedeCancelarPropuesta, puedeResponderPropuesta } from "../../lib/fighters/proposals";
import { checkLengths, go, str, withLock } from "./shared";

/** Correo después de responder (`after`): un proveedor lento no deja el botón colgado. Al contestarlo, le llega a la otra persona. */
function avisar(correo: string, asunto: string, texto: string, responderA: string) {
  after(async () => {
    try { await sendMail(correo, asunto, texto, { replyTo: responderA }); } catch (e) { console.error(`[propuestas] no se pudo enviar «${asunto}»: ${e instanceof Error ? e.message : String(e)}`); }
  });
}

const fecha = (d: Date | null) => (d ? d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : null);

/**
 * Un peleador reta a combate o propone un sparring a otro. Hace falta ficha propia y correo confirmado; el otro peleador tiene que tener
 * titular (una ficha sin reclamar no puede responder). Una sola propuesta abierta del mismo tipo entre los dos, con bloqueo contra el doble clic.
 */
export async function proposeFight(f: FormData) {
  const destinoId = str(f, "toId");
  const user = await requireVerifiedUser("/propuestas");
  const me = user.fighter;
  if (!me) go("/mi-ficha", { problema: "propuesta_sin_ficha" });
  const rival = destinoId.length <= 40 ? await db.fighter.findUnique({ where: { id: destinoId }, include: { disciplines: true, user: true } }) : null;
  if (!rival || rival.hiddenAt || !rival.listed) go("/peleadores", { problema: "no_existe" });
  const back = `/peleadores/${rival.slug}/proponer`;
  if (rival.id === me.id) go(back, { problema: "propuesta_a_ti" });
  if (!rival.user || !rival.userId) go(back, { problema: "propuesta_sin_titular" });
  checkLengths(f, back, { day: 10, place: 200, message: 1000 });
  const datos = parseProposal({ kind: str(f, "kind"), discipline: str(f, "discipline"), day: str(f, "day"), place: str(f, "place"), message: str(f, "message"), today: todayMadrid(), disciplinasDelRival: rival.disciplines.map((d) => d.discipline) });
  if (!datos.ok) go(back, { problema: datos.problema });
  const p = await withLock(`propuesta:${me.id}:${rival.id}:${datos.value.kind}`, async (tx) => {
    if (await tx.fightProposal.findFirst({ where: { fromId: me.id, toId: rival.id, kind: datos.value.kind, status: "PENDING" }, select: { id: true } })) go("/propuestas#pestana-enviadas", { problema: "propuesta_repetida" });
    if (!(await allow(`propuesta:${me.id}`, PROPOSALS_PER_DAY, 24 * HORA))) go(back, { problema: "propuestas_diarias" });
    const creada = await tx.fightProposal.create({ data: { fromId: me.id, toId: rival.id, ...datos.value } });
    await audit({ userId: user.id, entity: "PROPOSAL", entityId: creada.id, action: "PROPOSED", after: { tipo: creada.kind, a: rival.id, disciplina: creada.discipline } }, tx);
    return creada;
  });
  const quien = oneLine(publicFighterName(me));
  const tipo = PROPOSAL_KIND_LABEL[p.kind].toLowerCase();
  avisar(rival.user.email, p.kind === "FIGHT" ? `${quien} te reta a un combate` : `${quien} te propone un sparring`,
    `Hola ${oneLine(rival.user.name)},\n\n${quien} te propone un ${tipo} de ${DISCIPLINE_LABEL[p.discipline]}.\n${p.day ? `Fecha propuesta: ${fecha(p.day)}\n` : ""}${p.place ? `Dónde: ${p.place}\n` : ""}${p.message ? `Mensaje: ${p.message}\n` : ""}\nAcéptala o recházala en ${APP_URL}/propuestas\nSi respondes a este correo, le llega a ${quien}.\n`,
    user.email);
  revalidatePath("/", "layout");
  go("/propuestas#pestana-enviadas", { aviso: "propuesta_enviada" });
}

/** El peleador que recibe la propuesta la acepta o la rechaza, con un mensaje opcional. */
export async function answerProposal(f: FormData) {
  const user = await requireVerifiedUser("/propuestas");
  const me = user.fighter;
  const back = "/propuestas#pestana-recibidas";
  if (!me) go("/mi-ficha", { problema: "propuesta_sin_ficha" });
  const p = await db.fightProposal.findFirst({ where: { id: str(f, "proposalId"), toId: me.id }, include: { from: { include: { user: true } } } });
  if (!p) go(back, { problema: "no_existe" });
  if (!puedeResponderPropuesta(p.status)) go(back, { problema: "propuesta_ya_respondida" });
  const decision = str(f, "decision");
  if (decision !== "aceptar" && decision !== "rechazar") go(back, { problema: "decision_no_valida" });
  const reply = str(f, "reply").replace(/\s+/g, " ") || null;
  if (reply && reply.length > PROPOSAL_REPLY_MAX) go(back, { problema: "solicitud_respuesta_larga" });
  // Solo si sigue pendiente: si quien la envió la canceló mientras tanto, no se pisa.
  const cambio = await db.fightProposal.updateMany({ where: { id: p.id, status: "PENDING" }, data: { status: decision === "aceptar" ? "ACCEPTED" : "DECLINED", reply, answeredAt: new Date() } });
  if (!cambio.count) go(back, { problema: "propuesta_ya_respondida" });
  await audit({ userId: user.id, entity: "PROPOSAL", entityId: p.id, action: decision === "aceptar" ? "PROPOSAL_ACCEPTED" : "PROPOSAL_DECLINED" });
  const yo = oneLine(publicFighterName(me));
  if (p.from.user) avisar(p.from.user.email, decision === "aceptar" ? `${yo} ha aceptado tu propuesta` : `${yo} ha rechazado tu propuesta`,
    `Hola ${oneLine(p.from.user.name)},\n\n${yo} ha ${decision === "aceptar" ? "aceptado" : "rechazado"} tu propuesta de ${PROPOSAL_KIND_LABEL[p.kind].toLowerCase()} de ${DISCIPLINE_LABEL[p.discipline]}.\n${reply ? `\nSu mensaje: ${reply}\n` : ""}${decision === "aceptar" ? `\nPara concretarlo, responde a este correo (le llega a ${yo}) o escribe a ${user.email}.${p.kind === "FIGHT" ? " Cuando se celebre el combate, regístralo en tu ficha para que cuente en vuestro récord." : " Entrenad siempre en un gimnasio y con un entrenador: Ring España no organiza ni supervisa los sparrings."}\n` : ""}\nTus propuestas: ${APP_URL}/propuestas\n`,
    user.email);
  revalidatePath("/", "layout");
  go(back, { aviso: decision === "aceptar" ? "propuesta_aceptada" : "propuesta_rechazada" });
}

/** Quien envió la propuesta la cancela (pendiente o ya aceptada). Se avisa al otro peleador. */
export async function cancelProposal(f: FormData) {
  const user = await requireVerifiedUser("/propuestas");
  const me = user.fighter;
  const back = "/propuestas#pestana-enviadas";
  if (!me) go("/mi-ficha", { problema: "propuesta_sin_ficha" });
  const p = await db.fightProposal.findFirst({ where: { id: str(f, "proposalId"), fromId: me.id }, include: { to: { include: { user: true } } } });
  if (!p) go(back, { problema: "no_existe" });
  if (!puedeCancelarPropuesta(p.status)) go(back, { problema: "propuesta_no_cancelable" });
  const cambio = await db.fightProposal.updateMany({ where: { id: p.id, status: { in: ["PENDING", "ACCEPTED"] } }, data: { status: "CANCELLED" } });
  if (!cambio.count) go(back, { problema: "propuesta_no_cancelable" });
  await audit({ userId: user.id, entity: "PROPOSAL", entityId: p.id, action: "PROPOSAL_CANCELLED" });
  const yo = oneLine(publicFighterName(me));
  if (p.to.user) avisar(p.to.user.email, `${yo} ha cancelado su propuesta`, `Hola ${oneLine(p.to.user.name)},\n\n${yo} ha cancelado su propuesta de ${PROPOSAL_KIND_LABEL[p.kind].toLowerCase()} de ${DISCIPLINE_LABEL[p.discipline]}.\n\nTus propuestas: ${APP_URL}/propuestas\n`, user.email);
  revalidatePath("/", "layout");
  go(back, { aviso: "propuesta_cancelada" });
}
