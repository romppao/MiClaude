// Ayudantes comunes de las acciones del servidor. Este fichero NO lleva "use server": lo que se exporta aquí no es un punto de entrada público.
// Las guardas de permisos («quién puede hacer qué») no están aquí sino en lib/accounts/permissions.ts, porque las usan también las pantallas.

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { Discipline } from "@prisma/client";
import { db } from "../../lib/common/db";
import { PROVINCES } from "../../lib/common/labels";
import { proximityAppliesTo, proximityFlags, type Flag } from "../../lib/fighters/coherence";
import { isTournamentStyle } from "../../lib/common/disciplines";

export const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export const intOrNull = (f: FormData, k: string) => {
  const s = str(f, k);
  return /^\d{1,3}$/.test(s) ? parseInt(s, 10) : null;
};

/** Redirige a `path` añadiendo un mensaje para el usuario (aviso de éxito o problema). */
export function go(path: string, mensaje?: { aviso?: string; problema?: string }): never {
  if (!mensaje) redirect(path);
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  if (mensaje.aviso) params.set("aviso", mensaje.aviso);
  if (mensaje.problema) params.set("problema", mensaje.problema);
  redirect(`${base}?${params.toString()}`);
}

/** Un rechazo previsto dentro de una transacción: lleva el código del mensaje que se enseñará al usuario. */
export class Rechazo extends Error {
  constructor(public problema: string) {
    super(problema);
  }
}

/**
 * Ejecuta `fn` traduciendo a mensajes claros los fallos previstos: un rechazo controlado, una restricción única
 * (doble envío o carrera entre dos peticiones) o un registro que ya no existe. Cualquier otro error se propaga.
 */
export async function guard<T>(back: string, fn: () => Promise<T>, unique = "duplicado"): Promise<T> {
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
export async function withLock<T>(key: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    return fn(tx);
  });
}

/** Comprueba que ningún texto supere su longitud máxima; si alguno la supera, avisa y no guarda nada. */
export function checkLengths(f: FormData, back: string, fields: Record<string, number>) {
  for (const [k, max] of Object.entries(fields)) if (str(f, k).length > max) go(back, { problema: "texto_largo" });
}

/** Provincia elegida en un formulario: debe estar en la lista; si viene vacía se usa `fallback` (si es válido). */
export function readProvince(f: FormData, key: string, back: string, fallback?: string | null): string {
  const v = str(f, key) || fallback || "";
  if (!PROVINCES.includes(v)) go(back, { problema: "provincia_no_valida" });
  return v;
}

export type Client = Prisma.TransactionClient | typeof db;

/** Señales de coherencia de un combate nuevo respecto a los demás combates de sus dos peleadores (incluidos los de la misma velada). */
export async function coherenceFlagsFor(client: Client, eventDate: Date, discipline: Discipline, fighterIds: string[]): Promise<Flag[]> {
  if (!proximityAppliesTo(discipline)) return []; // torneos (jiu-jitsu): varios combates el mismo día son normales
  const others = await client.bout.findMany({
    where: { verification: { not: "DISPUTED" }, OR: [{ fighterAId: { in: fighterIds } }, { fighterBId: { in: fighterIds } }] },
    select: { event: { select: { date: true, discipline: true } } },
  });
  return proximityFlags(eventDate, others.filter((o) => !isTournamentStyle(o.event.discipline)).map((o) => o.event.date));
}

/** Se asegura de que el peleador tenga la disciplina en su ficha (sin tocar categoría ni récord si ya existe). */
export async function ensureDiscipline(client: Client, fighterId: string, discipline: Discipline) {
  await client.fighterDiscipline.upsert({ where: { fighterId_discipline: { fighterId, discipline } }, create: { fighterId, discipline }, update: {} });
}

export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>, fallback = "sin-nombre") {
  const root = base || fallback;
  let slug = root;
  for (let i = 2; await exists(slug); i++) slug = `${root}-${i}`;
  return slug;
}

export async function ownEvent(eventId: string, user: { id: string; role: string }) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) go("/organizador", { problema: "no_existe" });
  if (event.organizerId !== user.id && user.role !== "ADMIN") go("/organizador", { problema: "sin_permiso" });
  return event;
}
