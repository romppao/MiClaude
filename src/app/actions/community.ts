// Comunidad: avisos de error de los usuarios, seguir a peleadores y bloquear a otras personas.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { getUser, requireVerifiedUser } from "../../lib/accounts/auth";
import { audit } from "../../lib/common/audit";
import { internalPath, loginPath } from "../../lib/common/paths";
import { AVISOS_SIN_CUENTA_POR_DIA, MAX_REPORTS_PER_DAY, REASONS_BY_ENTITY, REPORT_ENTITIES, REPORT_REASONS, parseAvisoSinCuenta, type ReportEntity } from "../../lib/community/reports";
import { acusarReciboDeAviso } from "../../lib/community/notify";
import { allow, clientIp, HORA } from "../../lib/accounts/ratelimit";
import { APP_URL } from "../../lib/common/mail";
import { after } from "next/server";
import { hasOwn } from "../../lib/common/safe";
import { LIMITS } from "../../lib/common/text";
import { bloquear, cuentaDe, esOrigenDeBloqueo, hayBloqueo } from "../../lib/community/bloqueos";
import { go, str, withLock } from "./shared";

/** Cualquier usuario registrado puede avisar de un dato que cree incorrecto. Lo revisa un moderador. */
export async function createReport(f: FormData) {
  const user = await requireVerifiedUser();
  const back = internalPath(str(f, "back"));
  const entity = str(f, "entity");
  const entityId = str(f, "entityId");
  const reason = str(f, "reason");
  if (str(f, "message").length > LIMITS.message) go(back, { problema: "texto_largo" });
  if (entity === "PAGINA" || !(REPORT_ENTITIES as readonly string[]).includes(entity) || !hasOwn(REPORT_REASONS, reason) || !REASONS_BY_ENTITY[entity as ReportEntity].includes(reason)) go(back, { problema: "reporte_datos" });
  const exists =
    entity === "BOUT" ? await db.bout.findUnique({ where: { id: entityId } })
    : entity === "FIGHTER" ? await db.fighter.findUnique({ where: { id: entityId } })
    : entity === "MEDIA" ? await db.mediaItem.findFirst({ where: { id: entityId, hiddenAt: null } })
    : await db.aura.findFirst({ where: { id: entityId, hiddenAt: null } });
  if (!exists) go(back, { problema: "reporte_datos" });
  const status = await withLock(`report:${user.id}`, async (tx) => {
    if (await tx.report.findFirst({ where: { userId: user.id, entity, entityId, status: "OPEN" } })) return "repetido" as const;
    if ((await tx.report.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 864e5) } } })) >= MAX_REPORTS_PER_DAY) return "limite" as const;
    const report = await tx.report.create({ data: { userId: user.id, entity, entityId, reason, message: str(f, "message") || null } });
    await audit({ userId: user.id, entity: "REPORT", entityId: report.id, action: "CREATED", after: { entity, entityId, reason } }, tx);
    return "ok" as const;
  });
  if (status === "repetido") go(back, { problema: "reporte_repetido" });
  if (status === "limite") go(back, { problema: "reporte_limite" });
  go(back, { aviso: "reporte_enviado" });
}

export async function toggleFollow(f: FormData) {
  const back = internalPath(str(f, "back"));
  const user = await getUser();
  if (!user) redirect(loginPath(back));
  const fighter = await db.fighter.findFirst({ where: { id: str(f, "fighterId"), hiddenAt: null } });
  if (!fighter) go(back, { problema: "seguir_no_existe" });
  if (user.fighter?.id === fighter.id) go(back, { problema: "seguir_propio" });
  const yaLoSigue = await db.follow.findUnique({ where: { userId_fighterId: { userId: user.id, fighterId: fighter.id } }, select: { userId: true } });
  if (!yaLoSigue && (await hayBloqueo(user.id, fighter.userId))) go(back, { problema: "bloqueo_contacto" });
  // Idempotente: dos pulsaciones seguidas no producen un error, y el resultado es siempre coherente.
  const removed = await db.follow.deleteMany({ where: { userId: user.id, fighterId: fighter.id } });
  if (removed.count === 0) await db.follow.createMany({ data: [{ userId: user.id, fighterId: fighter.id }], skipDuplicates: true });
  revalidatePath("/", "layout");
  go(back, { aviso: removed.count > 0 ? "siguiendo_quitado" : "siguiendo" });
}

/**
 * Bloquea a la persona que hay detrás de una ficha, un comentario, un vídeo o foto, una propuesta o una solicitud
 * (Apple 1.2; ver lib/community/bloqueos.ts). Basta con haber entrado: también quien aún no ha confirmado su correo tiene que poder protegerse.
 */
export async function bloquearUsuario(f: FormData) {
  const back = internalPath(str(f, "back"));
  const user = await getUser();
  if (!user) redirect(loginPath(back));
  const origen = str(f, "origen");
  if (!esOrigenDeBloqueo(origen)) go(back, { problema: "bloqueo_no_existe" });
  const otro = await cuentaDe(origen, str(f, "id"), user.id);
  if (!otro) go(back, { problema: "bloqueo_no_existe" });
  if (otro === user.id) go(back, { problema: "bloqueo_propio" });
  await withLock(`bloqueo:${user.id}`, async (tx) => {
    await bloquear(tx, user.id, otro);
    await audit({ userId: user.id, entity: "USER", entityId: otro, action: "BLOCKED" }, tx);
  });
  revalidatePath("/", "layout");
  go(back, { aviso: "bloqueado" });
}

/** Deshace un bloqueo. Lo cancelado al bloquear (propuestas, solicitudes, «seguir») no vuelve: se puede pedir de nuevo. */
export async function desbloquearUsuario(f: FormData) {
  const back = internalPath(str(f, "back"), "/mi-cuenta#pestana-bloqueos");
  const user = await getUser();
  if (!user) redirect(loginPath(back));
  const otro = str(f, "userId");
  const borrado = otro.length <= 40 ? await db.block.deleteMany({ where: { blockerId: user.id, blockedId: otro } }) : { count: 0 };
  if (!borrado.count) go(back, { problema: "bloqueo_no_existe" });
  await audit({ userId: user.id, entity: "USER", entityId: otro, action: "UNBLOCKED" });
  revalidatePath("/", "layout");
  go(back, { aviso: "desbloqueado" });
}

/**
 * Aviso de contenido ilegal o que incumple las normas, con o sin cuenta (/avisar; DSA, art. 16; docs/LEGAL.md). Pide dónde está, por qué,
 * quién avisa y la declaración de buena fe; acusa recibo por correo (art. 16.4) y va a la cola de avisos de moderación, donde una persona
 * decide (sin decisiones automáticas). El campo «web» es una trampa para programas: una persona no lo ve ni lo rellena.
 */
export async function avisarSinCuenta(f: FormData) {
  const back = "/avisar";
  if (str(f, "web")) go(back, { aviso: "aviso_pagina_recibido" });
  const datos = parseAvisoSinCuenta({ direccion: str(f, "direccion"), motivo: str(f, "motivo"), explicacion: str(f, "explicacion"), nombre: str(f, "nombre"), correo: str(f, "correo"), declaracion: str(f, "declaracion") === "si" }, APP_URL);
  if (!datos.ok) go(back, { problema: datos.problema });
  const user = await getUser();
  const ip = await clientIp();
  const clave = user ? `aviso:cuenta:${user.id}` : ip ? `aviso:ip:${ip}` : `aviso:correo:${datos.value.correo ?? "anonimo"}`;
  if (!(await allow(clave, AVISOS_SIN_CUENTA_POR_DIA, 24 * HORA))) go(back, { problema: "reporte_limite" });
  const { ruta, motivo, explicacion, nombre, correo } = datos.value;
  const report = await db.report.create({ data: { userId: user?.id ?? null, reporterName: nombre ?? (user ? user.name : null), reporterEmail: correo, entity: "PAGINA", entityId: ruta, reason: motivo, message: explicacion } });
  await audit({ userId: user?.id ?? null, entity: "REPORT", entityId: report.id, action: "CREATED", after: { entity: "PAGINA", ruta, reason: motivo, sinCuenta: !user } });
  const destino = correo ?? user?.email ?? null;
  if (destino) after(() => acusarReciboDeAviso(report.id, destino));
  go(back, { aviso: "aviso_pagina_recibido" });
}
