/**
 * Cálculos del mapa de gimnasios que sirven igual en el servidor y en el navegador (sin base de datos ni red): centros de provincia,
 * distancia entre dos puntos, texto de la distancia y dónde pintar cada gimnasio. La búsqueda de coordenadas está en ./geo.ts.
 */

export type Punto = { lat: number; lng: number };

/** Centro aproximado (la capital) de cada provincia, con los mismos nombres que `PROVINCES` (lib/common/labels.ts). */
export const CENTROS_PROVINCIA: Record<string, Punto> = {
  "A Coruña": { lat: 43.3623, lng: -8.4115 }, "Álava": { lat: 42.8467, lng: -2.6716 }, "Albacete": { lat: 38.9943, lng: -1.8585 },
  "Alicante": { lat: 38.3452, lng: -0.481 }, "Almería": { lat: 36.8381, lng: -2.4597 }, "Asturias": { lat: 43.3614, lng: -5.8494 },
  "Ávila": { lat: 40.6566, lng: -4.6818 }, "Badajoz": { lat: 38.8794, lng: -6.9707 }, "Baleares": { lat: 39.5696, lng: 2.6502 },
  "Barcelona": { lat: 41.3874, lng: 2.1686 }, "Bizkaia": { lat: 43.263, lng: -2.935 }, "Burgos": { lat: 42.3439, lng: -3.6969 },
  "Cáceres": { lat: 39.4753, lng: -6.3724 }, "Cádiz": { lat: 36.5271, lng: -6.2886 }, "Cantabria": { lat: 43.4623, lng: -3.81 },
  "Castellón": { lat: 39.9864, lng: -0.0513 }, "Ceuta": { lat: 35.8894, lng: -5.3213 }, "Ciudad Real": { lat: 38.9848, lng: -3.9274 },
  "Córdoba": { lat: 37.8882, lng: -4.7794 }, "Cuenca": { lat: 40.0704, lng: -2.1374 }, "Gipuzkoa": { lat: 43.3183, lng: -1.9812 },
  "Girona": { lat: 41.9794, lng: 2.8214 }, "Granada": { lat: 37.1773, lng: -3.5986 }, "Guadalajara": { lat: 40.6329, lng: -3.1669 },
  "Huelva": { lat: 37.2614, lng: -6.9447 }, "Huesca": { lat: 42.1401, lng: -0.4089 }, "Jaén": { lat: 37.7796, lng: -3.7849 },
  "La Rioja": { lat: 42.4627, lng: -2.445 }, "Las Palmas": { lat: 28.1235, lng: -15.4363 }, "León": { lat: 42.5987, lng: -5.5671 },
  "Lleida": { lat: 41.6176, lng: 0.62 }, "Lugo": { lat: 43.0097, lng: -7.5568 }, "Madrid": { lat: 40.4168, lng: -3.7038 },
  "Málaga": { lat: 36.7213, lng: -4.4214 }, "Melilla": { lat: 35.2923, lng: -2.9381 }, "Murcia": { lat: 37.9922, lng: -1.1307 },
  "Navarra": { lat: 42.8125, lng: -1.6458 }, "Ourense": { lat: 42.3358, lng: -7.8639 }, "Palencia": { lat: 42.0095, lng: -4.5288 },
  "Pontevedra": { lat: 42.431, lng: -8.6444 }, "Salamanca": { lat: 40.9701, lng: -5.6635 }, "Santa Cruz de Tenerife": { lat: 28.4636, lng: -16.2518 },
  "Segovia": { lat: 40.9429, lng: -4.1088 }, "Sevilla": { lat: 37.3891, lng: -5.9845 }, "Soria": { lat: 41.7666, lng: -2.479 },
  "Tarragona": { lat: 41.1189, lng: 1.2445 }, "Teruel": { lat: 40.3456, lng: -1.1065 }, "Toledo": { lat: 39.8628, lng: -4.0273 },
  "Valencia": { lat: 39.4699, lng: -0.3763 }, "Valladolid": { lat: 41.6523, lng: -4.7245 }, "Zamora": { lat: 41.5034, lng: -5.7468 },
  "Zaragoza": { lat: 41.6488, lng: -0.8891 },
};

/** Centro de la península: punto de partida del mapa cuando no hay nada mejor. */
export const CENTRO_ESPANA: Punto = { lat: 40.2, lng: -3.7 };

/** Distancia en kilómetros entre dos puntos (fórmula del semiverseno; de sobra precisa para «a 3,2 km»). */
export function distanciaKm(a: Punto, b: Punto): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** «a 850 m», «a 3,2 km», «a 120 km». */
export function textoDistancia(km: number): string {
  if (km < 1) return `a ${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `a ${km.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km`;
  return `a ${Math.round(km).toLocaleString("es-ES")} km`;
}

export type OrigenUbicacion = "direccion" | "ciudad" | "provincia" | "osm";

/**
 * Dónde pintar un gimnasio: sus coordenadas si las tiene; si no, el centro de su provincia, desplazado un poco (siempre igual para
 * el mismo gimnasio) para que varios gimnasios de la misma provincia no queden uno encima de otro.
 */
export function puntoDeGimnasio(g: { id: string; lat: number | null; lng: number | null; geoSource: string | null; province: string }): (Punto & { origen: OrigenUbicacion }) | null {
  if (g.lat !== null && g.lng !== null) return { lat: g.lat, lng: g.lng, origen: g.geoSource === "osm" ? "osm" : g.geoSource === "direccion" ? "direccion" : "ciudad" };
  const c = CENTROS_PROVINCIA[g.province];
  if (!c) return null;
  let h = 0;
  for (const ch of g.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const ang = (h % 360) * (Math.PI / 180), r = 0.01 + ((h >>> 9) % 100) / 4000; // hasta ~3 km
  return { lat: c.lat + r * Math.sin(ang), lng: c.lng + r * Math.cos(ang), origen: "provincia" };
}

/**
 * Popularidad de un gimnasio, para «Los más populares de tu zona». **Decisión del fundador, 16 de octubre de 2026:** «no pongas un ránking
 * de gimnasios, ya que esto puede ser muy perjudicial; únicamente para los peleadores. Para entrenadores y gimnasios no lo hagas; puedes
 * poner los más populares, pero no un ránking de quién es mejor que otro». Por eso solo cuenta cuánta gente de la comunidad está en el
 * gimnasio (peleadores + entrenadores): no usa el aura de sus peleadores, ni el sello de «verificado», ni ninguna medida de calidad, y la
 * pantalla no numera los puestos ni habla de «mejores». Para entrenadores tampoco hay ránking.
 */
export const popularidadGimnasio = (g: { peleadores: number; entrenadores: number }): number => g.peleadores + g.entrenadores;

/**
 * Los gimnasios más populares «de tu zona»: con ubicación, los que están a menos de `radioKm` (si hay menos de 3, se amplía a 3 veces el
 * radio); sin ubicación, todos los recibidos (la página ya los filtra por provincia o búsqueda). Ordenados por popularidad y, a igualdad,
 * por cercanía y nombre. Es un orden para empezar por los más activos, no una clasificación de calidad.
 */
export function popularesDeLaZona<T extends Punto & { popularidad: number; nombre: string }>(gimnasios: T[], yo: Punto | null, cuantos = 6, radioKm = 30): (T & { km: number | null })[] {
  const conDistancia = gimnasios.map((g) => ({ ...g, km: yo ? distanciaKm(yo, g) : null }));
  let zona = conDistancia;
  if (yo) {
    zona = conDistancia.filter((g) => (g.km ?? 0) <= radioKm);
    if (zona.length < 3) zona = conDistancia.filter((g) => (g.km ?? 0) <= radioKm * 3);
    if (zona.length === 0) zona = [...conDistancia].sort((a, b) => (a.km ?? 0) - (b.km ?? 0)).slice(0, cuantos);
  }
  return zona.sort((a, b) => b.popularidad - a.popularidad || (a.km ?? 0) - (b.km ?? 0) || a.nombre.localeCompare(b.nombre, "es")).slice(0, cuantos);
}

/** Enlace «Cómo llegar» con la aplicación de mapas del teléfono (Google Maps abre la del móvil; es solo un enlace: sin coste ni clave). */
export const enlaceComoLlegar = (p: Punto) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
