import type { Prisma } from "@prisma/client";

/**
 * Provincias cuyos gimnasios no salen en Lona (decisión del fundador, 14 de octubre de 2026: «no quiero que salgan los de Cataluña,
 * es territorio de la competencia»). No aparecen en la lista, el mapa, la búsqueda, el sitemap ni su ficha, y no se dan de alta
 * gimnasios nuevos en ellas. Los peleadores y entrenadores de esas provincias sí pueden usar Lona: solo se queda sin gimnasio vinculado.
 * Para cambiar la decisión basta con editar esta lista (T-016, C5-02).
 */
export const PROVINCIAS_SIN_GIMNASIOS: readonly string[] = ["Barcelona", "Girona", "Lleida", "Tarragona"];

/** ¿Se pueden mostrar o crear gimnasios en esta provincia? */
const provinciaNormalizada = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/^provincia de /, "").trim();
export const provinciaConGimnasios = (provincia: string | null | undefined): boolean => {
  const name = provinciaNormalizada(provincia ?? "");
  return !PROVINCIAS_SIN_GIMNASIOS.some((p) => provinciaNormalizada(p) === name) && !["gerona", "lerida"].includes(name);
};

/** Filtro para cualquier consulta pública de gimnasios. */
export const gimnasiosVisibles = (): Prisma.GymWhereInput => ({ province: { notIn: [...PROVINCIAS_SIN_GIMNASIOS] } });
