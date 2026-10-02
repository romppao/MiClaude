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

/**
 * Límite superior de cada categoría, en kilos, para que nadie tenga que saber qué es un «wélter». Solo donde el estándar internacional es conocido
 * (boxeo profesional y MMA con las reglas unificadas); en kickboxing, K-1 y jiu-jitsu cada federación y cada velada fija los suyos y están por validar
 * con ellas, así que ahí no se afirma ningún peso. La categoría más alta no tiene límite. Los pesos son orientativos: una velada puede aplicar otros.
 */
const LIMITE_KG: Partial<Record<Discipline, Record<string, string>>> = {
  BOXEO: { Mosca: "50,8", Gallo: "53,5", Pluma: "57,2", Ligero: "61,2", Superligero: "63,5", "Wélter": "66,7", "Superwélter": "69,9", Medio: "72,6", Semipesado: "79,4", Crucero: "90,7" },
  MMA: { Mosca: "56,7", Gallo: "61,2", Pluma: "65,8", Ligero: "70,3", "Wélter": "77,1", Medio: "83,9", Semipesado: "93,0" },
};
/** Categoría más alta (sin límite) de las disciplinas con pesos conocidos, y el último límite que la precede. */
const SIN_LIMITE: Partial<Record<Discipline, { nombre: string; desde: string }>> = {
  BOXEO: { nombre: "Pesado", desde: "90,7" },
  MMA: { nombre: "Pesado", desde: "93,0" },
};

/** Nombre de la categoría con su peso en lenguaje llano: «Wélter · hasta 66,7 kg». Sin dato fiable, solo el nombre. */
export function weightClassLabel(discipline: Discipline, name: string): string {
  const limite = LIMITE_KG[discipline]?.[name];
  if (limite) return `${name} · hasta ${limite} kg`;
  const abierta = SIN_LIMITE[discipline];
  if (abierta && abierta.nombre === name) return `${name} · más de ${abierta.desde} kg`;
  return name;
}

/** ¿Hay pesos conocidos para esta disciplina? (para mostrar o no la nota que los explica) */
export const hasWeightLimits = (discipline: Discipline): boolean => discipline in LIMITE_KG;

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
