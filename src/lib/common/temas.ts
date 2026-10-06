import type { Discipline, Level } from "@prisma/client";
import { DISCIPLINE_LABEL, PESOS, type PesosDe } from "./disciplines";
import { hasOwn } from "./safe";

/** Preferencia pública de deporte; `todos` conserva la vista general de la aplicación. */
export type ClaveDeporte = "todos" | "boxeo" | "mma" | "muaythai" | "kickboxing" | "k1" | "jiujitsu";

type VocabularioDeporte = {
  /** Nombre del periodo de combate que se muestra a las personas. */
  periodo: "asalto" | "ronda";
  graduacion: string;
  torneo: string;
};

export type TemaDeporte = {
  nombre: string;
  palabrasFondo: readonly [string, string];
  vocabulario: VocabularioDeporte;
  /** Categorías ya contrastadas en disciplines.ts; no duplica ni inventa pesos. */
  categorias: Record<Level, PesosDe> | null;
};

const PENDIENTE_ANTIGRAVITY = ["PENDIENTE DE", "ANTIGRAVITY"] as const;

/**
 * Textos y datos de ambiente por deporte. No contiene colores ni reglas de estilo:
 * el kit visual de T-016 decidirá cómo presentarlos.
 */
export const TEMAS_POR_DEPORTE: Record<ClaveDeporte, TemaDeporte> = {
  todos: {
    nombre: "Todos los deportes",
    palabrasFondo: ["RING", "ESPAÑA"],
    vocabulario: { periodo: "asalto", graduacion: "graduación", torneo: "torneo" },
    categorias: null,
  },
  boxeo: {
    nombre: DISCIPLINE_LABEL.BOXEO,
    palabrasFondo: ["BOXEO", "ESPAÑA"],
    vocabulario: { periodo: "asalto", graduacion: "categoría", torneo: "torneo" },
    categorias: PESOS.BOXEO,
  },
  mma: {
    nombre: DISCIPLINE_LABEL.MMA,
    palabrasFondo: ["ARTES", "MIXTAS"],
    vocabulario: { periodo: "ronda", graduacion: "cinturón", torneo: "torneo" },
    categorias: PESOS.MMA,
  },
  muaythai: {
    nombre: DISCIPLINE_LABEL.MUAYTHAI,
    palabrasFondo: ["NAK", "MUAY"],
    vocabulario: { periodo: "asalto", graduacion: "nivel", torneo: "torneo" },
    categorias: PESOS.MUAYTHAI,
  },
  kickboxing: {
    nombre: DISCIPLINE_LABEL.KICKBOXING,
    palabrasFondo: PENDIENTE_ANTIGRAVITY,
    vocabulario: { periodo: "ronda", graduacion: "nivel", torneo: "torneo" },
    categorias: PESOS.KICKBOXING,
  },
  k1: {
    nombre: DISCIPLINE_LABEL.K1,
    palabrasFondo: PENDIENTE_ANTIGRAVITY,
    vocabulario: { periodo: "ronda", graduacion: "nivel", torneo: "torneo" },
    categorias: PESOS.K1,
  },
  jiujitsu: {
    nombre: DISCIPLINE_LABEL.JIUJITSU,
    palabrasFondo: PENDIENTE_ANTIGRAVITY,
    vocabulario: { periodo: "ronda", graduacion: "cinturón", torneo: "torneo" },
    categorias: PESOS.JIUJITSU,
  },
};

const CLAVE_POR_DISCIPLINA: Record<Discipline, Exclude<ClaveDeporte, "todos">> = {
  BOXEO: "boxeo",
  MMA: "mma",
  MUAYTHAI: "muaythai",
  KICKBOXING: "kickboxing",
  K1: "k1",
  JIUJITSU: "jiujitsu",
};

export const claveDeDisciplina = (disciplina: Discipline): Exclude<ClaveDeporte, "todos"> => CLAVE_POR_DISCIPLINA[disciplina];

/** Nunca se usa `in`: una cookie no puede activar una clave heredada como `__proto__`. */
export function esClaveDeporte(valor: unknown): valor is ClaveDeporte {
  return typeof valor === "string" && hasOwn(TEMAS_POR_DEPORTE, valor);
}

/** Convierte una preferencia no fiable (cookie o formulario manipulado) en la vista general segura. */
export const claveDeporteSegura = (valor: unknown): ClaveDeporte => esClaveDeporte(valor) ? valor : "todos";
