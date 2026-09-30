"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Discipline, Method, Result } from "@prisma/client";
import { db } from "../lib/db";
import { consumeVerificationToken, createSession, destroySession, getUser, hashPassword, requireUser, requireVerifiedUser, sendVerificationEmail, verifyPassword } from "../lib/auth";
import { slugify } from "../lib/labels";
import { audit } from "../lib/audit";
import { safeHttpUrl } from "../lib/url";
import { proximityAppliesTo, proximityFlags, type Flag } from "../lib/coherence";
import { isTournamentStyle } from "../lib/disciplines";
import { notifyFollowersOfBout } from "../lib/notify";
import { DISCIPLINE_ORDER, METHODS_BY_DISCIPLINE, WEIGHT_CLASSES, isDiscipline, parseDisciplineChoice } from "../lib/disciplines";
import { parsePrior } from "../lib/prior";
import { MAX_REPORTS_PER_DAY, REPORT_ENTITIES, REPORT_REASONS } from "../lib/reports";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Redirige a `path` añadiendo un mensaje para el usuario (aviso de éxito o problema). */
function go(path: string, mensaje?: { aviso?: string; problema?: string }): never {
  if (!mensaje) redirect(path);
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  if (mensaje.aviso) params.set("aviso", mensaje.aviso);
  if (mensaje.problema) params.set("problema", mensaje.problema);
  redirect(`${base}?${params.toString()}`);
}

/** Solo permite volver a rutas internas (evita redirecciones abiertas). */
function internalPath(raw: string, fallback = "/") {
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

/** ¿Ya existe este mismo enfrentamiento (en cualquiera de las dos esquinas) en la velada? */
async function boutExists(eventId: string, a: string, b: string) {
  return !!(await db.bout.findFirst({
    where: { eventId, verification: { not: "DISPUTED" }, OR: [{ fighterAId: a, fighterBId: b }, { fighterAId: b, fighterBId: a }] },
  }));
}

/** Señales de coherencia de un combate nuevo respecto a los demás combates de sus dos peleadores. */
async function coherenceFlagsFor(eventId: string, eventDate: Date, discipline: Discipline, fighterIds: string[]): Promise<Flag[]> {
  if (!proximityAppliesTo(discipline)) return []; // torneos (jiu-jitsu): varios combates el mismo día son normales
  const others = await db.bout.findMany({
    where: { eventId: { not: eventId }, verification: { not: "DISPUTED" }, OR: [{ fighterAId: { in: fighterIds } }, { fighterBId: { in: fighterIds } }] },
    select: { event: { select: { date: true, discipline: true } } },
  });
  return proximityFlags(eventDate, others.filter((o) => !isTournamentStyle(o.event.discipline)).map((o) => o.event.date));
}

/** Se asegura de que el peleador tenga la disciplina en su ficha (sin tocar categoría ni récord si ya existe). */
async function ensureDiscipline(fighterId: string, discipline: Discipline) {
  await db.fighterDiscipline.upsert({ where: { fighterId_discipline: { fighterId, discipline } }, create: { fighterId, discipline }, update: {} });
}

async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  let slug = base || "sin-nombre";
  for (let i = 2; await exists(slug); i++) slug = `${base}-${i}`;
  return slug;
}

// ---------- Cuentas ----------

export async function register(f: FormData) {
  const email = str(f, "email").toLowerCase();
  const name = str(f, "name");
  const password = str(f, "password");
  const role = str(f, "role") === "FIGHTER" ? "FIGHTER" : "FAN";
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) redirect("/registro?error=datos");
  if (password.length < 8) redirect("/registro?error=password");
  if (await db.user.findUnique({ where: { email } })) redirect("/registro?error=email");
  const user = await db.user.create({ data: { email, name, role, passwordHash: hashPassword(password) } });
  await sendVerificationEmail(user);
  await createSession(user.id);
  redirect("/verificar");
}

export async function login(f: FormData) {
  const user = await db.user.findUnique({ where: { email: str(f, "email").toLowerCase() } });
  const next = internalPath(str(f, "next"), "");
  if (!user || !verifyPassword(str(f, "password"), user.passwordHash)) redirect(`/entrar?error=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  await createSession(user.id);
  redirect(next || (user.role === "FIGHTER" ? "/mi-ficha" : "/"));
}

export async function logout() {
  await destroySession();
  redirect("/");
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
  if (user.fighter) redirect("/mi-ficha");
  const firstName = str(f, "firstName");
  const lastName = str(f, "lastName");
  if (!firstName || !lastName) go("/mi-ficha", { problema: "nombre_ficha" });
  const { choice, prior } = readDisciplineForm(f);
  if (!choice) go("/mi-ficha", { problema: "disciplina_no_valida" });
  if (!prior.ok) go("/mi-ficha", { problema: prior.error });
  const city = str(f, "city") || "Madrid";
  const province = str(f, "province") || "Madrid";
  const gymName = str(f, "gym");

  let gymId: string | undefined;
  if (gymName) {
    const gymSlug = slugify(gymName);
    const gym = (await db.gym.findUnique({ where: { slug: gymSlug } })) ?? (await db.gym.create({ data: { name: gymName, slug: gymSlug, city, province } }));
    gymId = gym.id;
  }
  const slug = await uniqueSlug(slugify(`${firstName} ${lastName}`), async (s) => !!(await db.fighter.findUnique({ where: { slug: s } })));
  const created = await db.fighter.create({
    data: {
      slug, firstName, lastName, alias: str(f, "alias") || null, city, province, level: "AMATEUR", gymId, userId: user.id,
      disciplines: { create: { discipline: choice.discipline, weightClass: choice.weightClass, priorTotal: prior.prior.total, priorWins: prior.prior.wins, priorLosses: prior.prior.losses, priorDraws: prior.prior.draws } },
    },
  });
  await audit({ userId: user.id, entity: "FIGHTER", entityId: created.id, action: "CREATED", after: { discipline: choice.discipline, weightClass: choice.weightClass, priorDeclared: prior.prior } });
  go("/mi-ficha", { aviso: "ficha_creada" });
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
  await db.fighterDiscipline.upsert({
    where: { fighterId_discipline: { fighterId: me.id, discipline: choice.discipline } },
    create: { fighterId: me.id, discipline: choice.discipline, ...data }, update: data,
  });
  await audit({ userId: user.id, entity: "FIGHTER", entityId: me.id, action: before ? "DISCIPLINE_UPDATED" : "DISCIPLINE_ADDED", before: before ?? undefined, after: { discipline: choice.discipline, ...data } });
  revalidatePath("/", "layout");
  go("/mi-ficha", { aviso: "disciplina_guardada" });
}

// ---------- Combates ----------

const OUTCOMES = { WIN: "A_WIN", LOSS: "B_WIN", DRAW: "DRAW" } as const;

/** El peleador registra un combate propio. Queda SELF_REPORTED hasta que el rival lo confirme o un admin lo verifique. */
export async function addBout(f: FormData) {
  const user = await requireVerifiedUser();
  const me = user.fighter;
  if (!me) redirect("/mi-ficha");

  const eventName = str(f, "eventName");
  const date = new Date(`${str(f, "date")}T12:00:00Z`);
  const oppFirst = str(f, "oppFirst");
  const oppLast = str(f, "oppLast");
  if (!eventName || Number.isNaN(date.getTime()) || !oppFirst || !oppLast) go("/mi-ficha", { problema: "combate_datos" });
  const disciplineRaw = str(f, "discipline");
  const myDiscipline = isDiscipline(disciplineRaw) ? me.disciplines.find((d) => d.discipline === disciplineRaw) : undefined;
  if (!myDiscipline) go("/mi-ficha", { problema: "combate_sin_disciplina" });
  const discipline = myDiscipline.discipline;
  const past = date.getTime() <= Date.now();

  const outcome = str(f, "outcome") as keyof typeof OUTCOMES;
  const result: Result | null = past && outcome in OUTCOMES ? OUTCOMES[outcome] : null;
  const methodRaw = str(f, "method") as Method;
  if (result && methodRaw && !METHODS_BY_DISCIPLINE[discipline].includes(methodRaw)) go("/mi-ficha", { problema: "combate_metodo" });
  const method = result && METHODS_BY_DISCIPLINE[discipline].includes(methodRaw) ? methodRaw : null;
  const roundsN = parseInt(str(f, "rounds"), 10);
  const rounds = roundsN > 0 && roundsN <= 12 ? roundsN : null;
  const city = str(f, "city") || "Madrid";
  const province = str(f, "province") || "Madrid";

  const eventSlug = slugify(`${eventName} ${date.toISOString().slice(0, 10)}`);
  const existingEvent = await db.event.findUnique({ where: { slug: eventSlug } });
  if (existingEvent && existingEvent.discipline !== discipline) go("/mi-ficha", { problema: "combate_disciplina" });
  const event =
    existingEvent ??
    (await db.event.create({
      data: { slug: eventSlug, name: eventName, date, discipline, level: "AMATEUR", venue: str(f, "venue") || "Por confirmar", city, province, status: past ? "COMPLETED" : "SCHEDULED" },
    }));

  const oppSlug = slugify(`${oppFirst} ${oppLast}`);
  const opponent =
    (await db.fighter.findUnique({ where: { slug: oppSlug } })) ??
    (await db.fighter.create({ data: { slug: oppSlug, firstName: oppFirst, lastName: oppLast, level: "AMATEUR", city, province } }));
  if (opponent.id === me.id) go("/mi-ficha", { problema: "combate_mismo" });
  await ensureDiscipline(opponent.id, discipline);

  if (await boutExists(event.id, me.id, opponent.id)) go("/mi-ficha", { problema: "combate_duplicado" });
  const flags = await coherenceFlagsFor(event.id, event.date, discipline, [me.id, opponent.id]);
  const created = await db.bout.create({
    data: {
      flags, eventId: event.id, fighterAId: me.id, fighterBId: opponent.id, result, method, rounds,
      weightClass: myDiscipline.weightClass, verification: "SELF_REPORTED", createdById: user.id, evidenceUrl: safeHttpUrl(str(f, "evidenceUrl")),
    },
  });
  await audit({ userId: user.id, entity: "BOUT", entityId: created.id, action: "CREATED", after: { result, method, verification: "SELF_REPORTED", evidenceUrl: created.evidenceUrl, flags } });
  revalidatePath("/", "layout");
  go("/mi-ficha", { aviso: "combate_registrado" });
}

/** El rival (si tiene cuenta) confirma o disputa un combate declarado por el otro peleador. */
export async function respondBout(f: FormData) {
  const user = await requireVerifiedUser();
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") } });
  const me = user.fighter;
  if (!bout || !me || bout.verification !== "SELF_REPORTED") redirect("/mi-ficha");
  if (bout.fighterBId !== me.id) redirect("/mi-ficha"); // solo el rival del creador
  const next = str(f, "decision") === "confirm" ? "CONFIRMED" : "DISPUTED";
  await db.$transaction([
    db.bout.update({ where: { id: bout.id }, data: { verification: next } }),
    audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: `RIVAL_${next}`, before: { verification: bout.verification }, after: { verification: next } }, db),
  ]);
  revalidatePath("/", "layout");
  go("/mi-ficha", { aviso: next === "CONFIRMED" ? "combate_confirmado" : "combate_rechazado" });
}

/** Cola de moderación: solo administradores. */
export async function adminDecide(f: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  const before = await db.bout.findUnique({ where: { id: str(f, "boutId") } });
  if (!before) redirect("/admin");
  const next = str(f, "decision") === "verify" ? "VERIFIED" : "DISPUTED";
  await db.bout.update({ where: { id: before.id }, data: { verification: next } });
  await audit({ userId: user.id, entity: "BOUT", entityId: before.id, action: `ADMIN_${next}`, before: { verification: before.verification }, after: { verification: next } });
  revalidatePath("/", "layout");
  redirect("/admin");
}

// ---------- Aura del público ----------

/**
 * Dar aura a un peleador por su actuación en un combate. Reglas anti-manipulación:
 *  - hace falta cuenta con el correo verificado;
 *  - una aura por persona, combate y peleador (volver a pulsar solo actualiza el comentario);
 *  - solo combates ya celebrados y no disputados;
 *  - los participantes del combate no pueden dar aura;
 *  - máximo 20 auras nuevas o editadas al día por persona.
 */
export async function giveAura(f: FormData) {
  const user = await getUser();
  const back = internalPath(str(f, "back"));
  if (!user) redirect(`/entrar?next=${encodeURIComponent(back)}`);
  if (!user.emailVerifiedAt) redirect("/verificar");
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  const fighterId = str(f, "fighterId");
  if (!bout || (fighterId !== bout.fighterAId && fighterId !== bout.fighterBId)) go(back, { problema: "aura_no_existe" });
  if (bout.verification === "DISPUTED") go(back, { problema: "aura_revision" });
  if (bout.event.date.getTime() > Date.now()) go(back, { problema: "aura_futuro" });
  if (user.fighter && (user.fighter.id === bout.fighterAId || user.fighter.id === bout.fighterBId)) go(back, { problema: "aura_propio" });

  const recent = await db.aura.count({ where: { userId: user.id, updatedAt: { gte: new Date(Date.now() - 864e5) } } });
  if (recent >= 20) go(back, { problema: "aura_limite" });

  const comment = str(f, "comment").slice(0, 500) || null;
  const attended = f.get("attended") === "on";
  await db.aura.upsert({
    where: { userId_boutId_fighterId: { userId: user.id, boutId: bout.id, fighterId } },
    create: { userId: user.id, boutId: bout.id, fighterId, comment, attended },
    update: { comment, attended },
  });
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

// ---------- Verificación de email ----------

export async function verifyEmail(f: FormData) {
  const ok = await consumeVerificationToken(str(f, "token"));
  redirect(ok ? "/verificar?ok=1" : "/verificar?error=token");
}

export async function resendVerification() {
  const user = await requireUser();
  if (!user.emailVerifiedAt) await sendVerificationEmail(user);
  redirect("/verificar?sent=1");
}

// ---------- Reclamar una ficha existente ----------

export async function requestClaim(f: FormData) {
  const user = await requireVerifiedUser();
  if (user.fighter) redirect("/mi-ficha");
  const fighter = await db.fighter.findUnique({ where: { id: str(f, "fighterId") } });
  if (!fighter || fighter.userId) redirect("/mi-ficha?error=reclamar");
  await db.claimRequest.upsert({
    where: { userId_fighterId: { userId: user.id, fighterId: fighter.id } },
    create: { userId: user.id, fighterId: fighter.id, message: str(f, "message").slice(0, 500) || null },
    update: { message: str(f, "message").slice(0, 500) || null, status: "PENDING" },
  });
  redirect("/mi-ficha?ok=reclamacion");
}

export async function decideClaim(f: FormData) {
  const admin = await requireUser();
  if (admin.role !== "ADMIN") redirect("/");
  const claim = await db.claimRequest.findUnique({ where: { id: str(f, "claimId") }, include: { fighter: true, user: { include: { fighter: true } } } });
  if (!claim || claim.status !== "PENDING") redirect("/admin");
  // Solo se aprueba si se pidió aprobar Y la ficha sigue libre Y el usuario no tiene ya otra ficha.
  const approved = str(f, "decision") === "approve" && !claim.fighter.userId && !claim.user.fighter;
  if (approved) {
    await db.$transaction([
      db.fighter.update({ where: { id: claim.fighterId }, data: { userId: claim.userId } }),
      db.claimRequest.update({ where: { id: claim.id }, data: { status: "APPROVED" } }),
      db.claimRequest.updateMany({ where: { fighterId: claim.fighterId, id: { not: claim.id }, status: "PENDING" }, data: { status: "REJECTED" } }),
    ]);
  } else {
    await db.claimRequest.update({ where: { id: claim.id }, data: { status: "REJECTED" } });
  }
  await audit({
    userId: admin.id, entity: "CLAIM", entityId: claim.id, action: approved ? "APPROVED" : "REJECTED",
    after: { userId: claim.userId, fighterId: claim.fighterId, requestedApproval: str(f, "decision") === "approve" },
  });
  redirect("/admin");
}

// ---------- Organizadores ----------

export async function requestOrganizer(f: FormData) {
  const user = await requireVerifiedUser();
  const orgName = str(f, "orgName");
  if (!orgName) redirect("/organizador?error=nombre");
  await db.organizerRequest.upsert({
    where: { userId: user.id },
    create: { userId: user.id, orgName, message: str(f, "message").slice(0, 500) || null },
    update: { orgName, message: str(f, "message").slice(0, 500) || null, status: "PENDING" },
  });
  redirect("/organizador?ok=solicitud");
}

export async function decideOrganizer(f: FormData) {
  const admin = await requireUser();
  if (admin.role !== "ADMIN") redirect("/");
  const req = await db.organizerRequest.findUnique({ where: { id: str(f, "requestId") }, include: { user: true } });
  if (!req || req.status !== "PENDING") redirect("/admin");
  const approve = str(f, "decision") === "approve";
  await audit({ userId: admin.id, entity: "ORGANIZER", entityId: req.id, action: approve ? "APPROVED" : "REJECTED", after: { userId: req.userId, orgName: req.orgName, note: str(f, "note") || null } });
  await db.$transaction([
    db.organizerRequest.update({ where: { id: req.id }, data: { status: approve ? "APPROVED" : "REJECTED", reviewNote: str(f, "note").slice(0, 500) || null, reviewedAt: new Date() } }),
    ...(approve && req.user.role === "FAN" ? [db.user.update({ where: { id: req.userId }, data: { role: "ORGANIZER" } })] : []),
  ]);
  redirect("/admin");
}

async function requireOrganizer() {
  const user = await requireVerifiedUser();
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/organizador");
  return user;
}

async function ownEvent(eventId: string, user: { id: string; role: string }) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || (event.organizerId !== user.id && user.role !== "ADMIN")) redirect("/organizador");
  return event;
}

export async function createEvent(f: FormData) {
  const user = await requireOrganizer();
  const name = str(f, "name");
  const date = new Date(`${str(f, "date")}T12:00:00Z`);
  if (!name || Number.isNaN(date.getTime())) redirect("/organizador?error=velada");
  const level = str(f, "level") === "PRO" ? "PRO" : "AMATEUR";
  const disciplineRaw = str(f, "discipline");
  const discipline: Discipline = isDiscipline(disciplineRaw) ? disciplineRaw : "BOXEO";
  const slug = await uniqueSlug(slugify(`${name} ${date.toISOString().slice(0, 10)}`), async (s) => !!(await db.event.findUnique({ where: { slug: s } })));
  const created = await db.event.create({
    data: {
      slug, name, date, discipline, level, venue: str(f, "venue") || "Por confirmar", city: str(f, "city") || "Madrid", province: str(f, "province") || "Madrid",
      promoter: str(f, "promoter") || null, ticketUrl: /^https?:\/\//.test(str(f, "ticketUrl")) ? str(f, "ticketUrl") : null, organizerId: user.id,
    },
  });
  await audit({ userId: user.id, entity: "EVENT", entityId: created.id, action: "CREATED", after: { name, date, level, discipline } });
  revalidatePath("/", "layout");
  go(`/organizador/${slug}`, { aviso: "velada_creada" });
}

/** Añade un combate al cartel. Lo introduce el organizador del evento, así que nace VERIFIED. */
export async function addCartelBout(f: FormData) {
  const user = await requireOrganizer();
  const event = await ownEvent(str(f, "eventId"), user);
  const [a, b] = await Promise.all([
    db.fighter.findUnique({ where: { slug: str(f, "fighterA") } }),
    db.fighter.findUnique({ where: { slug: str(f, "fighterB") } }),
  ]);
  if (!a || !b || a.id === b.id) redirect(`/organizador/${event.slug}?error=cartel`);
  const rounds = parseInt(str(f, "rounds"), 10);
  if (await boutExists(event.id, a.id, b.id)) go(`/organizador/${event.slug}`, { problema: "cartel_duplicado" });
  const weightClassRaw = str(f, "weightClass");
  if (weightClassRaw && !WEIGHT_CLASSES[event.discipline].includes(weightClassRaw)) go(`/organizador/${event.slug}`, { problema: "cartel_categoria" });
  await Promise.all([ensureDiscipline(a.id, event.discipline), ensureDiscipline(b.id, event.discipline)]);
  const flags = await coherenceFlagsFor(event.id, event.date, event.discipline, [a.id, b.id]);
  const order = await db.bout.count({ where: { eventId: event.id } });
  const created = await db.bout.create({
    data: { flags, eventId: event.id, fighterAId: a.id, fighterBId: b.id, order: order + 1, weightClass: weightClassRaw || null, rounds: rounds > 0 && rounds <= 12 ? rounds : null, verification: "VERIFIED", createdById: user.id, evidenceUrl: safeHttpUrl(str(f, "evidenceUrl")) },
  });
  await audit({ userId: user.id, entity: "BOUT", entityId: created.id, action: "CREATED_BY_ORGANIZER", after: { eventId: event.id, fighterA: a.slug, fighterB: b.slug, evidenceUrl: created.evidenceUrl } });
  revalidatePath("/", "layout");
  await notifyFollowersOfBout(created.id); // solo combates de organizador y futuros
  go(`/organizador/${event.slug}`, { aviso: "cartel_anadido" });
}

export async function setBoutResult(f: FormData) {
  const user = await requireOrganizer();
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  if (!bout) redirect("/organizador");
  const event = await ownEvent(bout.eventId, user);
  if (event.date.getTime() > Date.now()) redirect(`/organizador/${event.slug}?error=futuro`);
  const outcome = str(f, "outcome") as keyof typeof OUTCOMES;
  if (!(outcome in OUTCOMES)) redirect(`/organizador/${event.slug}`);
  const methodRaw = str(f, "method") as Method;
  const method = METHODS_BY_DISCIPLINE[event.discipline].includes(methodRaw) ? methodRaw : null;
  const endRound = parseInt(str(f, "endRound"), 10);
  await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "RESULT_SET", before: { result: bout.result, method: bout.method, endRound: bout.endRound }, after: { result: OUTCOMES[outcome], method, endRound: endRound > 0 ? endRound : null } });
  await db.$transaction([
    db.bout.update({ where: { id: bout.id }, data: { result: OUTCOMES[outcome], method, endRound: endRound > 0 ? endRound : null, verification: "VERIFIED" } }),
    db.event.update({ where: { id: event.id }, data: { status: "COMPLETED" } }),
  ]);
  revalidatePath("/", "layout");
  go(`/organizador/${event.slug}`, { aviso: "resultado_guardado" });
}

// ---------- Evidencia y sello de verificado ----------

/** Añade o cambia el enlace de evidencia (acta, cartel, publicación, vídeo) de un combate. */
export async function setBoutEvidence(f: FormData) {
  const user = await requireVerifiedUser();
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  const back = internalPath(str(f, "back"), "/mi-ficha");
  if (!bout) redirect(back);
  const mine = user.fighter?.id;
  const allowed = user.role === "ADMIN" || bout.createdById === user.id || bout.event.organizerId === user.id || (!!mine && (mine === bout.fighterAId || mine === bout.fighterBId));
  if (!allowed) go(back, { problema: "sin_permiso" });
  const raw = str(f, "evidenceUrl");
  const url = raw ? safeHttpUrl(raw) : null;
  if (raw && !url) go(back, { problema: "url_invalida" });
  await db.bout.update({ where: { id: bout.id }, data: { evidenceUrl: url } });
  await audit({ userId: user.id, entity: "BOUT", entityId: bout.id, action: "EVIDENCE_SET", before: { evidenceUrl: bout.evidenceUrl }, after: { evidenceUrl: url } });
  revalidatePath("/", "layout");
  go(back, { aviso: url ? "evidencia_guardada" : "evidencia_quitada" });
}

/** Un moderador concede o retira el sello de verificado a un gimnasio, anotando en qué evidencia se basa. */
export async function setGymVerified(f: FormData) {
  const admin = await requireUser();
  if (admin.role !== "ADMIN") redirect("/");
  const gym = await db.gym.findUnique({ where: { id: str(f, "gymId") } });
  if (!gym) redirect("/admin");
  const verify = str(f, "decision") === "verify";
  const note = str(f, "note").slice(0, 500) || null;
  if (verify && !note) redirect("/admin?error=nota"); // el sello siempre lleva la evidencia que lo justifica
  await db.gym.update({ where: { id: gym.id }, data: { verifiedAt: verify ? new Date() : null, verifiedNote: verify ? note : null } });
  await audit({ userId: admin.id, entity: "GYM", entityId: gym.id, action: verify ? "VERIFIED" : "VERIFICATION_REVOKED", before: { verifiedAt: gym.verifiedAt, note: gym.verifiedNote }, after: { note } });
  revalidatePath("/", "layout");
  redirect("/admin");
}

// ---------- Avisos de error de los usuarios ----------

/** Cualquier usuario registrado puede avisar de un dato que cree incorrecto. Lo revisa un moderador. */
export async function createReport(f: FormData) {
  const user = await requireVerifiedUser();
  const back = internalPath(str(f, "back"));
  const entity = str(f, "entity");
  const entityId = str(f, "entityId");
  const reason = str(f, "reason");
  if (!(REPORT_ENTITIES as readonly string[]).includes(entity) || !(reason in REPORT_REASONS)) go(back, { problema: "reporte_datos" });
  const exists = entity === "BOUT" ? await db.bout.findUnique({ where: { id: entityId } }) : await db.fighter.findUnique({ where: { id: entityId } });
  if (!exists) go(back, { problema: "reporte_datos" });
  if (await db.report.findFirst({ where: { userId: user.id, entity, entityId, status: "OPEN" } })) go(back, { problema: "reporte_repetido" });
  const today = await db.report.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 864e5) } } });
  if (today >= MAX_REPORTS_PER_DAY) go(back, { problema: "reporte_limite" });
  const report = await db.report.create({ data: { userId: user.id, entity, entityId, reason, message: str(f, "message").slice(0, 500) || null } });
  await audit({ userId: user.id, entity: "REPORT", entityId: report.id, action: "CREATED", after: { entity, entityId, reason } });
  go(back, { aviso: "reporte_enviado" });
}

export async function resolveReport(f: FormData) {
  const admin = await requireUser();
  if (admin.role !== "ADMIN") redirect("/");
  const report = await db.report.findUnique({ where: { id: str(f, "reportId") } });
  if (!report || report.status !== "OPEN") redirect("/admin");
  const status = str(f, "decision") === "resolve" ? "RESOLVED" : "DISMISSED";
  const note = str(f, "note").slice(0, 500) || null;
  await db.report.update({ where: { id: report.id }, data: { status, resolvedById: admin.id, resolvedAt: new Date(), resolutionNote: note } });
  await audit({ userId: admin.id, entity: "REPORT", entityId: report.id, action: status, before: { status: report.status }, after: { status, note } });
  redirect("/admin");
}

// ---------- Seguir a peleadores ----------

export async function toggleFollow(f: FormData) {
  const back = internalPath(str(f, "back"));
  const user = await getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(back)}`);
  const fighter = await db.fighter.findUnique({ where: { id: str(f, "fighterId") } });
  if (!fighter) go(back, { problema: "seguir_no_existe" });
  if (user.fighter?.id === fighter.id) go(back, { problema: "seguir_propio" });
  const key = { userId_fighterId: { userId: user.id, fighterId: fighter.id } };
  const existing = await db.follow.findUnique({ where: key });
  if (existing) await db.follow.delete({ where: key });
  else await db.follow.create({ data: { userId: user.id, fighterId: fighter.id } });
  revalidatePath("/", "layout");
  go(back, { aviso: existing ? "siguiendo_quitado" : "siguiendo" });
}
