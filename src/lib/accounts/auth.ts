import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { db } from "../common/db";
export { hashPassword, verifyPassword } from "./password";
import { APP_URL, sendMail } from "../common/mail";
import { oneLine } from "../common/text";

const COOKIE = "session";
const SESSION_DAYS = 30;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.session.create({ data: { id: sha256(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(COOKIE);
}

export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({ where: { id: sha256(token) }, include: { user: { include: { fighter: { include: { disciplines: true } } } } } });
  if (!s || s.expiresAt < new Date()) return null;
  return s.user;
}

export async function requireUser() {
  const u = await getUser();
  if (!u) redirect("/entrar");
  return u;
}

// ---------- Enlaces de un solo uso enviados por correo ----------

export const VERIFY_HOURS = 48;
export const RESET_HOURS = 1;
type TokenKind = "VERIFY" | "RESET" | "UNSUB";

/** Crea un enlace de un solo uso del tipo indicado (sustituye al anterior del mismo tipo) y devuelve el token en claro. */
async function issueToken(userId: string, kind: TokenKind, hours: number, replacePrevious = true): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.$transaction([
    ...(replacePrevious ? [db.emailToken.deleteMany({ where: { userId, kind } })] : []),
    db.emailToken.create({ data: { id: sha256(token), userId, kind, expiresAt: new Date(Date.now() + hours * 36e5) } }),
  ]);
  return token;
}

/** Enlace para dejar de recibir avisos por correo desde el propio mensaje (vale un año; cada correo lleva el suyo y no anula los anteriores). */
export async function unsubscribeLink(userId: string): Promise<string> {
  return `${APP_URL}/baja?token=${await issueToken(userId, "UNSUB", 24 * 365, false)}`;
}

/** Desactiva los avisos por correo con el enlace de baja. Devuelve false si el enlace no es válido o ha caducado. */
export async function unsubscribeWithToken(token: string): Promise<boolean> {
  const row = await db.emailToken.findUnique({ where: { id: sha256(token) } });
  if (!row || row.kind !== "UNSUB" || row.expiresAt < new Date()) return false;
  await db.user.update({ where: { id: row.userId }, data: { notifyEmails: false } });
  return true;
}

/** Cierra todas las sesiones de la persona salvo la que está usando ahora (tras cambiar la contraseña). */
export async function destroyOtherSessions(userId: string) {
  const token = (await cookies()).get(COOKIE)?.value;
  await db.session.deleteMany({ where: { userId, ...(token ? { id: { not: sha256(token) } } : {}) } });
}

/** Crea el enlace de verificación y lo envía por correo. Devuelve false si el correo no ha podido enviarse. */
export async function sendVerificationEmail(user: { id: string; email: string; name: string }): Promise<boolean> {
  const token = await issueToken(user.id, "VERIFY", VERIFY_HOURS);
  return sendMail(user.email, "Confirma tu correo electrónico en Ring España", `Hola ${oneLine(user.name)},\n\nConfirma tu correo electrónico aquí (el enlace caduca en ${VERIFY_HOURS} horas):\n${APP_URL}/verificar?token=${token}\n\nSi no has creado una cuenta en Ring España, ignora este mensaje: no se activará nada.\n`);
}

/** Consume el enlace de verificación y marca el correo como verificado. Devuelve false si no es válido, ya se usó o ha caducado. */
export async function consumeVerificationToken(token: string): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const row = await tx.emailToken.findUnique({ where: { id: sha256(token) } });
    if (!row || row.kind !== "VERIFY" || row.expiresAt < new Date()) return false;
    // Solo una petición puede gastar el enlace: si otra se adelantó, esta no encuentra nada que borrar.
    if ((await tx.emailToken.deleteMany({ where: { id: row.id } })).count === 0) return false;
    await tx.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
    return true;
  });
}

/** Crea el enlace para elegir una contraseña nueva y lo envía por correo (caduca en 1 hora). */
export async function sendPasswordResetEmail(user: { id: string; email: string; name: string }): Promise<boolean> {
  const token = await issueToken(user.id, "RESET", RESET_HOURS);
  return sendMail(user.email, "Elige una contraseña nueva en Ring España", `Hola ${oneLine(user.name)},\n\nHemos recibido una petición para elegir una contraseña nueva. Puedes hacerlo aquí (el enlace caduca en ${RESET_HOURS} hora y solo sirve una vez):\n${APP_URL}/recuperar/nueva?token=${token}\n\nSi no lo has pedido tú, ignora este mensaje: tu contraseña actual sigue siendo la misma.\n`);
}

/** ¿Es un enlace de recuperación que todavía se puede usar? (solo lectura, para decidir qué enseñar). */
export async function isResetTokenUsable(token: string): Promise<boolean> {
  const row = await db.emailToken.findUnique({ where: { id: sha256(token) } });
  return !!row && row.kind === "RESET" && row.expiresAt >= new Date();
}

/**
 * Cambia la contraseña con un enlace de recuperación. Solo sirve una vez; al usarlo se cierran todas las sesiones abiertas y
 * se da por verificado el correo (quien recibe el enlace demuestra que controla ese buzón). Devuelve la persona o null si el enlace no vale.
 */
export async function resetPasswordWithToken(token: string, passwordHash: string) {
  return db.$transaction(async (tx) => {
    const row = await tx.emailToken.findUnique({ where: { id: sha256(token) } });
    if (!row || row.kind !== "RESET" || row.expiresAt < new Date()) return null;
    if ((await tx.emailToken.deleteMany({ where: { id: row.id } })).count === 0) return null;
    const current = await tx.user.findUnique({ where: { id: row.userId }, select: { emailVerifiedAt: true } });
    const user = await tx.user.update({ where: { id: row.userId }, data: { passwordHash, emailVerifiedAt: current?.emailVerifiedAt ?? new Date() } });
    await tx.emailToken.deleteMany({ where: { userId: row.userId } });
    await tx.session.deleteMany({ where: { userId: row.userId } });
    return user;
  });
}

/** Igual que requireUser, pero exige el correo electrónico verificado. Lo usan las acciones que publican contenido. */
export async function requireVerifiedUser() {
  const u = await requireUser();
  if (!u.emailVerifiedAt) redirect("/verificar");
  return u;
}
