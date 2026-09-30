import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { normalizeName } from "./names";

type Client = Prisma.TransactionClient | typeof db;

/**
 * Peleadores cuya ficha coincide con un nombre (sin tildes, mayúsculas ni espacios de más).
 * Sirve para que quien registra un combate elija a su rival entre las personas que ya existen, en lugar de fusionar homónimos.
 * Vive fuera de los ficheros de acciones a propósito: una acción exportada sería un punto de entrada público.
 */
export async function findNameCandidates(first: string, last: string, client: Client = db) {
  const from = "áàäâéèëêíìïîóòöôúùüûñ";
  const to = "aaaaeeeeiiiioooouuuun";
  const rows = await client.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Fighter"
    WHERE "hiddenAt" IS NULL
      AND regexp_replace(translate(lower("firstName"), ${from}::text, ${to}::text), '\\s+', ' ', 'g') = ${normalizeName(first)}::text
      AND regexp_replace(translate(lower("lastName"), ${from}::text, ${to}::text), '\\s+', ' ', 'g') = ${normalizeName(last)}::text
    LIMIT 10`;
  if (rows.length === 0) return [];
  return client.fighter.findMany({ where: { id: { in: rows.map((r) => r.id) } }, include: { gym: true, disciplines: true } });
}

/** Búsqueda por nombre: cada palabra escrita debe aparecer en el nombre, los apellidos o el alias («Ana Ruiz» encuentra a Ana Ruiz aunque estén en campos distintos). */
export function nameSearchWhere(q: string): Prisma.FighterWhereInput {
  const words = q.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  if (words.length === 0) return {};
  return {
    AND: words.map((w) => ({
      OR: [{ firstName: { contains: w, mode: "insensitive" as const } }, { lastName: { contains: w, mode: "insensitive" as const } }, { alias: { contains: w, mode: "insensitive" as const } }],
    })),
  };
}
