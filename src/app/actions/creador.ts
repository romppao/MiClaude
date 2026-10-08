"use server";

// Cuenta del creador: segundo paso al entrar y gestión de cuentas (lib/accounts/creador.ts explica qué es y por qué).

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { db } from "../../lib/common/db";
import { audit } from "../../lib/common/audit";
import { internalPath } from "../../lib/common/paths";
import { completeSecondFactor, destroySession, getUserPendingSecondFactor } from "../../lib/accounts/auth";
import { esCreador, type EstadoCodigos } from "../../lib/accounts/creador";
import { requireCreador } from "../../lib/accounts/permissions";
import { HORA, MINUTO, allow, clientIp, reservar } from "../../lib/accounts/ratelimit";
import { comprobarCodigo, gastarCodigoEmergencia, nuevosCodigosEmergencia } from "../../lib/accounts/totp";
import { lookup } from "../../lib/common/safe";
import { go, str } from "./shared";

const SEGUNDO_PASO = "/entrar/segundo-paso";
const INTENTOS = 6; // por cuenta y cuarto de hora: con 6 cifras, adivinar un código es inviable a este ritmo

/** La persona del segundo paso, o vuelta a «Entrar» si su sesión a medias ya no existe o la cuenta ya no es la del creador. */
async function pendiente() {
  const user = await getUserPendingSecondFactor();
  if (!user || !esCreador(user)) {
    await destroySession();
    go("/entrar", { problema: "segundo_paso_caducado" });
  }
  return user;
}

/** Limita los intentos por cuenta y por dirección; el intento se reserva antes de comprobar (como en «Entrar»). */
async function limitar(userId: string, back: string) {
  const ip = await clientIp();
  const reservas = await Promise.all([
    reservar(`segundo:cuenta:${userId}`, INTENTOS, 15 * MINUTO),
    ...(ip ? [reservar(`segundo:ip:${ip}`, 30, 15 * MINUTO)] : []),
  ]);
  if (reservas.some((r) => !r.permitido)) go(back, { problema: "demasiados_intentos" });
  return () => Promise.all(reservas.map((r) => r.devolver()));
}

/** Segundo paso con la aplicación de códigos ya activada: vale el código de 6 cifras o un código de emergencia (se gasta). */
export async function comprobarSegundoPaso(f: FormData) {
  const user = await pendiente();
  const next = internalPath(str(f, "next"), "");
  const back = `${SEGUNDO_PASO}${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  if (!user.totpSecret || !user.totpConfirmedAt) go(back);
  const devolver = await limitar(user.id, back);
  const codigo = str(f, "codigo");
  const paso = comprobarCodigo(user.totpSecret, codigo, { ultimo: user.totpLastStep });
  let metodo: "app" | "emergencia";
  let quedan = user.recoveryCodes.length;
  if (paso !== null) {
    // Solo una petición puede gastar este intervalo: si otra se adelantó con el mismo código, esta no actualiza nada.
    const n = await db.user.updateMany({ where: { id: user.id, OR: [{ totpLastStep: null }, { totpLastStep: { lt: paso } }] }, data: { totpLastStep: paso } });
    if (!n.count) go(back, { problema: "codigo_incorrecto" });
    metodo = "app";
  } else {
    const resto = gastarCodigoEmergencia(user.recoveryCodes, codigo);
    if (!resto) go(back, { problema: "codigo_incorrecto" });
    const n = await db.user.updateMany({ where: { id: user.id, recoveryCodes: { equals: user.recoveryCodes } }, data: { recoveryCodes: resto } });
    if (!n.count) go(back, { problema: "codigo_incorrecto" });
    metodo = "emergencia";
    quedan = resto.length;
  }
  await devolver();
  await completeSecondFactor();
  await audit({ userId: user.id, entity: "USER", entityId: user.id, action: "CREADOR_ENTRA", after: { metodo, ip: await clientIp() } });
  go(next || "/moderacion/usuarios", { aviso: metodo === "emergencia" && quedan <= 3 ? "creador_ultimo_codigo" : "creador_dentro" });
}

/**
 * Primera vez: activa la aplicación de códigos con la clave que le enseñó la pantalla (guardada al mostrarla) y devuelve los diez
 * códigos de emergencia, que se ven una sola vez. Desde ese momento la sesión cuenta como iniciada.
 */
export async function activarSegundoPaso(_prev: EstadoCodigos, f: FormData): Promise<EstadoCodigos> {
  const user = await pendiente();
  if (user.totpConfirmedAt) go(SEGUNDO_PASO);
  if (!user.totpSecret) return { problema: "segundo_paso_caducado" };
  const devolver = await limitar(user.id, SEGUNDO_PASO);
  const paso = comprobarCodigo(user.totpSecret, str(f, "codigo"));
  if (paso === null) return { problema: "codigo_app_incorrecto" };
  const { claros, huellas } = nuevosCodigosEmergencia();
  // Solo si sigue sin activar: dos envíos a la vez no pueden dejar dos juegos de códigos distintos.
  const n = await db.user.updateMany({ where: { id: user.id, totpConfirmedAt: null, totpSecret: user.totpSecret }, data: { totpConfirmedAt: new Date(), totpLastStep: paso, recoveryCodes: huellas } });
  if (!n.count) go(SEGUNDO_PASO);
  await devolver();
  await completeSecondFactor();
  await audit({ userId: user.id, entity: "USER", entityId: user.id, action: "CREADOR_SEGUNDO_PASO_ACTIVADO" });
  return { codigos: claros };
}

/** Códigos de emergencia nuevos (anula los anteriores). Pide un código de la aplicación: quien tenga la sesión abierta no basta. */
export async function regenerarCodigos(_prev: EstadoCodigos, f: FormData): Promise<EstadoCodigos> {
  const user = await requireCreador();
  if (!user.totpSecret || !(await allow(`codigos:cuenta:${user.id}`, INTENTOS, HORA))) return { problema: "demasiados_intentos" };
  const paso = comprobarCodigo(user.totpSecret, str(f, "codigo"), { ultimo: user.totpLastStep });
  if (paso === null) return { problema: "codigo_app_incorrecto" };
  const { claros, huellas } = nuevosCodigosEmergencia();
  await db.user.update({ where: { id: user.id }, data: { recoveryCodes: huellas, totpLastStep: paso } });
  await audit({ userId: user.id, entity: "USER", entityId: user.id, action: "CREADOR_CODIGOS_NUEVOS" });
  return { codigos: claros };
}

const TIPOS: Record<string, Role> = { FAN: "FAN", FIGHTER: "FIGHTER", TRAINER: "TRAINER", ORGANIZER: "ORGANIZER", ADMIN: "ADMIN" };

/** Cambia el tipo de una cuenta (también nombrar o quitar moderadores). No la propia: el creador siempre es moderador. */
export async function cambiarTipoDeCuenta(f: FormData) {
  const creador = await requireCreador();
  const back = returnToUsuarios(f);
  const userId = str(f, "userId");
  const role = lookup(TIPOS, str(f, "role"));
  if (!role) go(back, { problema: "tipo_no_valido" });
  if (userId === creador.id) go(back, { problema: "no_tu_propia_cuenta" });
  const antes = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!antes) go(back, { problema: "no_existe" });
  if (antes.role !== role) {
    await db.$transaction([
      db.user.update({ where: { id: userId }, data: { role } }),
      db.auditLog.create({ data: { userId: creador.id, entity: "USER", entityId: userId, action: "TIPO_CAMBIADO", before: { role: antes.role }, after: { role } } }),
    ]);
  }
  revalidatePath("/moderacion/usuarios");
  go(back, { aviso: "tipo_cambiado" });
}

/** Cierra todas las sesiones de otra cuenta (por ejemplo, si cree que alguien ha entrado con ella). */
export async function cerrarSesionesDe(f: FormData) {
  const creador = await requireCreador();
  const back = returnToUsuarios(f);
  const userId = str(f, "userId");
  if (userId === creador.id) go(back, { problema: "no_tu_propia_cuenta" });
  const { count } = await db.session.deleteMany({ where: { userId } });
  await audit({ userId: creador.id, entity: "USER", entityId: userId, action: "SESIONES_CERRADAS", after: { sesiones: count } });
  go(back, { aviso: "sesiones_cerradas" });
}

/** Vuelve a la búsqueda en la que estaba (solo dentro de /moderacion/usuarios). */
function returnToUsuarios(f: FormData) {
  const q = str(f, "q").slice(0, 80);
  return `/moderacion/usuarios${q ? `?q=${encodeURIComponent(q)}` : ""}`;
}
