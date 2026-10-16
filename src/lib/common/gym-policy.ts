import { PROVINCIAS_SIN_GIMNASIOS, provinciaConGimnasios } from "./territorio";

/** Alias de la política territorial compartida, también usado por el importador. */
export const EXCLUDED_GYM_PROVINCES = PROVINCIAS_SIN_GIMNASIOS;

export function excludedGymProvince(province: string) {
  return !provinciaConGimnasios(province);
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

/** Alta indirecta desde una ficha: solo moderación publica, y nunca fuera del territorio admitido. */
export function newGymStatus(role: string, province: string): "PENDING" | "PUBLISHED" {
  return role === "ADMIN" && !!province && !excludedGymProvince(province) ? "PUBLISHED" : "PENDING";
}
