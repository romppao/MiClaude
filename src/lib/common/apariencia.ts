import type { Discipline } from "@prisma/client";

/**
 * Apariencia del diseño v3 que depende de los datos (no de la pantalla): el color de cada disciplina y las iniciales que sustituyen a una foto.
 * Los colores salen de la entrega de Claude Design (docs/DISENO.md, «Diseño v3»).
 */
export const COLOR_DISCIPLINA: Record<Discipline, string> = {
  BOXEO: "#D4F67C", JIUJITSU: "#86C8FF", K1: "#FFA552", KICKBOXING: "#FFE066", MMA: "#FF6B5B", MUAYTHAI: "#FF8AD0",
};

/** «#D4F67C» con transparencia → «rgba(212,246,124,.38)». */
export function conAlfa(hex: string, alfa: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa})`;
}

/** Tinte de fondo de una tarjeta o portada según la disciplina (el lima si no se sabe). */
export const tinteDe = (d: Discipline | null | undefined) => conAlfa(d ? COLOR_DISCIPLINA[d] : "#D4F67C", 0.38);

/** Hasta dos iniciales de un nombre: «Álvaro Ruiz» → «ÁR». */
export const iniciales = (nombre: string) => nombre.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "·";

/** Nombre de pila: «Laura Pérez» → «Laura». */
export const nombreDePila = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? nombre;
