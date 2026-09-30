import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
export { hashPassword, verifyPassword } from "./password";
import { APP_URL, sendMail } from "./mail";

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

const VERIFY_HOURS = 48;

/** Crea un token de un solo uso y envía el enlace de verificación por correo. */
export async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  const token = randomBytes(32).toString("hex");
  await db.emailToken.deleteMany({ where: { userId: user.id } });
  await db.emailToken.create({ data: { id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + VERIFY_HOURS * 36e5) } });
  await sendMail(user.email, "Confirma tu correo electrónico en Ring España", `Hola ${user.name},\n\nConfirma tu correo electrónico aquí (caduca en ${VERIFY_HOURS} h):\n${APP_URL}/verificar?token=${token}\n`);
}

/** Consume el token y marca el email como verificado. Devuelve false si no es válido o ha caducado. */
export async function consumeVerificationToken(token: string) {
  const row = await db.emailToken.findUnique({ where: { id: sha256(token) } });
  if (!row || row.expiresAt < new Date()) return false;
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
    db.emailToken.deleteMany({ where: { userId: row.userId } }),
  ]);
  return true;
}

/** Igual que requireUser, pero exige email verificado. Lo usan las acciones que publican contenido. */
export async function requireVerifiedUser() {
  const u = await requireUser();
  if (!u.emailVerifiedAt) redirect("/verificar");
  return u;
}
