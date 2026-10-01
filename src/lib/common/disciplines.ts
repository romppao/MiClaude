import type { Discipline, Method } from "@prisma/client";

/** Orden de presentación: el boxeo va siempre en cabeza. Para añadir una disciplina: enum en Prisma + entradas aquí. */
export const DISCIPLINE_ORDER: Discipline[] = ["BOXEO", "MMA", "KICKBOXING", "K1", "JIUJITSU"];

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  BOXEO: "Boxeo",
  MMA: "MMA",
  KICKBOXING: "Kickboxing",
  K1: "K-1",
  JIUJITSU: "Jiu-jitsu",
};

export const isDiscipline = (v: string): v is Discipline => (DISCIPLINE_ORDER as string[]).includes(v);

/**
 * Categorías de peso orientativas por disciplina (nombres habituales en español).
 * Están por validar con las federaciones de cada deporte; se pueden ajustar aquí sin tocar nada más.
 */
export const WEIGHT_CLASSES: Record<Discipline, string[]> = {
  BOXEO: ["Mosca", "Gallo", "Pluma", "Ligero", "Superligero", "Wélter", "Superwélter", "Medio", "Semipesado", "Crucero", "Pesado"],
  MMA: ["Mosca", "Gallo", "Pluma", "Ligero", "Wélter", "Medio", "Semipesado", "Pesado"],
  KICKBOXING: ["Mosca", "Gallo", "Pluma", "Ligero", "Wélter", "Medio", "Semipesado", "Pesado"],
  K1: ["Mosca", "Gallo", "Pluma", "Ligero", "Wélter", "Medio", "Semipesado", "Pesado"],
  JIUJITSU: ["Gallo", "Pluma", "Ligero", "Medio", "Medio-pesado", "Pesado", "Superpesado", "Ultrapesado", "Absoluto"],
};

/** Formas de terminar un combate según la disciplina. */
export const METHODS_BY_DISCIPLINE: Record<Discipline, Method[]> = {
  BOXEO: ["UD", "SD", "MD", "KO", "TKO", "RTD", "DQ", "DRAW"],
  KICKBOXING: ["UD", "SD", "MD", "KO", "TKO", "RTD", "DQ", "DRAW"],
  K1: ["UD", "SD", "MD", "KO", "TKO", "RTD", "DQ", "DRAW"],
  MMA: ["UD", "SD", "MD", "KO", "TKO", "SUBMISSION", "RTD", "DQ", "DRAW"],
  JIUJITSU: ["SUBMISSION", "POINTS", "ADVANTAGE", "DQ", "DRAW"],
};

/**
 * En jiu-jitsu (y otros torneos por eliminatoria) es normal competir varias veces el mismo día,
 * así que las comprobaciones de «demasiado seguidos» no se aplican.
 */
export const isTournamentStyle = (d: Discipline) => d === "JIUJITSU";

/** Interpreta el valor de un selector «DISCIPLINA:Categoría». Devuelve null si no es válido. */
export function parseDisciplineChoice(value: string): { discipline: Discipline; weightClass: string | null } | null {
  const [d, ...rest] = value.split(":");
  if (!isDiscipline(d)) return null;
  const wc = rest.join(":").trim();
  if (!wc) return { discipline: d, weightClass: null };
  return WEIGHT_CLASSES[d].includes(wc) ? { discipline: d, weightClass: wc } : null;
}
