"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Method, Result } from "@prisma/client";
import { db } from "../lib/db";
import { createSession, destroySession, getUser, hashPassword, requireUser, verifyPassword } from "../lib/auth";
import { slugify } from "../lib/labels";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

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
  const role = str(f, "role") === "BOXER" ? "BOXER" : "FAN";
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) redirect("/registro?error=datos");
  if (password.length < 8) redirect("/registro?error=password");
  if (await db.user.findUnique({ where: { email } })) redirect("/registro?error=email");
  const user = await db.user.create({ data: { email, name, role, passwordHash: hashPassword(password) } });
  await createSession(user.id);
  redirect(role === "BOXER" ? "/mi-ficha" : "/");
}

export async function login(f: FormData) {
  const user = await db.user.findUnique({ where: { email: str(f, "email").toLowerCase() } });
  if (!user || !verifyPassword(str(f, "password"), user.passwordHash)) redirect("/entrar?error=1");
  await createSession(user.id);
  redirect(user.role === "BOXER" ? "/mi-ficha" : "/");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// ---------- Ficha del boxeador (autogestionada) ----------

export async function createMyBoxer(f: FormData) {
  const user = await requireUser();
  if (user.boxer) redirect("/mi-ficha");
  const firstName = str(f, "firstName");
  const lastName = str(f, "lastName");
  if (!firstName || !lastName) redirect("/mi-ficha?error=nombre");
  const city = str(f, "city") || "Madrid";
  const province = str(f, "province") || "Madrid";
  const gymName = str(f, "gym");

  let gymId: string | undefined;
  if (gymName) {
    const gymSlug = slugify(gymName);
    const gym = (await db.gym.findUnique({ where: { slug: gymSlug } })) ?? (await db.gym.create({ data: { name: gymName, slug: gymSlug, city, province } }));
    gymId = gym.id;
  }
  const slug = await uniqueSlug(slugify(`${firstName} ${lastName}`), async (s) => !!(await db.boxer.findUnique({ where: { slug: s } })));
  await db.boxer.create({
    data: {
      slug, firstName, lastName, alias: str(f, "alias") || null, city, province,
      weightClass: str(f, "weightClass") || null, level: "AMATEUR", gymId, userId: user.id,
    },
  });
  redirect("/mi-ficha");
}

// ---------- Combates ----------

const OUTCOMES = { WIN: "A_WIN", LOSS: "B_WIN", DRAW: "DRAW" } as const;
const METHODS: Method[] = ["KO", "TKO", "UD", "SD", "MD", "RTD", "DQ", "DRAW"];

/** El boxeador registra un combate propio. Queda SELF_REPORTED hasta que el rival lo confirme o un admin lo verifique. */
export async function addBout(f: FormData) {
  const user = await requireUser();
  const me = user.boxer;
  if (!me) redirect("/mi-ficha");

  const eventName = str(f, "eventName");
  const date = new Date(`${str(f, "date")}T12:00:00Z`);
  const oppFirst = str(f, "oppFirst");
  const oppLast = str(f, "oppLast");
  if (!eventName || Number.isNaN(date.getTime()) || !oppFirst || !oppLast) redirect("/mi-ficha?error=combate");
  const past = date.getTime() <= Date.now();

  const outcome = str(f, "outcome") as keyof typeof OUTCOMES;
  const result: Result | null = past && outcome in OUTCOMES ? OUTCOMES[outcome] : null;
  const methodRaw = str(f, "method") as Method;
  const method = result && METHODS.includes(methodRaw) ? methodRaw : null;
  const roundsN = parseInt(str(f, "rounds"), 10);
  const rounds = roundsN > 0 && roundsN <= 12 ? roundsN : null;
  const city = str(f, "city") || "Madrid";
  const province = str(f, "province") || "Madrid";

  const eventSlug = slugify(`${eventName} ${date.toISOString().slice(0, 10)}`);
  const event =
    (await db.event.findUnique({ where: { slug: eventSlug } })) ??
    (await db.event.create({
      data: { slug: eventSlug, name: eventName, date, level: "AMATEUR", venue: str(f, "venue") || "Por confirmar", city, province, status: past ? "COMPLETED" : "SCHEDULED" },
    }));

  const oppSlug = slugify(`${oppFirst} ${oppLast}`);
  const opponent =
    (await db.boxer.findUnique({ where: { slug: oppSlug } })) ??
    (await db.boxer.create({ data: { slug: oppSlug, firstName: oppFirst, lastName: oppLast, level: "AMATEUR", city, province } }));
  if (opponent.id === me.id) redirect("/mi-ficha?error=combate");

  await db.bout.create({
    data: {
      eventId: event.id, boxerAId: me.id, boxerBId: opponent.id, result, method, rounds,
      weightClass: me.weightClass, verification: "SELF_REPORTED", createdById: user.id,
    },
  });
  revalidatePath("/", "layout");
  redirect("/mi-ficha");
}

/** El rival (si tiene cuenta) confirma o disputa un combate declarado por el otro boxeador. */
export async function respondBout(f: FormData) {
  const user = await requireUser();
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") } });
  const me = user.boxer;
  if (!bout || !me || bout.verification !== "SELF_REPORTED") redirect("/mi-ficha");
  if (bout.boxerBId !== me.id) redirect("/mi-ficha"); // solo el rival del creador
  await db.bout.update({ where: { id: bout.id }, data: { verification: str(f, "decision") === "confirm" ? "CONFIRMED" : "DISPUTED" } });
  revalidatePath("/", "layout");
  redirect("/mi-ficha");
}

/** Cola de moderación: solo administradores. */
export async function adminDecide(f: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  await db.bout.update({ where: { id: str(f, "boutId") }, data: { verification: str(f, "decision") === "verify" ? "VERIFIED" : "DISPUTED" } });
  revalidatePath("/", "layout");
  redirect("/admin");
}

// ---------- Valoraciones del público ----------

/**
 * Reglas anti-manipulación:
 *  - hace falta cuenta; una nota por usuario + combate + boxeador (se puede editar);
 *  - solo combates ya celebrados y no disputados;
 *  - los participantes del combate no pueden valorar;
 *  - la nota va ligada a un combate concreto, no al boxeador "en general".
 */
export async function rateBoxer(f: FormData) {
  const user = await getUser();
  const backRaw = str(f, "back");
  const back = backRaw.startsWith("/") && !backRaw.startsWith("//") ? backRaw : "/";
  if (!user) redirect("/entrar");
  const score = parseInt(str(f, "score"), 10);
  if (!(score >= 1 && score <= 5)) redirect(back);
  const bout = await db.bout.findUnique({ where: { id: str(f, "boutId") }, include: { event: true } });
  const boxerId = str(f, "boxerId");
  if (!bout || bout.verification === "DISPUTED" || bout.event.date.getTime() > Date.now()) redirect(back);
  if (boxerId !== bout.boxerAId && boxerId !== bout.boxerBId) redirect(back);
  if (user.boxer && (user.boxer.id === bout.boxerAId || user.boxer.id === bout.boxerBId)) redirect(back);

  const comment = str(f, "comment").slice(0, 500) || null;
  const attended = f.get("attended") === "on";
  await db.rating.upsert({
    where: { userId_boutId_boxerId: { userId: user.id, boutId: bout.id, boxerId } },
    create: { userId: user.id, boutId: bout.id, boxerId, score, comment, attended },
    update: { score, comment, attended },
  });
  revalidatePath("/", "layout");
  redirect(back);
}
