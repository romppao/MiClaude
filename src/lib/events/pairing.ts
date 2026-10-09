/**
 * Ayuda para emparejar a los peleadores aceptados (decisión del fundador, 9 de octubre de 2026: «en cuanto a los emparejamientos, que no
 * es automático, claro. Siempre con ayuda […] que se vea el nivel o el nivel de popularidad de la aplicación, el número de combates…»).
 *
 * Nunca empareja sola: compara a cada peleador con los demás aceptados de su misma categoría y ordena los posibles rivales de más a menos
 * parecidos, explicando en qué se parecen y en qué no. Quien decide y añade el combate al cartel es el organizador.
 */

/** Lo que se compara de cada peleador. */
export type DatosPareja = { id: string; combates: number; victorias: number; derrotas: number; empates: number; aura: number; weightKg: number | null; edad: number | null };

export type Parecido = "muy" | "bastante" | "poco";
export const PARECIDO_LABEL: Record<Parecido, string> = { muy: "Muy igualados", bastante: "Igualados", poco: "Con diferencias" };

/** Porcentaje de victorias (0 a 1) sobre los combates con resultado, o null si no tiene ninguno. */
export const porcentajeVictorias = (d: DatosPareja) => {
  const n = d.victorias + d.derrotas + d.empates;
  return n ? d.victorias / n : null;
};

/** Diferencia relativa entre dos números no negativos, de 0 (iguales) a 1. */
const relativa = (a: number, b: number) => Math.abs(a - b) / (1 + Math.max(a, b));

/**
 * Distancia entre dos peleadores, de 0 (idénticos) a 1. Pesa sobre todo la experiencia (combates), después el peso y el porcentaje de
 * victorias, y menos el aura (popularidad) y la edad. Un dato que falta (peso o edad sin indicar) cuenta como diferencia media.
 */
export function distancia(a: DatosPareja, b: DatosPareja): number {
  const pa = porcentajeVictorias(a), pb = porcentajeVictorias(b);
  const dVict = pa === null && pb === null ? 0 : pa === null || pb === null ? 0.5 : Math.abs(pa - pb);
  const dPeso = a.weightKg !== null && b.weightKg !== null ? Math.min(1, Math.abs(a.weightKg - b.weightKg) / 5) : 0.3;
  const dEdad = a.edad !== null && b.edad !== null ? Math.min(1, Math.abs(a.edad - b.edad) / 10) : 0.3;
  return 0.35 * relativa(a.combates, b.combates) + 0.2 * dPeso + 0.2 * dVict + 0.15 * relativa(a.aura, b.aura) + 0.1 * dEdad;
}

export const parecido = (d: number): Parecido => (d < 0.15 ? "muy" : d < 0.3 ? "bastante" : "poco");

const kilos = (n: number) => `${String(Math.round(n * 10) / 10).replace(".", ",")} kg`;

/** Avisos en palabras corrientes de lo que más los separa (lo que el organizador debería mirar antes de decidir). */
export function avisos(a: DatosPareja, b: DatosPareja): string[] {
  const r: string[] = [];
  if (a.weightKg !== null && b.weightKg !== null && Math.abs(a.weightKg - b.weightKg) >= 3) r.push(`${kilos(Math.abs(a.weightKg - b.weightKg))} de diferencia de peso`);
  if (a.weightKg === null || b.weightKg === null) r.push("Alguno no ha indicado su peso");
  const dc = Math.abs(a.combates - b.combates);
  if (dc >= 5 || (dc >= 3 && Math.min(a.combates, b.combates) <= 2)) r.push(`${dc} combates de diferencia de experiencia`);
  if (a.edad !== null && b.edad !== null && Math.abs(a.edad - b.edad) >= 8) r.push(`${Math.abs(a.edad - b.edad)} años de diferencia de edad`);
  return r;
}

export type Sugerencia<T extends DatosPareja> = { rival: T; distancia: number; parecido: Parecido; avisos: string[] };

/** Los posibles rivales de un peleador entre los candidatos (sin él mismo), de más a menos parecidos. Como mucho `max`. */
export function sugerirRivales<T extends DatosPareja>(yo: T, candidatos: T[], max = 3): Sugerencia<T>[] {
  return candidatos
    .filter((c) => c.id !== yo.id)
    .map((c) => { const d = distancia(yo, c); return { rival: c, distancia: d, parecido: parecido(d), avisos: avisos(yo, c) }; })
    .sort((x, y) => x.distancia - y.distancia || x.rival.id.localeCompare(y.rival.id))
    .slice(0, max);
}
