import { Prisma, type Discipline } from "@prisma/client";
import { db } from "../common/db";
import { ACCENT_FROM, ACCENT_TO, searchWords } from "../common/search";
import { availableFighters, availabilityCutoff } from "../fighters/availability";

export const SUGERENCIAS_CARTEL = 30;

/** Consulta acotada y parametrizada: todas las palabras deben estar en el nombre,
 * alias, gimnasio o ciudad. La disciplina se filtra en SQL antes del límite.
 * Sin búsqueda devuelve una lista corta por orden alfabético de la disciplina, para que
 * el desplegable nunca quede vacío. Pide un elemento de más para saber si hay que concretar.
 */
export async function buscarParaCartel(discipline: Discipline, query: string, disponibles = false, now = new Date()) {
  const words = searchWords(query);
  if (!words.length) return db.fighter.findMany({ where: { hiddenAt: null, ...(disponibles ? availableFighters(now) : {}), disciplines: { some: { discipline } } }, include: { gym: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }], take: SUGERENCIAS_CARTEL + 1 });
  const text = Prisma.sql`translate(lower(concat_ws(' ', f."firstName", f."lastName", f.alias, f.city, g.name)), ${ACCENT_FROM}::text, ${ACCENT_TO}::text)`;
  const conditions = Prisma.join(words.map(w => Prisma.sql`strpos(${text}, ${w}::text) > 0`), " AND ");
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT f.id FROM "Fighter" f LEFT JOIN "Gym" g ON g.id = f."gymId"
    WHERE f."hiddenAt" IS NULL AND EXISTS (SELECT 1 FROM "FighterDiscipline" d WHERE d."fighterId" = f.id AND d.discipline = ${discipline}::"Discipline")
    AND ${conditions} ${disponibles ? Prisma.sql`AND f."availableToFight" = true AND f."availableSince" > ${availabilityCutoff(now)}` : Prisma.empty}
    ORDER BY f."lastName", f."firstName", f.id LIMIT ${SUGERENCIAS_CARTEL + 1}`;
  return db.fighter.findMany({ where: { id: { in: rows.map(r => r.id) } }, include: { gym: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }] });
}
