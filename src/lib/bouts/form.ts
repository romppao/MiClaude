/** Campos del formulario «Registrar un combate»: viajan en la dirección al pedir que se elija al rival y para volver a rellenar el formulario. */
export const BOUT_FIELDS = ["discipline", "level", "divisionId", "weightClass", "eventName", "date", "venue", "city", "province", "oppFirst", "oppLast", "outcome", "method", "rounds", "endRound", "evidenceUrl"] as const;

/** Cadena de parámetros con lo escrito en esos campos (los vacíos se omiten). `get` lee el valor de cada campo. */
export function boutQuery(get: (campo: string) => string): string {
  const qs = new URLSearchParams();
  for (const k of BOUT_FIELDS) { const v = get(k); if (v) qs.set(k, v); }
  return qs.toString();
}
