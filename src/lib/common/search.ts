import { Prisma } from "@prisma/client";
import { db } from "./db";
import { normalizeName } from "./names";

/**
 * Búsqueda por texto sin distinguir mayúsculas ni tildes, donde cada palabra escrita debe aparecer en alguno de los campos
 * («Perez» encuentra a «Pérez»; «ana ruiz» encuentra nombre «Ana» y apellidos «Ruiz» aunque estén en campos distintos).
 * Devuelve los identificadores que coinciden, o null si no se ha escrito nada (sin restricción).
 * Los nombres de tabla y de campo salen de la lista fija de abajo, nunca del usuario; el texto buscado va siempre como parámetro.
 */
// Letras con tilde y su letra sin tilde, definidas por pares para que nunca puedan desalinearse (translate() de PostgreSQL las empareja por posición).
const ACCENT_PAIRS: [string, string][] = [["áàäâãå", "a"], ["éèëê", "e"], ["íìïî", "i"], ["óòöôõ", "o"], ["úùüû", "u"], ["ñ", "n"], ["ç", "c"]];
export const ACCENT_FROM = ACCENT_PAIRS.map(([letters]) => letters).join("");
export const ACCENT_TO = ACCENT_PAIRS.map(([letters, plain]) => plain.repeat([...letters].length)).join("");

const SOURCES = {
  fighter: { table: "Fighter", fields: ["firstName", "lastName", "alias"], where: Prisma.sql`"listed" = true AND "hiddenAt" IS NULL`, order: `"lastName", "firstName"` },
  fighterUnclaimed: { table: "Fighter", fields: ["firstName", "lastName", "alias"], where: Prisma.sql`"userId" IS NULL AND "hiddenAt" IS NULL`, order: `"lastName", "firstName"` },
  gym: { table: "Gym", fields: ["name", "city"], where: Prisma.sql`true`, order: `"name"` },
  trainer: { table: "Trainer", fields: ["name"], where: Prisma.sql`true`, order: `"name"` },
  event: { table: "Event", fields: ["name", "city", "venue"], where: Prisma.sql`true`, order: `"date" DESC` },
} as const;

export type SearchKind = keyof typeof SOURCES;
export const MAX_SEARCH_IDS = 1000;
const MAX_WORDS = 6;

/** Palabras de la búsqueda: sin tildes, en minúsculas, como mucho 6 y de 60 letras. */
export const searchWords = (q: string): string[] => normalizeName(q).split(" ").filter(Boolean).slice(0, MAX_WORDS).map((w) => w.slice(0, 60));

export async function searchIds(kind: SearchKind, q: string | undefined | null): Promise<string[] | null> {
  const words = searchWords(q ?? "");
  if (words.length === 0) return null;
  const src = SOURCES[kind];
  // La expresión es EXACTAMENTE la del índice `Fighter_nombre_trgm_idx` (migración 20261006160000_indices_listados): si se cambia aquí, hay que cambiarla allí.
  // Se usa `||` y `coalesce` (inmutables) y no `concat_ws` (estable), porque PostgreSQL solo admite expresiones inmutables en un índice.
  const haystack = Prisma.sql`translate(lower(${Prisma.join(src.fields.map((f) => Prisma.sql`coalesce(${Prisma.raw(`"${f}"`)}, '')`), " || ' ' || ")}), ${ACCENT_FROM}::text, ${ACCENT_TO}::text)`;
  // LIKE (y no strpos) para poder usar el índice de trigramas; los comodines que escriba la persona se escapan para que cuenten como letras.
  const conditions = Prisma.join(words.map((w) => Prisma.sql`${haystack} LIKE ${`%${w.replace(/[\%_]/g, "\$&")}%`}`), " AND ");
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM ${Prisma.raw(`"${src.table}"`)}
    WHERE ${src.where} AND ${conditions}
    ORDER BY ${Prisma.raw(src.order)}
    LIMIT ${MAX_SEARCH_IDS}`;
  return rows.map((r) => r.id);
}
