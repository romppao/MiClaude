/**
 * Buscar a quién retar o con quién hacer sparring (petición del fundador, 9 de octubre de 2026: «quiero pelear contra un contrincante que
 * sé que está en tal gimnasio pero no me sé su nombre […] o busco un sparring con un par de filtros: que tenga X peleas, que sea zurdo…»).
 *
 * Aquí solo están las reglas puras (leer los filtros de la dirección y ordenar); la pantalla `/propuestas` hace las consultas.
 */
import type { Discipline, Level, Stance } from "@prisma/client";

export type FiltrosRival = {
  texto?: string; gimnasio?: string; provincia?: string; disciplina?: Discipline; nivel?: Level; peso?: string; guardia?: Stance;
  minCombates?: number; maxCombates?: number; minEdad?: number; maxEdad?: number; orden: OrdenRival;
};

export const ORDENES_RIVAL = {
  parecido: "Más parecidos a ti",
  combates: "Más combates primero",
  experiencia: "Menos combates primero",
  aura: "Más aura primero",
  nombre: "Nombre (A-Z)",
} as const;
export type OrdenRival = keyof typeof ORDENES_RIVAL;

const DISCIPLINAS: Discipline[] = ["BOXEO", "JIUJITSU", "K1", "KICKBOXING", "MMA", "MUAYTHAI"];
const GUARDIAS: Stance[] = ["ORTODOXO", "ZURDO", "AMBIDIESTRO"];
const entero = (v: string | undefined, max: number) => (v && /^\d{1,3}$/.test(v.trim()) && Number(v) <= max ? Number(v) : undefined);
const corto = (v: string | undefined) => v?.trim().slice(0, 80) || undefined;

/**
 * Lee los filtros de la dirección. Sin disciplina en la dirección se usa la del propio peleador (`miDisciplina`); «todas» la quita.
 * Todo valor desconocido se ignora (no se confía en la dirección).
 */
export function parseFiltrosRival(p: Record<string, string | undefined>, miDisciplina?: Discipline): FiltrosRival {
  const d = p.disciplina === "todas" ? undefined : DISCIPLINAS.find((x) => x === p.disciplina) ?? (p.disciplina ? undefined : miDisciplina);
  const orden = (Object.keys(ORDENES_RIVAL) as OrdenRival[]).find((o) => o === p.orden) ?? "parecido";
  return {
    texto: corto(p.q), gimnasio: corto(p.gimnasio), provincia: corto(p.provincia), disciplina: d,
    nivel: p.nivel === "PRO" || p.nivel === "AMATEUR" ? p.nivel : undefined,
    peso: d && p.peso && /^[A-Z0-9+.\-]{1,12}$/.test(p.peso) ? p.peso : undefined,
    guardia: GUARDIAS.find((g) => g === p.guardia),
    minCombates: entero(p.mincomb, 999), maxCombates: entero(p.maxcomb, 999), minEdad: entero(p.minedad, 99), maxEdad: entero(p.maxedad, 99), orden,
  };
}

/** Lo que se compara de cada candidato. */
export type Candidato = { id: string; nombre: string; combates: number; aura: number; edad: number | null; peso: string | null };

/**
 * Filtra por combates y edad (lo que no se puede pedir directamente a la base de datos) y ordena. «Más parecidos a ti» prioriza la
 * misma categoría de peso, después la experiencia más cercana, luego la edad y el aura. Con edad pedida, quien no la indica queda fuera.
 */
export function filtrarYOrdenarRivales<T extends Candidato>(lista: T[], f: FiltrosRival, yo: Omit<Candidato, "id" | "nombre">): T[] {
  const quedan = lista.filter((c) =>
    (f.minCombates === undefined || c.combates >= f.minCombates) && (f.maxCombates === undefined || c.combates <= f.maxCombates) &&
    (f.minEdad === undefined || (c.edad !== null && c.edad >= f.minEdad)) && (f.maxEdad === undefined || (c.edad !== null && c.edad <= f.maxEdad)));
  const parecido = (c: Candidato) =>
    (yo.peso && c.peso === yo.peso ? 0 : 1) * 2 + Math.abs(c.combates - yo.combates) / (1 + Math.max(c.combates, yo.combates)) +
    (c.edad !== null && yo.edad !== null ? Math.min(1, Math.abs(c.edad - yo.edad) / 10) : 0.3) * 0.5 + (Math.abs(c.aura - yo.aura) / (1 + Math.max(c.aura, yo.aura))) * 0.3;
  const comparar: Record<OrdenRival, (a: T, b: T) => number> = {
    parecido: (a, b) => parecido(a) - parecido(b),
    combates: (a, b) => b.combates - a.combates,
    experiencia: (a, b) => a.combates - b.combates,
    aura: (a, b) => b.aura - a.aura,
    nombre: () => 0,
  };
  return [...quedan].sort((a, b) => comparar[f.orden](a, b) || a.nombre.localeCompare(b.nombre, "es") || a.id.localeCompare(b.id));
}

/** ¿Hay algún filtro puesto además de la disciplina por defecto? (para decir «sugerencias» o «resultados»). */
export const hayFiltrosRival = (f: FiltrosRival) => !!(f.texto || f.gimnasio || f.provincia || f.nivel || f.peso || f.guardia || f.minCombates !== undefined || f.maxCombates !== undefined || f.minEdad !== undefined || f.maxEdad !== undefined);
