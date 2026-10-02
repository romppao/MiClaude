import type { Discipline, Level, Method } from "@prisma/client";

/** Orden de presentación: el boxeo va siempre en cabeza. Para añadir una disciplina: enum en Prisma (+ migración) y entradas aquí. */
export const DISCIPLINE_ORDER: Discipline[] = ["BOXEO", "MMA", "MUAYTHAI", "KICKBOXING", "K1", "JIUJITSU"];

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  BOXEO: "Boxeo",
  MMA: "MMA",
  MUAYTHAI: "Muay Thai",
  KICKBOXING: "Kickboxing",
  K1: "K-1",
  JIUJITSU: "Jiu-jitsu",
};

export const isDiscipline = (v: string): v is Discipline => (DISCIPLINE_ORDER as string[]).includes(v);

export const LEVEL_ORDER: Level[] = ["PRO", "AMATEUR"];
const LEVEL_NAME: Record<Level, string> = { PRO: "Profesional", AMATEUR: "Amateur" };
export const isLevel = (v: string): v is Level => (LEVEL_ORDER as string[]).includes(v);

/**
 * CATEGORÍAS DE PESO
 *
 * No son las mismas en cada disciplina ni entre profesional y amateur, así que cada pareja disciplina × nivel tiene su propia lista, con la fuente de donde sale.
 * `valor` es lo que se guarda en la base de datos (estable: no se cambia aunque cambie el texto); `etiqueta` es lo que lee la persona, con el peso en kilos
 * (la gente no tiene por qué saber qué es un «wélter»). Los pesos son orientativos: cada velada y cada federación pueden aplicar los suyos.
 *
 * REGLA: no se escribe ningún peso que no se haya podido comprobar. Si no hay fuente fiable, la lista queda vacía y `nota` lo dice con claridad
 * (en pantalla se ofrece «todavía no sé mi categoría»). Para completar una lista: añadir las entradas, la fuente en `nota` y anotarlo en `docs/DISENO-PESOS.md`.
 */
export type CategoriaPeso = { valor: string; etiqueta: string };
export type PesosDe = { categorias: CategoriaPeso[]; nota: string };

/** «Wélter · hasta 66,7 kg». */
const hasta = (valor: string, kg: string, nombre = valor): CategoriaPeso => ({ valor, etiqueta: `${nombre} · hasta ${kg} kg` });
const masDe = (valor: string, kg: string, nombre = valor): CategoriaPeso => ({ valor, etiqueta: `${nombre} · más de ${kg} kg` });

/** Boxeo profesional: las 17 categorías que reconocen WBC, WBA, IBF y WBO (límites de 105 a 200 libras). Mismas categorías para hombres y mujeres. */
const BOXEO_PRO: CategoriaPeso[] = [
  hasta("Minimosca", "47,6"), hasta("Mosca ligera", "49,0"), hasta("Mosca", "50,8"), hasta("Supermosca", "52,2"), hasta("Gallo", "53,5"),
  hasta("Supergallo", "55,3"), hasta("Pluma", "57,2"), hasta("Superpluma", "59,0"), hasta("Ligero", "61,2"), hasta("Superligero", "63,5"),
  hasta("Wélter", "66,7"), hasta("Superwélter", "69,9"), hasta("Medio", "72,6"), hasta("Supermedio", "76,2"), hasta("Semipesado", "79,4"),
  hasta("Crucero", "90,7"), masDe("Pesado", "90,7"),
];

/** Boxeo amateur en España: categorías de la Real Federación Española de Boxeo (RFEBoxeo), alineadas con World Boxing y European Boxing. Élite y Joven. Se indican por kilos y por sexo. */
const BOXEO_AMATEUR: CategoriaPeso[] = [
  { valor: "M47-50", etiqueta: "Masculino · de 47 a 50 kg" }, hasta("M55", "55", "Masculino"), hasta("M60", "60", "Masculino"), hasta("M65", "65", "Masculino"),
  hasta("M70", "70", "Masculino"), hasta("M75", "75", "Masculino"), hasta("M80", "80", "Masculino"), hasta("M85", "85", "Masculino"), hasta("M90", "90", "Masculino"), masDe("M+90", "90", "Masculino"),
  { valor: "F45-48", etiqueta: "Femenino · de 45 a 48 kg" }, hasta("F51", "51", "Femenino"), hasta("F54", "54", "Femenino"), hasta("F57", "57", "Femenino"), hasta("F60", "60", "Femenino"),
  hasta("F65", "65", "Femenino"), hasta("F70", "70", "Femenino"), hasta("F75", "75", "Femenino"), hasta("F80", "80", "Femenino"), masDe("F+80", "80", "Femenino"),
];

/** MMA: reglas unificadas (profesional) y las de la federación internacional amateur IMMAF coinciden en estas categorías de hombres. */
const MMA: CategoriaPeso[] = [
  hasta("Mosca", "56,7"), hasta("Gallo", "61,2"), hasta("Pluma", "65,8"), hasta("Ligero", "70,3"), hasta("Wélter", "77,1"),
  hasta("Medio", "83,9"), hasta("Semipesado", "93,0"), hasta("Pesado", "120,2"), masDe("Superpesado", "120,2"),
];

/** Muay Thai profesional: categorías del Consejo Mundial de Muay Thai (WMC), de 105 a 209 libras. */
const MUAYTHAI_PRO: CategoriaPeso[] = [
  hasta("Minimosca", "47,6"), hasta("Mosca ligera", "49,0"), hasta("Mosca", "50,8"), hasta("Supermosca", "52,2"), hasta("Gallo", "53,5"),
  hasta("Supergallo", "55,3"), hasta("Pluma", "57,2"), hasta("Superpluma", "59,0"), hasta("Ligero", "61,2"), hasta("Superligero", "63,5"),
  hasta("Wélter", "66,7"), hasta("Superwélter", "69,9"), hasta("Medio", "72,6"), hasta("Supermedio", "76,2"), hasta("Semipesado", "79,4"),
  hasta("Semipesado superior", "82,6"), hasta("Crucero", "86,2"), hasta("Pesado", "94,8"), masDe("Superpesado", "94,8"),
];

/** Kickboxing y K-1 amateur: categorías masculinas de ring de WAKO (hombres adultos, de 19 a 40 años). */
const WAKO_MASCULINO: CategoriaPeso[] = [
  hasta("M51", "51", "Masculino"), hasta("M54", "54", "Masculino"), hasta("M57", "57", "Masculino"), hasta("M60", "60", "Masculino"), hasta("M63.5", "63,5", "Masculino"),
  hasta("M67", "67", "Masculino"), hasta("M71", "71", "Masculino"), hasta("M75", "75", "Masculino"), hasta("M81", "81", "Masculino"), hasta("M86", "86", "Masculino"),
  hasta("M91", "91", "Masculino"), masDe("M+91", "91", "Masculino"),
];

/** Jiu-jitsu: categorías de adultos masculinos con kimono de la IBJJF. Son las mismas para todos los niveles (se dividen por edad, sexo y cinturón, no por profesional/amateur). */
const JIUJITSU: CategoriaPeso[] = [
  hasta("Gallo", "57,5"), hasta("Pluma", "64,0"), hasta("Pena", "70,0"), hasta("Ligero", "76,0"), hasta("Medio", "82,3"), hasta("Medio-pesado", "88,3"),
  hasta("Pesado", "94,3"), hasta("Superpesado", "100,5"), masDe("Ultrapesado", "100,5"), { valor: "Absoluto", etiqueta: "Absoluto · todos los pesos" },
];

const PENDIENTE = (que: string): PesosDe => ({ categorias: [], nota: `Todavía no tenemos confirmadas las categorías de ${que}. Elige «todavía no sé mi categoría»: podrás indicarla cuando estén.` });

export const PESOS: Record<Discipline, Record<Level, PesosDe>> = {
  BOXEO: {
    PRO: { categorias: BOXEO_PRO, nota: "Las 17 categorías del boxeo profesional (las que reconocen WBC, WBA, IBF y WBO). Son las mismas para hombres y mujeres." },
    AMATEUR: { categorias: BOXEO_AMATEUR, nota: "Categorías de la Federación Española de Boxeo para competiciones nacionales (élite y joven), alineadas con World Boxing. Las de cadete y júnior son distintas y están pendientes de añadir." },
  },
  MMA: {
    PRO: { categorias: MMA, nota: "Categorías de las reglas unificadas de MMA, en su versión masculina. Las categorías femeninas más ligeras están pendientes de confirmar." },
    AMATEUR: { categorias: MMA, nota: "Categorías de la federación internacional IMMAF, en su versión masculina. Las categorías femeninas más ligeras y las de edades juveniles están pendientes de confirmar." },
  },
  MUAYTHAI: {
    PRO: { categorias: MUAYTHAI_PRO, nota: "Categorías del Consejo Mundial de Muay Thai (WMC). Cada promotora puede usar otras." },
    AMATEUR: PENDIENTE("Muay Thai amateur"),
  },
  KICKBOXING: {
    PRO: PENDIENTE("kickboxing profesional (cada promotora usa las suyas)"),
    AMATEUR: { categorias: WAKO_MASCULINO, nota: "Categorías masculinas de ring de WAKO (adultos). Las femeninas y las de edades juveniles están pendientes de confirmar." },
  },
  K1: {
    PRO: PENDIENTE("K-1 profesional (cada promotora usa las suyas)"),
    AMATEUR: { categorias: WAKO_MASCULINO, nota: "Categorías masculinas de ring de WAKO (adultos). Las femeninas y las de edades juveniles están pendientes de confirmar." },
  },
  JIUJITSU: {
    PRO: { categorias: JIUJITSU, nota: "Categorías de adultos masculinos con kimono de la IBJJF. En jiu-jitsu no cambian entre profesional y amateur: se dividen por edad, sexo y cinturón." },
    AMATEUR: { categorias: JIUJITSU, nota: "Categorías de adultos masculinos con kimono de la IBJJF. En jiu-jitsu no cambian entre profesional y amateur: se dividen por edad, sexo y cinturón." },
  },
};

export const weightClassesFor = (discipline: Discipline, level: Level): CategoriaPeso[] => PESOS[discipline][level].categorias;
export const weightNote = (discipline: Discipline, level: Level): string => PESOS[discipline][level].nota;
export const isWeightClass = (discipline: Discipline, level: Level, valor: string): boolean => weightClassesFor(discipline, level).some((c) => c.valor === valor);

/**
 * Texto de una categoría guardada, con su peso en kilos. Si el valor ya no está en la lista (datos antiguos o una lista que cambió), se enseña tal cual:
 * nunca se esconde lo que alguien declaró.
 */
export function weightClassLabel(discipline: Discipline, level: Level, valor: string): string {
  return weightClassesFor(discipline, level).find((c) => c.valor === valor)?.etiqueta ?? valor;
}

/** «Profesional» / «Amateur». */
export const levelName = (level: Level): string => LEVEL_NAME[level];

/** Formas de terminar un combate según la disciplina. */
export const METHODS_BY_DISCIPLINE: Record<Discipline, Method[]> = {
  BOXEO: ["UD", "SD", "MD", "KO", "TKO", "RTD", "DQ", "DRAW"],
  MUAYTHAI: ["UD", "SD", "MD", "KO", "TKO", "RTD", "DQ", "DRAW"],
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

/**
 * Interpreta lo elegido en el formulario (disciplina, nivel y categoría; la categoría puede ir vacía = «todavía no sé»).
 * Devuelve null si algo no es válido o si la categoría no pertenece a esa disciplina y nivel.
 */
export function parseDisciplineChoice(discipline: string, level: string, weightClass: string): { discipline: Discipline; level: Level; weightClass: string | null } | null {
  if (!isDiscipline(discipline) || !isLevel(level)) return null;
  const wc = weightClass.trim();
  if (!wc) return { discipline, level, weightClass: null };
  return isWeightClass(discipline, level, wc) ? { discipline, level, weightClass: wc } : null;
}
