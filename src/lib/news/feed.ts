import type { Discipline } from "@prisma/client";
import { db } from "../common/db";
import { variar } from "./parse";

/** Noticias para la portada común y las de cada disciplina: recientes, de fuentes activas, sin las ocultadas por moderación, y variadas. */
export async function ultimasNoticias({ disciplina, max = 12 }: { disciplina?: Discipline; max?: number } = {}) {
  const filas = await db.newsItem.findMany({
    where: { hiddenAt: null, source: { active: true }, ...(disciplina && { disciplines: { has: disciplina } }) },
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    take: max * 4,
    include: { source: { select: { name: true, kind: true } } },
  });
  return variar(filas.map((n) => ({ ...n, clave: n.publisher ?? n.sourceId })), max);
}
export type Noticia = Awaited<ReturnType<typeof ultimasNoticias>>[number];
