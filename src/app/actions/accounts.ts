// Cuentas: registro, acceso, recuperación de contraseña, verificación del correo electrónico y «Mi cuenta».
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { consumeVerificationToken, createSession, destroyOtherSessions, destroySession, getUser, isResetTokenUsable, rememberReturnPath, requireUser, resetPasswordWithToken, sendPasswordResetEmail, sendVerificationEmail, unsubscribeWithToken } from "../../lib/accounts/auth";
import { dummyHash, hashPassword, needsRehash, verifyPassword } from "../../lib/accounts/password";
import { HORA, MINUTO, allow, clearHits, clientIp, reservar } from "../../lib/accounts/ratelimit";
import { maybePurge } from "../../lib/accounts/retention";
import { sendMail } from "../../lib/common/mail";
import { audit } from "../../lib/common/audit";
import { internalPath } from "../../lib/common/paths";
import { anonymizeFighter, scrubFighterHistory } from "../../lib/fighters/anonymize";
import { LIMITS, isEmail, oneLine } from "../../lib/common/text";
import { landingFor, parseTipoDeCuenta, parseTipoDeEntidad } from "../../lib/accounts/landing";
import { safeHttpUrl } from "../../lib/common/url";
import { checkLengths, go, guard, Rechazo, str } from "./shared";

const MIN_PASSWORD = 8;

/** Comprueba la contraseña elegida (registro y cambio); si no vale, vuelve a `back` con el motivo. */
function checkNewPassword(password: string, back: string) {
  if (password.length < MIN_PASSWORD) go(back, { problema: "registro_password" });
  if (password.length > LIMITS.password) go(back, { problema: "contrasena_larga" });
}

/** Alta de cuenta desde uno de los tres paneles del registro: «usuario», «peleador» o «entidad» (promotora o federación, con su solicitud). */
export async function register(f: FormData) {
  const next = internalPath(str(f, "next"), "");
  const tipo = parseTipoDeCuenta(str(f, "tipo"), str(f, "role")); // un formulario antiguo con «role» sigue funcionando
  const back = `/registro?tipo=${tipo}${next ? `&next=${encodeURIComponent(next)}` : ""}`;
  const email = str(f, "email").toLowerCase();
  const name = oneLine(str(f, "name"));
  const password = String(f.get("password") ?? "");
  const role = tipo === "peleador" ? "FIGHTER" : "FAN"; // la entidad empieza como persona normal: el permiso de organizadora lo concede un moderador
  const ip = await clientIp();
  if (ip && !(await allow(`registro:ip:${ip}`, 10, HORA))) go(back, { problema: "demasiados_intentos" });
  if (!name || name.length > LIMITS.name || !isEmail(email)) go(back, { problema: "registro_datos" });
  checkNewPassword(password, back);
  // Panel C: los datos de la entidad se comprueban ANTES de crear nada, para no dejar una cuenta sin su solicitud.
  let entidad: { orgName: string; kind: "PROMOTORA" | "FEDERACION"; website: string | null; message: string } | null = null;
  if (tipo === "entidad") {
    checkLengths(f, back, { orgName: LIMITS.orgName, message: LIMITS.message, website: LIMITS.url });
    const orgName = oneLine(str(f, "orgName"));
    const kind = parseTipoDeEntidad(str(f, "entityKind"));
    const website = str(f, "website") ? safeHttpUrl(str(f, "website")) : null;
    const message = str(f, "message");
    if (!orgName) go(back, { problema: "nombre_organizacion" });
    if (!kind) go(back, { problema: "entidad_tipo" });
    if (str(f, "website") && !website) go(back, { problema: "enlace_invalido" });
    if (!message) go(back, { problema: "organizador_sin_datos" });
    entidad = { orgName, kind, website, message };
  }
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    // Un doble clic en «Crear mi cuenta» envía dos veces: la segunda ve la cuenta que acaba de crear la primera. Quien ya tiene esa sesión sigue a «Confirma tu correo».
    if ((await getUser())?.email === email) go("/verificar");
    go(back, { problema: "registro_email_existe" });
  }
  await maybePurge();
  const passwordHash = await hashPassword(password);
  // La cuenta y, en su caso, la solicitud de la entidad se crean juntas: o se guardan las dos o ninguna.
  const user = await guard(back, () => db.$transaction(async (tx) => {
    const creada = await tx.user.create({ data: { email, name, role, passwordHash } });
    if (entidad) await tx.organizerRequest.create({ data: { userId: creada.id, ...entidad } });
    return creada;
  }), "registro_email_existe");
  const enviado = await sendVerificationEmail(user);
  await createSession(user.id);
  if (next) await rememberReturnPath(next); // al confirmar el correo se le ofrecerá volver a lo que estaba haciendo
  go("/verificar", enviado ? (entidad ? { aviso: "registro_entidad" } : undefined) : { problema: "correo_no_enviado" });
}

// Límites del inicio de sesión: intentos fallidos en 15 minutos por correo y por dirección IP (si el proxy la facilita).
const LOGIN_MAX_POR_CORREO = 8;

const LOGIN_MAX_POR_IP = 40;

export async function login(f: FormData) {
  const email = str(f, "email").toLowerCase().slice(0, LIMITS.email);
  const password = String(f.get("password") ?? "");
  const next = internalPath(str(f, "next"), "");
  const back = `/entrar${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const ip = await clientIp();
  const claves: [string, number][] = [[`acceso:correo:${email}`, LOGIN_MAX_POR_CORREO], ...(ip ? [[`acceso:ip:${ip}`, LOGIN_MAX_POR_IP] as [string, number]] : [])];
  await maybePurge(); // la limpieza de datos caducados no depende de que alguien se registre (como mucho una vez cada 30 minutos)
  // El intento se reserva ANTES de calcular el hash (si se anotara al terminar, peticiones simultáneas se saltarían el límite).
  const reservas = await Promise.all(claves.map(([clave, max]) => reservar(clave, max, 15 * MINUTO)));
  if (reservas.some((r) => !r.permitido)) go(back, { problema: "demasiados_intentos" });

  const user = await db.user.findUnique({ where: { email } });
  // Con un correo que no existe se verifica igualmente contra un hash de mentira: así tarda lo mismo y no se puede averiguar qué correos hay registrados.
  const ok = await verifyPassword(password.length <= LIMITS.password ? password : "", user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok) go(back, { problema: "login_incorrecto" }); // la reserva se queda como intento fallido
  await Promise.all(reservas.map((r) => r.devolver()));
  await clearHits(`acceso:correo:${email}`);
  if (needsRehash(user.passwordHash)) await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  await createSession(user.id);
  go(next || landingFor(user.role));
}

export async function logout() {
  await destroySession();
  go("/", { aviso: "sesion_cerrada" });
}

/**
 * Petición de una contraseña nueva. La respuesta es siempre la misma exista o no la cuenta (no se puede averiguar
 * qué correos están registrados), y el envío se hace después de responder para que tampoco lo delate el tiempo.
 */
export async function requestPasswordReset(f: FormData) {
  const back = "/recuperar";
  const email = str(f, "email").toLowerCase();
  if (!isEmail(email)) go(back, { problema: "correo_no_valido" });
  const ip = await clientIp();
  if (!(await allow(`recuperar:correo:${email}`, 3, HORA)) || (ip && !(await allow(`recuperar:ip:${ip}`, 10, HORA)))) go(back, { problema: "demasiados_intentos" });
  after(async () => {
    try {
      const user = await db.user.findUnique({ where: { email } });
      if (user) await sendPasswordResetEmail(user);
    } catch (e) {
      console.error(`[recuperar] no se pudo enviar el enlace: ${e instanceof Error ? e.message : String(e)}`);
    }
  });
  go(back, { aviso: "recuperar_enviado" });
}

export async function resetPassword(f: FormData) {
  const token = str(f, "token");
  const back = `/recuperar/nueva?token=${encodeURIComponent(token)}`;
  const password = String(f.get("password") ?? "");
  if (password !== String(f.get("repeat") ?? "")) go(back, { problema: "contrasenas_distintas" });
  checkNewPassword(password, back);
  // El hash cuesta 64 MiB y unos 100–200 ms y la acción es pública: primero se limita la frecuencia y se comprueba que el enlace sirve, y solo entonces se calcula.
  const ip = await clientIp();
  if (ip && !(await allow(`restablecer:ip:${ip}`, 20, HORA))) go(back, { problema: "demasiados_intentos" });
  if (!(await isResetTokenUsable(token))) go("/recuperar", { problema: "token_invalido" });
  const user = await resetPasswordWithToken(token, await hashPassword(password));
  if (!user) go("/recuperar", { problema: "token_invalido" }); // alguien gastó el enlace justo antes
  await sendMail(user.email, "Tu contraseña de Ring España se ha cambiado", `Hola ${oneLine(user.name)},\n\nTu contraseña se ha cambiado y se han cerrado las sesiones abiertas en otros dispositivos.\n\nSi no has sido tú, pide una contraseña nueva cuanto antes desde la página de acceso.\n`);
  await createSession(user.id);
  go("/", { aviso: "contrasena_cambiada" });
}

/**
 * Comprueba la contraseña actual antes de una operación delicada (cambiar la contraseña, eliminar la cuenta). Cuenta como un
 * intento de acceso: si se falla varias veces seguidas, se bloquea durante unos minutos (evita adivinarla desde una sesión abierta).
 */
async function confirmOwnPassword(user: { email: string; passwordHash: string }, password: string, back: string) {
  const clave = `acceso:correo:${user.email}`;
  const reserva = await reservar(clave, LOGIN_MAX_POR_CORREO, 15 * MINUTO); // antes de calcular el hash: ver login
  if (!reserva.permitido) go(back, { problema: "demasiados_intentos" });
  if (password.length > LIMITS.password || !(await verifyPassword(password, user.passwordHash))) go(back, { problema: "contrasena_actual_incorrecta" });
  await reserva.devolver();
  await clearHits(clave);
}

export async function updateAccount(f: FormData) {
  const user = await requireUser();
  const back = "/mi-cuenta";
  const name = oneLine(str(f, "name"));
  if (!name || name.length > LIMITS.name) go(back, { problema: "registro_datos" });
  const notifyEmails = f.get("notifyEmails") === "on";
  await db.user.update({ where: { id: user.id }, data: { name, notifyEmails } });
  await audit({ userId: user.id, entity: "USER", entityId: user.id, action: "ACCOUNT_UPDATED", before: { name: user.name, notifyEmails: user.notifyEmails }, after: { name, notifyEmails } });
  revalidatePath("/", "layout");
  go(back, { aviso: "cuenta_guardada" });
}

export async function changePassword(f: FormData) {
  const user = await requireUser();
  const back = "/mi-cuenta";
  const password = String(f.get("password") ?? "");
  if (password !== String(f.get("repeat") ?? "")) go(back, { problema: "contrasenas_distintas" });
  checkNewPassword(password, back);
  await confirmOwnPassword(user, String(f.get("current") ?? ""), back);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  await destroyOtherSessions(user.id);
  await sendMail(user.email, "Tu contraseña de Ring España se ha cambiado", `Hola ${oneLine(user.name)},\n\nTu contraseña se ha cambiado y se han cerrado las sesiones abiertas en otros dispositivos.\n\nSi no has sido tú, pide una contraseña nueva cuanto antes desde la página de acceso.\n`);
  go(back, { aviso: "contrasena_guardada" });
}

/** Baja de los avisos por correo desde el enlace del propio mensaje (no hace falta iniciar sesión). */
export async function unsubscribeEmails(f: FormData) {
  const ok = await unsubscribeWithToken(str(f, "token"));
  go("/baja", ok ? { aviso: "avisos_desactivados" } : { problema: "baja_invalida" });
}

/**
 * Elimina la cuenta y sus datos personales: sesiones, auras dadas, seguimientos, solicitudes y avisos enviados.
 * La ficha de peleador se borra si no tiene combates; si los tiene, se anonimiza (los combates forman parte del récord de sus rivales).
 * Las veladas publicadas se conservan, sin organizador. Queda un apunte en el historial sin datos personales.
 */
export async function deleteAccount(f: FormData) {
  const user = await requireUser();
  const back = "/mi-cuenta/eliminar";
  if (f.get("confirm") !== "on") go(back, { problema: "eliminar_sin_confirmar" });
  await confirmOwnPassword(user, String(f.get("current") ?? ""), back);
  await guard(back, () => db.$transaction(async (tx) => {
    if (user.role === "ADMIN" && (await tx.user.count({ where: { role: "ADMIN" } })) <= 1) throw new Rechazo("ultimo_moderador");
    const fighter = await tx.fighter.findUnique({ where: { userId: user.id }, include: { _count: { select: { boutsAsA: true, boutsAsB: true } } } });
    let ficha: "borrada" | "anonimizada" | null = null;
    if (fighter) {
      if (fighter._count.boutsAsA + fighter._count.boutsAsB === 0) { await scrubFighterHistory(tx, fighter.id); await tx.fighter.delete({ where: { id: fighter.id } }); ficha = "borrada"; }
      else { await anonymizeFighter(tx, fighter.id); ficha = "anonimizada"; }
    }
    // El historial guardaba su nombre real «antes» y «después» de cada cambio: se vacían esos datos (queda constancia de qué pasó y cuándo).
    await tx.auditLog.updateMany({ where: { entity: "USER", entityId: user.id }, data: { before: Prisma.DbNull, after: Prisma.DbNull } });
    const accreditation = await tx.supportAccreditation.findUnique({ where: { userId: user.id } });
    if (accreditation) {
      await tx.supportAccreditation.update({ where: { id: accreditation.id }, data: { active: false, name: "Acreditación retirada", evidenceUrl: "", note: "" } });
      await tx.auditLog.updateMany({ where: { entity: "ACCREDITATION", entityId: accreditation.id }, data: { before: Prisma.DbNull, after: Prisma.DbNull } });
      await tx.fighterAchievement.updateMany({ where: { supportAccreditationId: accreditation.id }, data: { supportAuthority: null, supportNote: null } });
      await tx.bout.updateMany({ where: { supportAccreditationId: accreditation.id }, data: { supportAuthority: null, supportNote: null } });
    }
    // Las comprobaciones nuevas también podían guardar el nombre o notas privadas de quien respaldó.
    await tx.auditLog.updateMany({
      where: { userId: user.id, OR: [{ entity: { in: ["ACHIEVEMENT", "ACCREDITATION"] } }, { entity: "BOUT", action: "ENDORSED" }] },
      data: { before: Prisma.DbNull, after: Prisma.DbNull },
    });
    await audit({ userId: null, entity: "USER", entityId: user.id, action: "ACCOUNT_DELETED", after: { role: user.role, ficha } }, tx);
    await tx.user.delete({ where: { id: user.id } });
  }));
  await destroySession();
  go("/", { aviso: "cuenta_eliminada" });
}

export async function verifyEmail(f: FormData) {
  const ok = await consumeVerificationToken(str(f, "token"));
  go("/verificar", ok ? { aviso: "correo_verificado" } : { problema: "token_invalido" });
}

export async function resendVerification() {
  const user = await requireUser();
  if (user.emailVerifiedAt) go("/verificar");
  if (!(await allow(`reenvio:usuario:${user.id}`, 3, HORA))) go("/verificar", { problema: "demasiados_intentos" });
  go("/verificar", (await sendVerificationEmail(user)) ? { aviso: "correo_reenviado" } : { problema: "correo_no_enviado" });
}
