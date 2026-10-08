// Entrenadores: su perfil público (cuenta «Entrenador») y sus clases individuales o colectivas.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { audit } from "../../lib/common/audit";
import { slugName, slugify } from "../../lib/common/labels";
import { DISCIPLINE_ORDER } from "../../lib/common/disciplines";
import { LIMITS, oneLine } from "../../lib/common/text";
import { readOnboarding } from "../../lib/accounts/onboarding";
import { CLASS_KIND_LABEL, classMeta, parseClass, parseYears, pickDisciplines } from "../../lib/trainers/classes";
import { REQUEST_REPLY_MAX, REQUESTS_PER_DAY, parseClassRequest, puedeCancelar, puedeResponder } from "../../lib/trainers/requests";
import { allow, HORA } from "../../lib/accounts/ratelimit";
import { APP_URL, sendMail } from "../../lib/common/mail";
import { checkLengths, go, guard, readProvince, str, uniqueSlug, withLock } from "./shared";

/** Cuántas clases puede tener publicadas o en pausa un entrenador (evita abusos; se puede ampliar). */
const MAX_CLASES = 20;

/**
 * Crea el perfil público del propio entrenador (con su correo confirmado). Lo que eligió al registrarse llega ya rellenado; si entonces
 * preparó su primera clase, se publica a la vez. El gimnasio se enlaza por nombre y ciudad, como en la ficha del peleador.
 */
export async function createMyTrainer(f: FormData) {
  const user = await requireVerifiedUser("/");
  const back = "/";
  if (user.role !== "TRAINER") go(back, { problema: "solo_entrenadores" });
  if (await db.trainer.findUnique({ where: { userId: user.id }, select: { id: true } })) go("/mis-clases");
  checkLengths(f, back, { gym: LIMITS.gym, city: LIMITS.city, bio: LIMITS.bio });
  const disciplines = pickDisciplines(f.getAll("disciplina").map(String), DISCIPLINE_ORDER);
  if (disciplines.length === 0) go(back, { problema: "entrenador_disciplinas" });
  const years = parseYears(str(f, "years"));
  if (years === undefined) go(back, { problema: "entrenador_anos" });
  const province = readProvince(f, "province", back);
  const city = oneLine(str(f, "city")) || province;
  const gymName = oneLine(str(f, "gym"));
  const borrador = readOnboarding(user.onboarding);
  const primera = borrador?.kind === "entrenador" && borrador.clase && str(f, "publicarClase") === "on" ? parseClass(borrador.clase) : null;
  await guard(back, () => db.$transaction(async (tx) => {
    const gymId = gymName ? (await tx.gym.upsert({ where: { slug: slugName(gymName, city) }, create: { name: gymName, slug: slugName(gymName, city), city, province }, update: {} })).id : null;
    const slug = await uniqueSlug(slugify(user.name), async (s) => !!(await tx.trainer.findUnique({ where: { slug: s } })), "entrenador");
    const t = await tx.trainer.create({ data: { slug, name: user.name, bio: str(f, "bio") || null, gymId, userId: user.id, disciplines, yearsCoaching: years, city, province } });
    if (primera?.ok) await tx.trainingClass.create({ data: { trainerId: t.id, discipline: disciplines[0], ...primera.value } });
    await tx.user.update({ where: { id: user.id }, data: { onboarding: Prisma.DbNull } });
    await audit({ userId: user.id, entity: "TRAINER", entityId: t.id, action: "CREATED", after: { disciplines, gymId, firstClass: !!primera?.ok } }, tx);
  }));
  revalidatePath("/", "layout");
  go("/mis-clases", { aviso: primera?.ok ? "entrenador_creado_con_clase" : "entrenador_creado" });
}

/** Publica una clase nueva del propio entrenador. */
export async function createClass(f: FormData) {
  const user = await requireVerifiedUser("/mis-clases");
  const back = "/mis-clases";
  const trainer = await db.trainer.findUnique({ where: { userId: user.id }, select: { id: true, disciplines: true } });
  if (!trainer) go("/", { problema: "entrenador_perfil_primero" });
  const clase = parseClass({ kind: str(f, "kind"), title: str(f, "title"), minutes: str(f, "minutes"), price: str(f, "price"), capacity: str(f, "capacity"), schedule: str(f, "schedule") });
  if (!clase.ok) go(back, { problema: clase.problema });
  const pedida = str(f, "discipline");
  const discipline = trainer.disciplines.find((d) => d === pedida) ?? trainer.disciplines[0] ?? null;
  if ((await db.trainingClass.count({ where: { trainerId: trainer.id } })) >= MAX_CLASES) go(back, { problema: "clase_limite" });
  const c = await db.trainingClass.create({ data: { trainerId: trainer.id, discipline, ...clase.value } });
  await audit({ userId: user.id, entity: "CLASS", entityId: c.id, action: "CREATED", after: { kind: c.kind, priceEuros: c.priceEuros } });
  revalidatePath("/", "layout");
  go(back, { aviso: "clase_publicada" });
}

/** Pausa o vuelve a publicar una clase del propio entrenador (pausada no se muestra en su perfil). */
export async function toggleClass(f: FormData) {
  const user = await requireVerifiedUser("/mis-clases");
  const back = "/mis-clases";
  const c = await db.trainingClass.findFirst({ where: { id: str(f, "classId"), trainer: { userId: user.id } } });
  if (!c) go(back, { problema: "no_existe" });
  const active = str(f, "activar") === "1";
  await db.trainingClass.updateMany({ where: { id: c.id, active: !active }, data: { active } });
  revalidatePath("/", "layout");
  go(back, { aviso: active ? "clase_activada" : "clase_pausada" });
}

/**
 * Envía un correo después de responder a la persona (`after`, docs/DESARROLLO.md §4.2): un proveedor lento no deja el botón colgado, y un
 * fallo no deshace la solicitud (ya está guardada y se ve en la aplicación). `responderA`: a quién llega la respuesta si se contesta al correo.
 */
function avisar(correo: string, asunto: string, texto: string, responderA?: string) {
  after(async () => {
    try { await sendMail(correo, asunto, texto, { replyTo: responderA }); } catch (e) { console.error(`[clases] no se pudo enviar «${asunto}»: ${e instanceof Error ? e.message : String(e)}`); }
  });
}

/** Vuelve al formulario con lo que había escrito la persona, para no perderlo (principio 9) y con el problema explicado. */
function volverConLoEscrito(back: string, f: FormData, problema: string): never {
  const q = new URLSearchParams();
  for (const k of ["preferred", "message", "phone"]) if (str(f, k)) q.set(k, str(f, k).slice(0, 500));
  go(q.size ? `${back}?${q}` : back, { problema });
}

/**
 * Solicita una clase publicada (petición del fundador, 8 de octubre de 2026). Cualquier cuenta con el correo confirmado, salvo el propio
 * entrenador. Una sola solicitud abierta por clase y persona (con bloqueo: un doble clic no crea dos). El entrenador recibe un correo
 * (si lo responde, le llega a la persona) y la ve en «Mis clases».
 */
export async function requestClass(f: FormData) {
  const classId = str(f, "classId");
  const back = `/clases/${encodeURIComponent(classId)}/solicitar`;
  const user = await requireVerifiedUser(back);
  const clase = classId.length <= 40 ? await db.trainingClass.findFirst({ where: { id: classId, active: true, trainer: { userId: { not: null } } }, include: { trainer: { include: { user: true } } } }) : null;
  if (!clase?.trainer.user) go("/entrenadores", { problema: "clase_no_disponible" });
  if (clase.trainer.userId === user.id) go(back, { problema: "clase_propia" });
  checkLengths(f, back, { preferred: 400, message: 1000, phone: 40 });
  const datos = parseClassRequest({ preferred: str(f, "preferred"), message: str(f, "message"), phone: str(f, "phone") });
  if (!datos.ok) volverConLoEscrito(back, f, datos.problema);
  const r = await withLock(`clase:${clase.id}:${user.id}`, async (tx) => {
    if (await tx.classRequest.findFirst({ where: { classId: clase.id, userId: user.id, status: "PENDING" }, select: { id: true } })) go("/mis-reservas", { problema: "solicitud_repetida" });
    if (!(await allow(`clase:solicitud:${user.id}`, REQUESTS_PER_DAY, 24 * HORA))) volverConLoEscrito(back, f, "solicitudes_diarias");
    const creada = await tx.classRequest.create({ data: { classId: clase.id, userId: user.id, ...datos.value } });
    await audit({ userId: user.id, entity: "CLASS", entityId: clase.id, action: "REQUESTED", after: { solicitud: creada.id } }, tx);
    return creada;
  });
  avisar(clase.trainer.user.email, `Nueva solicitud para tu clase «${oneLine(clase.title)}»`,
    `Hola ${oneLine(clase.trainer.name)},\n\n${oneLine(user.name)} quiere hacer tu clase «${oneLine(clase.title)}» (${CLASS_KIND_LABEL[clase.kind]}, ${classMeta(clase)}, ${clase.priceEuros} €).\n\nCuándo le viene bien: ${r.preferred}\n${r.message ? `Mensaje: ${r.message}\n` : ""}${r.phone ? `Teléfono: ${r.phone}\n` : ""}Correo electrónico: ${user.email} (si respondes a este correo, le llega a esta persona)\n\nAcéptala o dile que no puedes desde «Mis clases»: ${APP_URL}/mis-clases#solicitudes\n`,
    user.email);
  revalidatePath("/", "layout");
  go("/mis-reservas", { aviso: "clase_solicitada" });
}

/** El entrenador acepta o rechaza una solicitud de sus clases, con un mensaje para la persona (lugar, hora, qué traer…). */
export async function answerClassRequest(f: FormData) {
  const user = await requireVerifiedUser("/mis-clases");
  const back = "/mis-clases#solicitudes";
  const r = await db.classRequest.findFirst({ where: { id: str(f, "requestId"), class: { trainer: { userId: user.id } } }, include: { class: { include: { trainer: true } }, user: true } });
  if (!r) go(back, { problema: "no_existe" });
  if (!puedeResponder(r.status)) go(back, { problema: "solicitud_ya_respondida" });
  const decision = str(f, "decision");
  if (decision !== "aceptar" && decision !== "rechazar") go(back, { problema: "decision_no_valida" });
  const reply = str(f, "reply").replace(/\s+/g, " ") || null;
  if (reply && reply.length > REQUEST_REPLY_MAX) go(back, { problema: "solicitud_respuesta_larga" });
  const status = decision === "aceptar" ? "ACCEPTED" : "DECLINED";
  // Solo cambia si sigue pendiente: si la persona la canceló mientras tanto, no se pisa.
  const cambio = await db.classRequest.updateMany({ where: { id: r.id, status: "PENDING" }, data: { status, reply, answeredAt: new Date() } });
  if (!cambio.count) go(back, { problema: "solicitud_ya_respondida" });
  await audit({ userId: user.id, entity: "CLASS", entityId: r.classId, action: decision === "aceptar" ? "REQUEST_ACCEPTED" : "REQUEST_DECLINED", after: { solicitud: r.id } });
  const entrenador = oneLine(r.class.trainer.name);
  avisar(r.user.email, decision === "aceptar" ? `${entrenador} ha aceptado tu clase` : `${entrenador} no puede darte la clase`,
    `Hola ${oneLine(r.user.name)},\n\n${decision === "aceptar" ? `${entrenador} ha aceptado tu solicitud para «${oneLine(r.class.title)}».` : `${entrenador} no puede darte la clase «${oneLine(r.class.title)}» en las fechas que propusiste.`}\n${reply ? `\nSu mensaje: ${reply}\n` : ""}${decision === "aceptar" ? `\nPara hablar con ${entrenador}, responde a este correo (le llega directamente) o escribe a ${user.email}.\nLa clase se paga directamente al entrenador: Ring España no cobra nada.\n` : "\nPuedes solicitarla de nuevo con otras fechas o buscar otro entrenador.\n"}\nTus reservas: ${APP_URL}/mis-reservas\n`,
    user.email);
  revalidatePath("/", "layout");
  go(back, { aviso: decision === "aceptar" ? "solicitud_aceptada" : "solicitud_rechazada" });
}

/** Quien solicitó una clase la cancela (pendiente o ya aceptada). Se avisa al entrenador. */
export async function cancelClassRequest(f: FormData) {
  const user = await requireVerifiedUser("/mis-reservas");
  const back = "/mis-reservas";
  const r = await db.classRequest.findFirst({ where: { id: str(f, "requestId"), userId: user.id }, include: { class: { include: { trainer: { include: { user: true } } } } } });
  if (!r) go(back, { problema: "no_existe" });
  if (!puedeCancelar(r.status)) go(back, { problema: "solicitud_no_cancelable" });
  // Solo si sigue pendiente o aceptada: si el entrenador la rechazó a la vez, no se pisa su respuesta.
  const cambio = await db.classRequest.updateMany({ where: { id: r.id, status: { in: ["PENDING", "ACCEPTED"] } }, data: { status: "CANCELLED" } });
  if (!cambio.count) go(back, { problema: "solicitud_no_cancelable" });
  await audit({ userId: user.id, entity: "CLASS", entityId: r.classId, action: "REQUEST_CANCELLED", after: { solicitud: r.id } });
  if (r.class.trainer.user) avisar(r.class.trainer.user.email, `${oneLine(user.name)} ha cancelado su clase`, `Hola ${oneLine(r.class.trainer.name)},\n\n${oneLine(user.name)} ha cancelado su solicitud para «${oneLine(r.class.title)}» (${r.preferred}).\n\nTus solicitudes: ${APP_URL}/mis-clases#solicitudes\n`, user.email);
  revalidatePath("/", "layout");
  go(back, { aviso: "solicitud_cancelada" });
}
