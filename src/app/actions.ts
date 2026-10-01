"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { Discipline } from "@prisma/client";
import { db } from "../lib/db";
import { consumeVerificationToken, createSession, destroyOtherSessions, destroySession, getUser, requireUser, requireVerifiedUser, resetPasswordWithToken, sendPasswordResetEmail, sendVerificationEmail, unsubscribeWithToken } from "../lib/auth";
import { dummyHash, hashPassword, needsRehash, verifyPassword } from "../lib/password";
import { HORA, MINUTO, addHit, allow, clearHits, clientIp, isBlocked } from "../lib/ratelimit";
import { maybePurge } from "../lib/retention";
import { APP_URL, sendMail } from "../lib/mail";
import { slugify, PROVINCES } from "../lib/labels";
import { audit } from "../lib/audit";
import { safeHttpUrl } from "../lib/url";
import { internalPath } from "../lib/paths";
import { proximityAppliesTo, proximityFlags, type Flag } from "../lib/coherence";
import { dayKey, eventDayReached, parseBirthDate, parseDay } from "../lib/dates";
import { isTournamentStyle, isDiscipline, parseDisciplineChoice, WEIGHT_CLASSES } from "../lib/disciplines";
import { notifyDecision, notifyFollowersOfBout } from "../lib/notify";
import { parsePrior } from "../lib/prior";
import { MAX_REPORTS_PER_DAY, REASONS_BY_ENTITY, REPORT_ENTITIES, REPORT_REASONS, type ReportEntity } from "../lib/reports";
import { anonymizeFighter } from "../lib/anonymize";
import { hasOwn } from "../lib/safe";
import { findNameCandidates } from "../lib/fighters";
import { AURA_COMMENT_MAX, AURA_PER_DAY, canGiveAura, pairKey, validateOutcome } from "../lib/rules";
import { LIMITS, isEmail, oneLine } from "../lib/text";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const intOrNull = (f: FormData, k: string) => {
  const s = str(f, k);
  return /^\d{1,3}$/.test(s) ? parseInt(s, 10) : null;
};

/** Redirige a `path` añadiendo un mensaje para el usuario (aviso de éxito o problema). */
function go(path: string, mensaje?: { aviso?: string; problema?: string }): never {
  if (!mensaje) redirect(path);
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  if (mensaje.aviso) params.set("aviso", mensaje.aviso);
  if (mensaje.problema) params.set("problema", mensaje.problema);
  redirect(`${base}?${params.toString()}`);
}

/** Un rechazo previsto dentro de una transacción: lleva el código del mensaje que se enseñará al usuario. */
class Rechazo extends Error {
  constructor(public problema: string) {
    super(problema);
  }
}

/**
 * Ejecuta `fn` traduciendo a mensajes claros los fallos previstos: un rechazo controlado, una restricción única
 * (doble envío o carrera entre dos peticiones) o un registro que ya no existe. Cualquier otro error se propaga.
 */
async function guard<T>(back: string, fn: () => Promise<T>, unique = "duplicado"): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Rechazo) go(back, { problema: e.problema });
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") go(back, { problema: unique });
      if (e.code === "P2025") go(back, { problema: "no_existe" });
    }
    throw e;
  }
}

/** Serializa las operaciones de un mismo usuario (límites diarios, avisos repetidos) con un bloqueo de PostgreSQL. */
async function withLock<T>(key: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    return fn(tx);
  });
}

/** Comprueba que ningún texto supere su longitud máxima; si alguno la supera, avisa y no guarda nada. */
function checkLengths(f: FormData, back: string, fields: Record<string, number>) {
  for (const [k, max] of Object.entries(fields)) if (str(f, k).length > max) go(back, { problema: "texto_largo" });
}

/** Provincia elegida en un formulario: debe estar en la lista; si viene vacía se usa `fallback` (si es válido). */
function readProvince(f: FormData, key: string, back: string, fallback?: string | null): string {
  const v = str(f, key) || fallback || "";
  if (!PROVINCES.includes(v)) go(back, { problema: "provincia_no_valida" });
  return v;
}

async function requireAdmin() {
  const u = await getUser();
  if (!u) go("/entrar?next=%2Fmoderacion", { problema: "sin_sesion" });
  if (u.role !== "ADMIN") go("/", { problema: "solo_moderadores" });
  return u;
}

type Client = Prisma.TransactionClient | typeof db;

/** Señales de coherencia de un combate nuevo respecto a los demás combates de sus dos peleadores (incluidos los de la misma velada). */
async function coherenceFlagsFor(client: Client, eventDate: Date, discipline: Discipline, fighterIds: string[]): Promise<Flag[]> {
  if (!proximityAppliesTo(discipline)) return []; // torneos (jiu-jitsu): varios combates el mismo día son normales
  const others = await client.bout.findMany({
    where: { verification: { not: "DISPUTED" }, OR: [{ fighterAId: { in: fighterIds } }, { fighterBId: { in: fighterIds } }] },
    select: { event: { select: { date: true, discipline: true } } },
  });
  return proximityFlags(eventDate, others.filter((o) => !isTournamentStyle(o.event.discipline)).map((o) => o.event.date));
}

/** Se asegura de que el peleador tenga la disciplina en su ficha (sin tocar categoría ni récord si ya existe). */
async function ensureDiscipline(client: Client, fighterId: string, discipline: Discipline) {
  await client.fighterDiscipline.upsert({ where: { fighterId_discipline: { fighterId, discipline } }, create: { fighterId, discipline }, update: {} });
}

async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>, fallback = "sin-nombre") {
  const root = base || fallback;
  let slug = root;
  for (let i = 2; await exists(slug); i++) slug = `${root}-${i}`;
  return slug;
}

// ---------- Cuentas ----------

const MIN_PASSWORD = 8;

/** Comprueba la contraseña elegida (registro y cambio); si no vale, vuelve a `back` con el motivo. */
function checkNewPassword(password: string, back: string) {
  if (password.length < MIN_PASSWORD) go(back, { problema: "registro_password" });
  if (password.length > LIMITS.password) go(back, { problema: "contrasena_larga" });
}

export async function register(f: FormData) {
  const back = "/registro";
  const email = str(f, "email").toLowerCase();
  const name = oneLine(str(f, "name"));
  const password = String(f.get("password") ?? "");
  const role = str(f, "role") === "FIGHTER" ? "FIGHTER" : "FAN";
  const ip = await clientIp();
  if (ip && !(await allow(`registro:ip:${ip}`, 10, HORA))) go(back, { problema: "demasiados_intentos" });
  if (!name || name.length > LIMITS.name || !isEmail(email)) go(back, { problema: "registro_datos" });
  checkNewPassword(password, back);
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) go(back, { problema: "registro_email_existe" });
  await maybePurge();
  const passwordHash = await hashPassword(password);
  const user = await guard(back, () => db.user.create({ data: { email, name, role, passwordHash } }), "registro_email_existe");
  const enviado = await sendVerificationEmail(user);
  await createSession(user.id);
  go("/verificar", enviado ? undefined : { problema: "correo_no_enviado" });
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
  for (const [clave, max] of claves) if (await isBlocked(clave, max, 15 * MINUTO)) go(back, { problema: "demasiados_intentos" });

  const user = await db.user.findUnique({ where: { email } });
  // Con un correo que no existe se verifica igualmente contra un hash de mentira: así tarda lo mismo y no se puede averiguar qué correos hay registrados.
  const ok = await verifyPassword(password.length <= LIMITS.password ? password : "", user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok) {
    await Promise.all(claves.map(([clave]) => addHit(clave)));
    go(back, { problema: "login_incorrecto" });
  }
  await clearHits(`acceso:correo:${email}`);
  if (needsRehash(user.passwordHash)) await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  await createSession(user.id);
  go(next || (user.role === "FIGHTER" ? "/mi-ficha" : "/"));
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
  const user = await resetPasswordWithToken(token, await hashPassword(password));
  if (!user) go("/recuperar", { problema: "token_invalido" });
  await sendMail(user.email, "Tu contraseña de Ring España se ha cambiado", `Hola ${oneLine(user.name)},\n\nTu contraseña se ha cambiado y se han cerrado las sesiones abiertas en otros dispositivos.\n\nSi no has sido tú, pide una contraseña nueva cuanto antes desde la página de acceso.\n`);
  await createSession(user.id);
  go("/", { aviso: "contrasena_cambiada" });
}

// ---------- Mi cuenta: datos, contraseña, baja de avisos y eliminación ----------

/**
 * Comprueba la contraseña actual antes de una operación delicada (cambiar la contraseña, eliminar la cuenta). Cuenta como un
 * intento de acceso: si se falla varias veces seguidas, se bloquea durante unos minutos (evita adivinarla desde una sesión abierta).
 */
async function confirmOwnPassword(user: { email: string; passwordHash: string }, password: string, back: string) {
  const clave = `acceso:correo:${user.email}`;
  if (await isBlocked(clave, LOGIN_MAX_POR_CORREO, 15 * MINUTO)) go(back, { problema: "demasiados_intentos" });
  if (password.length > LIMITS.password || !(await verifyPassword(password, user.passwordHash))) {
    await addHit(clave);
    go(back, { problema: "contrasena_actual_incorrecta" });
  }
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
  go("/baja", ok ? { aviso: "avisos_desactivados" } : { problema: "token_invalido" });
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
      if (fighter._count.boutsAsA + fighter._count.boutsAsB === 0) { await tx.fighter.delete({ where: { id: fighter.id } }); ficha = "borrada"; }
      else { await anonymizeFighter(tx, fighter.id); ficha = "anonimizada"; }
    }
    await audit({ userId: null, entity: "USER", entityId: user.id, action: "ACCOUNT_DELETED", after: { role: user.role, ficha } }, tx);
    await tx.user.delete({ where: { id: user.id } });
  }));
  await destroySession();
  go("/", { aviso: "cuenta_eliminada" });
}

// ---------- Ficha del peleador (autogestionada) ----------

/** Lee del formulario la disciplina elegida (con categoría) y el récord de partida declarado. */
function readDisciplineForm(f: FormData) {
  const choice = parseDisciplineChoice(str(f, "disciplineChoice"));
  const prior = parsePrior({ total: str(f, "priorTotal"), wins: str(f, "priorWins"), losses: str(f, "priorLosses"), draws: str(f, "priorDraws") });
  return { choice, prior };
}

export async function createMyFighter(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  if (user.fighter) redirect(back);
  checkLengths(f, back, { firstName: LIMITS.firstName, lastName: LIMITS.lastName, alias: LIMITS.alias, gym: LIMITS.gym, city: LIMITS.city });
  const firstName = str(f, "firstName");
  const lastName = str(f, "lastName");
  if (!firstName || !lastName) go(back, { problema: "nombre_ficha" });
  const { choice, prior } = readDisciplineForm(f);
  if (!choice) go(back, { problema: "disciplina_no_valida" });
  if (!prior.ok) go(back, { problema: prior.error });
  const province = readProvince(f, "province", back, "Madrid");
  const city = str(f, "city") || province;
  const gymName = str(f, "gym");

  const created = await guard(back, async () => {
    let gymId: string | undefined;
    if (gymName) {
      const gymSlug = slugify(`${gymName} ${city}`) || slugify(gymName) || "gimnasio";
      const gym = await db.gym.upsert({ where: { slug: gymSlug }, create: { name: gymName, slug: gymSlug, city, province }, update: {} });
      gymId = gym.id;
    }
    const slug = await uniqueSlug(slugify(`${firstName} ${lastName}`), async (s) => !!(await db.fighter.findUnique({ where: { slug: s } })), "peleador");
    return db.fighter.create({
      data: {
        slug, firstName, lastName, alias: str(f, "alias") || null, city, province, level: "AMATEUR", gymId, userId: user.id,
        disciplines: { create: { discipline: choice.discipline, weightClass: choice.weightClass, priorTotal: prior.prior.total, priorWins: prior.prior.wins, priorLosses: prior.prior.losses, priorDraws: prior.prior.draws } },
      },
    });
  });
  await audit({ userId: user.id, entity: "FIGHTER", entityId: created.id, action: "CREATED", after: { discipline: choice.discipline, weightClass: choice.weightClass, priorDeclared: prior.prior } });
  go(back, { aviso: "ficha_creada" });
}

/** Corrige los datos personales de la propia ficha. Cada cambio queda en el historial con el valor anterior. */
export async function updateMyFighter(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  const me = user.fighter;
  if (!me) go(back);
  checkLengths(f, back, { firstName: LIMITS.firstName, lastName: LIMITS.lastName, alias: LIMITS.alias, gym: LIMITS.gym, city: LIMITS.city, bio: LIMITS.bio });
  const firstName = str(f, "firstName");
  const lastName = str(f, "lastName");
  if (!firstName || !lastName) go(back, { problema: "nombre_ficha" });
  const province = readProvince(f, "province", back, me.province);
  const city = str(f, "city") || province;
  const stance = str(f, "stance");
  if (stance && !["ORTODOXO", "ZURDO", "AMBIDIESTRO"].includes(stance)) go(back, { problema: "datos_ficha" });
  const rawBirth = str(f, "birthDate");
  const birthDate = rawBirth ? parseBirthDate(rawBirth) : null;
  if (rawBirth && !birthDate) go(back, { problema: "nacimiento_invalido" });
  const measure = (key: string, min: number, max: number) => {
    const raw = str(f, key);
    if (!raw) return null;
    const n = /^\d{2,3}$/.test(raw) ? parseInt(raw, 10) : NaN;
    if (!(n >= min && n <= max)) go(back, { problema: "medida_invalida" });
    return n;
  };
  const heightCm = measure("heightCm", 100, 250);
  const reachCm = measure("reachCm", 100, 260);
  const gymName = str(f, "gym");
  const patch = { firstName, lastName, alias: str(f, "alias") || null, city, province, bio: str(f, "bio") || null, stance: (stance || null) as "ORTODOXO" | "ZURDO" | "AMBIDIESTRO" | null, birthDate, heightCm, reachCm };
  await guard(back, () => db.$transaction(async (tx) => {
    let gymId: string | null = null;
    if (gymName) {
      const gymSlug = slugify(`${gymName} ${city}`) || slugify(gymName) || "gimnasio";
      gymId = (await tx.gym.upsert({ where: { slug: gymSlug }, create: { name: gymName, slug: gymSlug, city, province }, update: {} })).id;
    }
    await tx.fighter.update({ where: { id: me.id }, data: { ...patch, gymId } });
    await audit({ userId: user.id, entity: "FIGHTER", entityId: me.id, action: "PROFILE_UPDATED", before: { firstName: me.firstName, lastName: me.lastName, alias: me.alias, city: me.city, province: me.province, gymId: me.gymId }, after: { firstName, lastName, alias: patch.alias, city, province, gymId } }, tx);
  }));
  revalidatePath("/", "layout");
  go(back, { aviso: "ficha_actualizada" });
}

/** Añade una disciplina a la ficha, o actualiza su categoría y su récord de partida (declarado). Cada cambio queda en el historial. */
export async function saveDiscipline(f: FormData) {
  const user = await requireVerifiedUser();
  const me = user.fighter;
  if (!me) redirect("/mi-ficha");
  const { choice, prior } = readDisciplineForm(f);
  if (!choice) go("/mi-ficha", { problema: "disciplina_no_valida" });
  if (!prior.ok) go("/mi-ficha", { problema: prior.error });
  const before = await db.fighterDiscipline.findUnique({ where: { fighterId_discipline: { fighterId: me.id, discipline: choice.discipline } } });
  const data = { weightClass: choice.weightClass, priorTotal: prior.prior.total, priorWins: prior.prior.wins, priorLosses: prior.prior.losses, priorDraws: prior.prior.draws };
  await db.$transaction([
    db.fighterDiscipline.upsert({
      where: { fighterId_discipline: { fighterId: me.id, discipline: choice.discipline } },
      create: { fighterId: me.id, discipline: choice.discipline, ...data }, update: data,
    }),
    audit({ userId: user.id, entity: "FIGHTER", entityId: me.id, action: before ? "DISCIPLINE_UPDATED" : "DISCIPLINE_ADDED", before: before ?? undefined, after: { discipline: choice.discipline, ...data } }, db),
  ]);
  revalidatePath("/", "layout");
  go("/mi-ficha", { aviso: "disciplina_guardada" });
}

// ---------- Combates ----------

const MAX_BOUTS_PER_DAY = 10;

/** Campos del formulario «Registrar un combate» que se reenvían al elegir al rival. */
const BOUT_FIELDS = ["discipline", "eventName", "date", "venue", "city", "province", "oppFirst", "oppLast", "outcome", "method", "rounds", "endRound", "evidenceUrl"] as const;

/**
 * El peleador registra un combate propio. Queda «pendiente de confirmar» hasta que el rival lo confirme o un moderador lo verifique.
 * Todo se valida antes de guardar y se guarda en una sola transacción: no quedan velada ni rival a medias si algo falla.
 */
export async function addBout(f: FormData) {
  const user = await requireVerifiedUser();
  const me = user.fighter;
  const back = "/mi-ficha";
  if (!me) redirect(back);
  checkLengths(f, back, { eventName: LIMITS.eventName, venue: LIMITS.venue, city: LIMITS.city, oppFirst: LIMITS.firstName, oppLast: LIMITS.lastName, evidenceUrl: LIMITS.url });

  const eventName = str(f, "eventName");
  const oppFirst = str(f, "oppFirst");
  const oppLast = str(f, "oppLast");
  if (!eventName || !oppFirst || !oppLast) go(back, { problema: "combate_datos" });
  const date = parseDay(str(f, "date"));
  if (!date) go(back, { problema: "fecha_invalida" });
  const disciplineRaw = str(f, "discipline");
  const myDiscipline = isDiscipline(disciplineRaw) ? me.disciplines.find((d) => d.discipline === disciplineRaw) : undefined;
  if (!myDiscipline) go(back, { problema: "combate_sin_disciplina" });
  const discipline = myDiscipline.discipline;
  const province = readProvince(f, "province", back, me.province);
  const city = str(f, "city") || me.city || province;
  const rounds = (() => { const n = intOrNull(f, "rounds"); return n && n <= 12 ? n : null; })();

  // Resultado: solo si el día del combate ya ha llegado; se valida contra la disciplina. Nada se descarta en silencio.
  const past = eventDayReached(date);
  let result: Extract<ReturnType<typeof validateOutcome>, { ok: true }> | null = null;
  if (past) {
    const v = validateOutcome({ discipline, outcome: str(f, "outcome"), method: str(f, "method"), endRound: intOrNull(f, "endRound"), rounds });
    if (!v.ok) go(back, { problema: v.problema });
    result = v;
  } else if (str(f, "outcome")) {
    go(back, { problema: "combate_futuro_resultado" });
  }

  const doneToday = await db.auditLog.count({ where: { userId: user.id, entity: "BOUT", action: "CREATED", createdAt: { gte: new Date(Date.now() - 864e5) } } });
  if (doneToday >= MAX_BOUTS_PER_DAY) go(back, { problema: "combate_limite_dia" });

  // Rival: se elige por identificador. Si ya hay fichas con ese nombre, se le pide a la persona que elija cuál es (o que cree una nueva).
  const rivalId = str(f, "rivalId");
  let rivalExisting: { id: string } | null = null;
  if (rivalId && rivalId !== "nuevo") {
    rivalExisting = await db.fighter.findFirst({ where: { id: rivalId, hiddenAt: null }, select: { id: true } });
    if (!rivalExisting) go(back, { problema: "no_existe" });
  } else if (!rivalId) {
    if ((await findNameCandidates(oppFirst, oppLast)).length > 0) {
      const qs = new URLSearchParams();
      for (const k of BOUT_FIELDS) if (str(f, k)) qs.set(k, str(f, k));
      go(`/mi-ficha/rival?${qs.toString()}`);
    }
  }
  if (rivalExisting && rivalExisting.id === me.id) go(back, { problema: "combate_mismo" });

  const slugBase = slugify(`${eventName} ${dayKey(date)}`) || `velada-${dayKey(date)}`;
  const evidenceUrl = safeHttpUrl(str(f, "evidenceUrl"));
  if (str(f, "evidenceUrl") && !evidenceUrl) go(back, { problema: "url_invalida" });

  const created = await guard(back, () =>
    db.$transaction(async (tx) => {
      let event = await tx.event.findUnique({ where: { slug: slugBase } });
      if (event) {
        if (event.discipline !== discipline) throw new Rechazo("combate_disciplina");
        if (event.organizerId) throw new Rechazo("combate_velada_oficial"); // no se cuelgan combates propios en la velada oficial de otro
      } else {
        event = await tx.event.create({
          data: { slug: slugBase, name: eventName, date, discipline, level: "AMATEUR", venue: str(f, "venue") || "Por confirmar", city, province, status: past ? "COMPLETED" : "SCHEDULED", createdById: user.id },
        });
      }
      const rival = rivalExisting
        ?? (await tx.fighter.create({
          // Ficha creada por un tercero: sin ciudad ni provincia inventadas y sin publicar hasta que su titular la reclame o el combate se confirme.
          data: { slug: await uniqueSlug(slugify(`${oppFirst} ${oppLast}`), async (s) => !!(await tx.fighter.findUnique({ where: { slug: s } })), "peleador"), firstName: oppFirst, lastName: oppLast, level: "AMATEUR", listed: false },
        }));
      await ensureDiscipline(tx, rival.id, discipline);
      const flags = await coherenceFlagsFor(tx, event.date, discipline, [me.id, rival.id]);
      const bout = await tx.bout.create({
        data: {
          flags, eventId: event.id, fighterAId: me.id, fighterBId: rival.id, pairKey: pairKey(me.id, rival.id),
          result: result?.result ?? null, method: result?.method ?? null, endRound: result?.endRound ?? null, rounds,
          weightClass: myDiscipline.weightClass, verification: "SELF_REPORTED", createdById: user.id, evidenceUrl,
        },
      });
      await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "CREATED", after: { result: bout.result, method: bout.method, verification: "SELF_REPORTED", evidenceUrl, flags } }, tx);
      return bout;
    }),
    "combate_duplicado",
  );
  revalidatePath("/", "layout");
  go(back, { aviso: created.result ? "combate_registrado" : "combate_registrado_futuro" });
}

/**
 * El peleador que declaró un combate pendiente puede poner o corregir su resultado cuando el día ya ha llegado
 * (por ejemplo, si lo registró antes de que se celebrara). Sigue «pendiente de confirmar»: no sube de nivel de respaldo.
 */
export async function setMyBoutResult(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  if (!bout) go(back, { problema: "no_existe" });
  if (bout.createdById !== user.id || bout.verification !== "SELF_REPORTED") go(back, { problema: "sin_permiso" });
  if (!eventDayReached(bout.event.date)) go(back, { problema: "resultado_futuro" });
  const v = validateOutcome({ discipline: bout.event.discipline, outcome: str(f, "outcome"), method: str(f, "method"), endRound: intOrNull(f, "endRound"), rounds: bout.rounds });
  if (!v.ok) go(back, { problema: v.problema });
  await db.$transaction(async (tx) => {
    await tx.bout.update({ where: { id: bout.id }, data: { result: v.result, method: v.method, endRound: v.endRound } });
    await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "RESULT_SET_BY_AUTHOR", before: { result: bout.result, method: bout.method }, after: { result: v.result, method: v.method, endRound: v.endRound } }, tx);
  });
  revalidatePath("/", "layout");
  go(back, { aviso: "resultado_guardado" });
}

/** El rival (si tiene cuenta) confirma o rechaza un combate declarado por el otro peleador. */
export async function respondBout(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") } });
  const me = user.fighter;
  if (!bout || !me) go(back, { problema: "no_existe" });
  if (bout.verification !== "SELF_REPORTED") go(back, { problema: "moderacion_estado" });
  if (bout.fighterBId !== me.id) go(back, { problema: "sin_permiso" }); // solo el rival del creador
  const next = str(f, "decision") === "confirm" ? "CONFIRMED" : "DISPUTED";
  await db.$transaction(async (tx) => {
    await tx.bout.update({ where: { id: bout.id }, data: { verification: next } });
    if (next === "CONFIRMED") await tx.fighter.updateMany({ where: { id: { in: [bout.fighterAId, bout.fighterBId] } }, data: { listed: true } });
    await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: `RIVAL_${next}`, before: { verification: bout.verification }, after: { verification: next } }, tx);
  });
  revalidatePath("/", "layout");
  go(back, { aviso: next === "CONFIRMED" ? "combate_confirmado" : "combate_rechazado" });
}

/** Cola de moderación de combates: verificar, rechazar o restaurar uno rechazado. Solo moderadores. */
export async function adminDecide(f: FormData) {
  const admin = await requireAdmin();
  const back = "/moderacion";
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") } });
  if (!bout) go(back, { problema: "no_existe" });
  const decision = str(f, "decision");
  const plan =
    decision === "verify" && bout.verification !== "VERIFIED" ? { next: "VERIFIED" as const, aviso: "moderacion_verificado" }
    : decision === "dispute" && bout.verification !== "DISPUTED" ? { next: "DISPUTED" as const, aviso: "moderacion_rechazado" }
    : decision === "restore" && bout.verification === "DISPUTED" ? { next: "SELF_REPORTED" as const, aviso: "moderacion_restaurado" }
    : null;
  if (!plan) go(back, { problema: "moderacion_estado" });
  await db.$transaction(async (tx) => {
    await tx.bout.update({ where: { id: bout.id }, data: { verification: plan.next } });
    if (plan.next === "VERIFIED") await tx.fighter.updateMany({ where: { id: { in: [bout.fighterAId, bout.fighterBId] } }, data: { listed: true } });
    await audit({ userId: admin.id, entity: "BOUT", entityId: bout.id, action: `ADMIN_${plan.next}`, before: { verification: bout.verification }, after: { verification: plan.next } }, tx);
  });
  revalidatePath("/", "layout");
  go(back, { aviso: plan.aviso });
}

// ---------- Aura del público ----------

/**
 * Dar aura a un peleador por su actuación en un combate. Las reglas están en `canGiveAura` (lib/rules.ts):
 * combate celebrado, con resultado, no cancelado ni en revisión, y quien la da no participa en él.
 * Además: cuenta con el correo verificado, una aura por persona, combate y peleador (volver a pulsar solo actualiza el comentario)
 * y máximo AURA_PER_DAY al día, comprobado con un bloqueo para que dos peticiones a la vez no se salten el límite.
 */
export async function giveAura(f: FormData) {
  const user = await getUser();
  const back = internalPath(str(f, "back"));
  if (!user) redirect(`/entrar?next=${encodeURIComponent(back)}`);
  if (!user.emailVerifiedAt) redirect("/verificar");
  if (str(f, "comment").length > AURA_COMMENT_MAX) go(back, { problema: "texto_largo" });
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  const fighterId = str(f, "fighterId");
  if (!bout) go(back, { problema: "aura_no_existe" });
  const verdict = canGiveAura({ bout, fighterId, viewerFighterId: user.fighter?.id });
  if (!verdict.ok) go(back, { problema: verdict.problema });

  const comment = str(f, "comment") || null;
  const attended = f.get("attended") === "on";
  const status = await withLock(`aura:${user.id}`, async (tx) => {
    const recent = await tx.aura.count({ where: { userId: user.id, updatedAt: { gte: new Date(Date.now() - 864e5) } } });
    if (recent >= AURA_PER_DAY) return "limite" as const;
    await tx.aura.upsert({
      where: { userId_boutId_fighterId: { userId: user.id, boutId: bout.id, fighterId } },
      create: { userId: user.id, boutId: bout.id, fighterId, comment, attended },
      update: { comment, attended },
    });
    return "ok" as const;
  });
  if (status === "limite") go(back, { problema: "aura_limite" });
  revalidatePath("/", "layout");
  go(back, { aviso: "aura_dada" });
}

export async function removeAura(f: FormData) {
  const user = await getUser();
  const back = internalPath(str(f, "back"));
  if (!user) redirect(`/entrar?next=${encodeURIComponent(back)}`);
  await db.aura.deleteMany({ where: { userId: user.id, boutId: str(f, "boutId"), fighterId: str(f, "fighterId") } });
  revalidatePath("/", "layout");
  go(back, { aviso: "aura_quitada" });
}

// ---------- Verificación de correo ----------

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

// ---------- Reclamar una ficha existente ----------

const MAX_OPEN_REQUESTS = 3;

export async function requestClaim(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/mi-ficha";
  if (user.fighter) redirect(back);
  checkLengths(f, back, { message: LIMITS.message });
  const fighter = await db.fighter.findUnique({ where: { id: str(f, "fighterId") } });
  if (!fighter || fighter.userId || fighter.hiddenAt) go(back, { problema: "reclamar_no_disponible" });
  const open = await db.claimRequest.count({ where: { userId: user.id, status: "PENDING", NOT: { fighterId: fighter.id } } });
  if (open >= MAX_OPEN_REQUESTS) go(back, { problema: "solicitud_limite" });
  const message = str(f, "message") || null;
  await db.claimRequest.upsert({
    where: { userId_fighterId: { userId: user.id, fighterId: fighter.id } },
    create: { userId: user.id, fighterId: fighter.id, message },
    update: { message, status: "PENDING" },
  });
  go(back, { aviso: "solicitud_enviada" });
}

export async function decideClaim(f: FormData) {
  const admin = await requireAdmin();
  const back = "/moderacion";
  const claim = await db.claimRequest.findUnique({ where: { id: str(f, "claimId") }, include: { fighter: true } });
  if (!claim || claim.status !== "PENDING") go(back, { problema: "no_existe" });
  const wantsApprove = str(f, "decision") === "approve";
  const note = str(f, "note").slice(0, LIMITS.note) || null;
  if (!wantsApprove && !note) go(back, { problema: "motivo_falta" }); // quien recibe un «no» tiene derecho a saber por qué
  const approved = await db.$transaction(async (tx) => {
    let ok = false;
    // Asignación condicional: si dos moderadores aprueban a la vez, solo una gana; y una persona no puede tener dos fichas.
    if (wantsApprove && !(await tx.fighter.findFirst({ where: { userId: claim.userId } }))) {
      ok = (await tx.fighter.updateMany({ where: { id: claim.fighterId, userId: null, hiddenAt: null }, data: { userId: claim.userId, listed: true } })).count === 1;
    }
    // Se borra el texto con el que la persona justificó su identidad: ya no hace falta y no debe conservarse.
    await tx.claimRequest.update({ where: { id: claim.id }, data: { status: ok ? "APPROVED" : "REJECTED", message: null, reviewNote: note, reviewedAt: new Date() } });
    if (ok) {
      await tx.claimRequest.updateMany({ where: { fighterId: claim.fighterId, id: { not: claim.id }, status: "PENDING" }, data: { status: "REJECTED", message: null } });
      // Quien reclama una ficha no puede conservar el aura ni el seguimiento que dio a esa misma persona antes de ser ella.
      await tx.aura.deleteMany({ where: { userId: claim.userId, bout: { OR: [{ fighterAId: claim.fighterId }, { fighterBId: claim.fighterId }] } } });
      await tx.follow.deleteMany({ where: { userId: claim.userId, fighterId: claim.fighterId } });
    }
    await audit({ userId: admin.id, entity: "CLAIM", entityId: claim.id, action: ok ? "APPROVED" : "REJECTED", after: { userId: claim.userId, fighterId: claim.fighterId, requestedApproval: wantsApprove } }, tx);
    return ok;
  });
  revalidatePath("/", "layout");
  const nombreFicha = `${claim.fighter.firstName} ${claim.fighter.lastName}`;
  after(async () => {
    await notifyDecision(claim.userId, approved ? "Tu solicitud de ficha en Ring España ha sido aprobada" : "Tu solicitud de ficha en Ring España no se ha aprobado",
      approved ? `Un moderador ha aprobado tu solicitud: la ficha de ${nombreFicha} ya es tuya. Puedes verla y corregir sus datos aquí: ${APP_URL}/mi-ficha`
        : `Un moderador no ha podido aprobar tu solicitud para reclamar la ficha de ${nombreFicha}.${note ? ` Motivo: ${oneLine(note)}.` : ""}\n\nSi crees que es un error, puedes enviar otra solicitud con más información aquí: ${APP_URL}/mi-ficha`);
  });
  if (wantsApprove && !approved) go(back, { problema: "reclamacion_no_aprobable" });
  go(back, { aviso: approved ? "reclamacion_aprobada" : "reclamacion_rechazada" });
}

// ---------- Organizadores ----------

export async function requestOrganizer(f: FormData) {
  const user = await requireVerifiedUser();
  const back = "/organizador";
  checkLengths(f, back, { orgName: LIMITS.orgName, message: LIMITS.message });
  const orgName = str(f, "orgName");
  if (!orgName) go(back, { problema: "nombre_organizacion" });
  const message = str(f, "message") || null;
  if (!message) go(back, { problema: "organizador_sin_datos" });
  await db.organizerRequest.upsert({
    where: { userId: user.id },
    create: { userId: user.id, orgName, message },
    update: { orgName, message, status: "PENDING" },
  });
  go(back, { aviso: "solicitud_enviada" });
}

export async function decideOrganizer(f: FormData) {
  const admin = await requireAdmin();
  const back = "/moderacion";
  const req = await db.organizerRequest.findUnique({ where: { id: str(f, "requestId") }, include: { user: true } });
  if (!req || req.status !== "PENDING") go(back, { problema: "no_existe" });
  const approve = str(f, "decision") === "approve";
  const note = str(f, "note").slice(0, LIMITS.note) || null;
  // El sello de organizador se apoya en una evidencia: se anota qué se ha comprobado al aprobar y el motivo al rechazar (quien recibe un «no» tiene derecho a saber por qué).
  if (!note) go(back, { problema: approve ? "evidencia_falta" : "motivo_falta" });
  await db.$transaction(async (tx) => {
    await tx.organizerRequest.update({ where: { id: req.id }, data: { status: approve ? "APPROVED" : "REJECTED", reviewNote: note, reviewedAt: new Date(), message: null } });
    // Los permisos de organizador salen del rol: se concede a cualquier persona que no sea ya moderadora (un peleador también puede organizar).
    if (approve && req.user.role !== "ADMIN") await tx.user.update({ where: { id: req.userId }, data: { role: "ORGANIZER" } });
    await audit({ userId: admin.id, entity: "ORGANIZER", entityId: req.id, action: approve ? "APPROVED" : "REJECTED", after: { userId: req.userId, orgName: req.orgName, note } }, tx);
  });
  revalidatePath("/", "layout");
  after(async () => {
    await notifyDecision(req.userId, approve ? "Ya puedes publicar veladas en Ring España" : "Tu solicitud de organizador en Ring España no se ha aprobado",
      approve ? `Un moderador ha aprobado tu solicitud como organizador de «${oneLine(req.orgName)}». Ya puedes crear veladas y montar sus carteles aquí: ${APP_URL}/organizador`
        : `Un moderador no ha podido aprobar tu solicitud como organizador de «${oneLine(req.orgName)}».${note ? ` Motivo: ${oneLine(note)}.` : ""}\n\nPuedes enviar otra solicitud con más información aquí: ${APP_URL}/organizador`);
  });
  go(back, { aviso: approve ? "organizador_aprobado" : "organizador_rechazado" });
}

async function requireOrganizer() {
  const user = await requireVerifiedUser();
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") go("/organizador", { problema: "sin_permiso" });
  return user;
}

async function ownEvent(eventId: string, user: { id: string; role: string }) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) go("/organizador", { problema: "no_existe" });
  if (event.organizerId !== user.id && user.role !== "ADMIN") go("/organizador", { problema: "sin_permiso" });
  return event;
}

export async function createEvent(f: FormData) {
  const user = await requireOrganizer();
  const back = "/organizador";
  checkLengths(f, back, { name: LIMITS.eventName, venue: LIMITS.venue, city: LIMITS.city, promoter: LIMITS.promoter, ticketUrl: LIMITS.url });
  const name = str(f, "name");
  if (!name) go(back, { problema: "velada_datos" });
  const date = parseDay(str(f, "date"));
  if (!date) go(back, { problema: "fecha_invalida" });
  const level = str(f, "level") === "PRO" ? "PRO" : "AMATEUR";
  const disciplineRaw = str(f, "discipline");
  const discipline: Discipline = isDiscipline(disciplineRaw) ? disciplineRaw : "BOXEO";
  const province = readProvince(f, "province", back, "Madrid");
  const ticketRaw = str(f, "ticketUrl");
  const ticketUrl = ticketRaw ? safeHttpUrl(ticketRaw) : null;
  if (ticketRaw && !ticketUrl) go(back, { problema: "url_invalida" });
  const base = slugify(`${name} ${dayKey(date)}`) || `velada-${dayKey(date)}`;
  if (await db.event.findFirst({ where: { organizerId: user.id, slug: { startsWith: base }, name, date } })) go(back, { problema: "velada_duplicada" });
  const created = await guard(back, async () => {
    const slug = await uniqueSlug(base, async (s) => !!(await db.event.findUnique({ where: { slug: s } })));
    return db.event.create({
      data: {
        slug, name, date, discipline, level, venue: str(f, "venue") || "Por confirmar", city: str(f, "city") || province, province,
        promoter: str(f, "promoter") || null, ticketUrl, organizerId: user.id, createdById: user.id,
      },
    });
  });
  await audit({ userId: user.id, entity: "EVENT", entityId: created.id, action: "CREATED", after: { name, date, level, discipline } });
  revalidatePath("/", "layout");
  go(`/organizador/${created.slug}`, { aviso: "velada_creada" });
}

/** Añade un combate al cartel. Lo introduce el organizador del evento, así que nace VERIFIED. */
export async function addCartelBout(f: FormData) {
  const user = await requireOrganizer();
  const event = await ownEvent(str(f, "eventId"), user);
  const back = `/organizador/${event.slug}`;
  checkLengths(f, back, { evidenceUrl: LIMITS.url });
  // Cada esquina se elige de una lista que lleva el identificador de la ficha (no un texto que haya que escribir igual).
  const [a, b] = await Promise.all([
    db.fighter.findFirst({ where: { id: str(f, "fighterA"), hiddenAt: null } }),
    db.fighter.findFirst({ where: { id: str(f, "fighterB"), hiddenAt: null } }),
  ]);
  if (!a || !b || a.id === b.id) go(back, { problema: "cartel_boxeadores" });
  const rounds = intOrNull(f, "rounds");
  const weightClassRaw = str(f, "weightClass");
  if (weightClassRaw && !WEIGHT_CLASSES[event.discipline].includes(weightClassRaw)) go(back, { problema: "cartel_categoria" });
  const evidenceRaw = str(f, "evidenceUrl");
  const evidenceUrl = evidenceRaw ? safeHttpUrl(evidenceRaw) : null;
  if (evidenceRaw && !evidenceUrl) go(back, { problema: "url_invalida" });

  const created = await guard(back, () =>
    db.$transaction(async (tx) => {
      // Aparecer en un cartel oficial hace pública la ficha del peleador.
      await tx.fighter.updateMany({ where: { id: { in: [a.id, b.id] } }, data: { listed: true } });
      await Promise.all([ensureDiscipline(tx, a.id, event.discipline), ensureDiscipline(tx, b.id, event.discipline)]);
      const flags = await coherenceFlagsFor(tx, event.date, event.discipline, [a.id, b.id]);
      const order = await tx.bout.count({ where: { eventId: event.id } });
      const bout = await tx.bout.create({
        data: { flags, eventId: event.id, fighterAId: a.id, fighterBId: b.id, pairKey: pairKey(a.id, b.id), order: order + 1, weightClass: weightClassRaw || null, rounds: rounds && rounds <= 12 ? rounds : null, verification: "VERIFIED", createdById: user.id, evidenceUrl },
      });
      await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "CREATED_BY_ORGANIZER", after: { eventId: event.id, fighterA: a.slug, fighterB: b.slug, evidenceUrl } }, tx);
      return bout;
    }),
    "cartel_duplicado",
  );
  revalidatePath("/", "layout");
  // Solo combates de organizador y futuros. Se avisa después de responder: un fallo del correo no debe afectar a un combate ya guardado.
  after(async () => {
    try { await notifyFollowersOfBout(created.id); } catch (e) { console.error(`[avisos] no se pudieron enviar los avisos del combate: ${e instanceof Error ? e.message : String(e)}`); }
  });
  go(back, { aviso: "cartel_anadido" });
}

export async function setBoutResult(f: FormData) {
  const user = await requireOrganizer();
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  if (!bout) go("/organizador", { problema: "no_existe" });
  const event = await ownEvent(bout.eventId, user);
  const back = `/organizador/${event.slug}`;
  if (!eventDayReached(event.date)) go(back, { problema: "resultado_futuro" });
  if (bout.verification === "DISPUTED" && user.role !== "ADMIN") go(back, { problema: "resultado_disputado" });
  const v = validateOutcome({ discipline: event.discipline, outcome: str(f, "outcome"), method: str(f, "method"), endRound: intOrNull(f, "endRound"), rounds: bout.rounds });
  if (!v.ok) go(back, { problema: v.problema });
  // Solo se eleva a «verificado» lo que ha creado el propio organizador (o un moderador): un combate ajeno conserva su estado.
  const verification = user.role === "ADMIN" || bout.createdById === user.id ? "VERIFIED" : bout.verification;
  await db.$transaction(async (tx) => {
    await tx.bout.update({ where: { id: bout.id }, data: { result: v.result, method: v.method, endRound: v.endRound, verification } });
    await tx.event.update({ where: { id: event.id }, data: { status: "COMPLETED" } });
    if (verification === "VERIFIED") await tx.fighter.updateMany({ where: { id: { in: [bout.fighterAId, bout.fighterBId] } }, data: { listed: true } });
    await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "RESULT_SET", before: { result: bout.result, method: bout.method, endRound: bout.endRound, verification: bout.verification }, after: { result: v.result, method: v.method, endRound: v.endRound, verification } }, tx);
  });
  revalidatePath("/", "layout");
  go(back, { aviso: "resultado_guardado" });
}

// ---------- Evidencia y sello de verificado ----------

/**
 * Añade o cambia el enlace de evidencia (acta, cartel, publicación, vídeo) de un combate.
 * Mientras el combate está pendiente de confirmar lo pueden cambiar quien lo creó y sus participantes;
 * una vez confirmado o verificado, solo el organizador de la velada o un moderador.
 */
export async function setBoutEvidence(f: FormData) {
  const user = await requireVerifiedUser();
  const back = internalPath(str(f, "back"), "/mi-ficha");
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  if (!bout) go(back, { problema: "no_existe" });
  const staff = user.role === "ADMIN" || bout.event.organizerId === user.id;
  const mine = user.fighter?.id;
  const party = bout.createdById === user.id || (!!mine && (mine === bout.fighterAId || mine === bout.fighterBId));
  if (!staff && !party) go(back, { problema: "sin_permiso" });
  if (!staff && bout.verification !== "SELF_REPORTED") go(back, { problema: "evidencia_bloqueada" });
  if (str(f, "evidenceUrl").length > LIMITS.url) go(back, { problema: "texto_largo" });
  const raw = str(f, "evidenceUrl");
  const url = raw ? safeHttpUrl(raw) : null;
  if (raw && !url) go(back, { problema: "url_invalida" });
  await db.$transaction([
    db.bout.update({ where: { id: bout.id }, data: { evidenceUrl: url } }),
    audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "EVIDENCE_SET", before: { evidenceUrl: bout.evidenceUrl }, after: { evidenceUrl: url } }, db),
  ]);
  revalidatePath("/", "layout");
  go(back, { aviso: url ? "evidencia_guardada" : "evidencia_quitada" });
}

/** Un moderador concede o retira el sello de verificado a un gimnasio, anotando en qué evidencia se basa. */
export async function setGymVerified(f: FormData) {
  const admin = await requireAdmin();
  const back = "/moderacion";
  const gym = await db.gym.findUnique({ where: { id: str(f, "gymId") } });
  if (!gym) go(back, { problema: "no_existe" });
  const verify = str(f, "decision") === "verify";
  const note = str(f, "note").slice(0, LIMITS.note) || null;
  if (verify && !note) go(back, { problema: "sello_sin_nota" }); // el sello siempre lleva la evidencia que lo justifica
  await db.$transaction([
    db.gym.update({ where: { id: gym.id }, data: { verifiedAt: verify ? new Date() : null, verifiedNote: verify ? note : null } }),
    audit({ userId: admin.id, entity: "GYM", entityId: gym.id, action: verify ? "VERIFIED" : "VERIFICATION_REVOKED", before: { verifiedAt: gym.verifiedAt, note: gym.verifiedNote }, after: { note } }, db),
  ]);
  revalidatePath("/", "layout");
  go(back, { aviso: verify ? "sello_concedido" : "sello_retirado" });
}

// ---------- Avisos de error de los usuarios ----------

/** Cualquier usuario registrado puede avisar de un dato que cree incorrecto. Lo revisa un moderador. */
export async function createReport(f: FormData) {
  const user = await requireVerifiedUser();
  const back = internalPath(str(f, "back"));
  const entity = str(f, "entity");
  const entityId = str(f, "entityId");
  const reason = str(f, "reason");
  if (str(f, "message").length > LIMITS.message) go(back, { problema: "texto_largo" });
  if (!(REPORT_ENTITIES as readonly string[]).includes(entity) || !hasOwn(REPORT_REASONS, reason) || !REASONS_BY_ENTITY[entity as ReportEntity].includes(reason)) go(back, { problema: "reporte_datos" });
  const exists =
    entity === "BOUT" ? await db.bout.findUnique({ where: { id: entityId } })
    : entity === "FIGHTER" ? await db.fighter.findUnique({ where: { id: entityId } })
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

export async function resolveReport(f: FormData) {
  const admin = await requireAdmin();
  const back = "/moderacion";
  const report = await db.report.findUnique({ where: { id: str(f, "reportId") } });
  if (!report || report.status !== "OPEN") go(back, { problema: "no_existe" });
  const decision = str(f, "decision");
  const hide = decision === "hide"; // resolver actuando sobre el dato avisado: rechazar el combate, ocultar la ficha o retirar el comentario
  const status = decision === "dismiss" ? "DISMISSED" : "RESOLVED";
  const note = str(f, "note").slice(0, LIMITS.note) || null;
  await db.$transaction(async (tx) => {
    if (hide) {
      if (report.entity === "BOUT") await tx.bout.updateMany({ where: { id: report.entityId }, data: { verification: "DISPUTED" } });
      else if (report.entity === "FIGHTER") await anonymizeFighter(tx, report.entityId);
      else if (report.entity === "AURA") await tx.aura.updateMany({ where: { id: report.entityId }, data: { hiddenAt: new Date() } });
    }
    await tx.report.update({ where: { id: report.id }, data: { status, resolvedById: admin.id, resolvedAt: new Date(), resolutionNote: note } });
    await audit({ userId: admin.id, entity: "REPORT", entityId: report.id, action: hide ? "RESOLVED_AND_HIDDEN" : status, before: { status: report.status }, after: { status, note, target: `${report.entity}:${report.entityId}` } }, tx);
  });
  revalidatePath("/", "layout");
  go(back, { aviso: hide ? "aviso_resuelto_oculto" : status === "RESOLVED" ? "aviso_resuelto" : "aviso_descartado" });
}

// ---------- Seguir a peleadores ----------

export async function toggleFollow(f: FormData) {
  const back = internalPath(str(f, "back"));
  const user = await getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(back)}`);
  const fighter = await db.fighter.findFirst({ where: { id: str(f, "fighterId"), hiddenAt: null } });
  if (!fighter) go(back, { problema: "seguir_no_existe" });
  if (user.fighter?.id === fighter.id) go(back, { problema: "seguir_propio" });
  // Idempotente: dos pulsaciones seguidas no producen un error, y el resultado es siempre coherente.
  const removed = await db.follow.deleteMany({ where: { userId: user.id, fighterId: fighter.id } });
  if (removed.count === 0) await db.follow.createMany({ data: [{ userId: user.id, fighterId: fighter.id }], skipDuplicates: true });
  revalidatePath("/", "layout");
  go(back, { aviso: removed.count > 0 ? "siguiendo_quitado" : "siguiendo" });
}
