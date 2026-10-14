/** Decisión del fundador del 14-10-2026: Cataluña queda fuera del directorio y mapa. Única lista, también usada por el importador. */
export const EXCLUDED_GYM_PROVINCES = ["Barcelona", "Girona", "Lleida", "Tarragona"] as const;

const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/^provincia de /, "").trim();
export function excludedGymProvince(province: string) {
  return EXCLUDED_GYM_PROVINCES.some((p) => plain(p) === plain(province)) || ["gerona", "lerida"].includes(plain(province));
}

/** La provincia desconocida nunca se publica automáticamente. Los ficticios solo existen en demo. */
export function gymIsPublic(g: { status?: string; province: string; isFictional?: boolean }, demo = process.env.DEMO_MODE === "si") {
  return (g.status ?? "PUBLISHED") === "PUBLISHED" && !!g.province && !excludedGymProvince(g.province) && (demo || !g.isFictional);
}

/** Distancia esférica para duplicados de OSM; no usa la posición de la persona. */
export function gymDistanceMetres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lng - a.lng) * rad / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - Math.min(1, h)));
}

/** Una nueva descarga nunca pisa propiedad, correcciones manuales o verificación de moderación. */
export function osmMayUpdate(g: { ownerUserId: string | null; source: string; verifiedAt: Date | null }) {
  return !g.ownerUserId && g.source === "OSM" && !g.verifiedAt;
}
