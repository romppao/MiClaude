import { publicGyms } from "./gym-directory";
import { db } from "./db";
import { registrarFallo } from "./fallos";
import type { OrigenUbicacion, Punto } from "./mapa";

/**
 * Ubicación de los gimnasios para el mapa de /gimnasios (petición del fundador, 13 de octubre de 2026: «un mapa de la ubicación
 * en la que se encuentra el usuario en el que le muestren los gimnasios más cercanos»).
 *
 * - **Coordenadas del gimnasio:** se buscan con Nominatim (el buscador libre de OpenStreetMap, gratuito y sin clave) a partir de la
 *   dirección si la hay, o de la ciudad. Se hace en segundo plano al crear o cambiar un gimnasio y, poco a poco, con los que aún no
 *   tienen (`ubicarPendientes`). Respeta sus normas de uso: una consulta por segundo como mucho, un nombre de aplicación
 *   identificable y la atribución «© OpenStreetMap» en el mapa.
 * - **Sin coordenadas** (o sin conexión), el mapa usa el centro de la provincia (`CENTROS_PROVINCIA` en ./mapa.ts) y lo dice («ubicación aproximada»).
 * - **La ubicación de la persona nunca llega al servidor:** la distancia se calcula en su navegador (components/MapaGimnasios.tsx).
 * - `GEOCODIFICAR=no` desactiva las consultas a Nominatim (pruebas automáticas y entornos sin salida a internet).
 */

const geocodificarActivo = () => process.env.GEOCODIFICAR !== "no";
const AGENTE = `Lona/1.0 (comunidad de deportes de contacto; ${process.env.APP_URL ?? "sin dirección"})`;
let ultimaConsulta = 0;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Coordenadas de un texto («Calle X 3, Madrid, Madrid, España») con Nominatim, o null. Una consulta por segundo como mucho. */
export async function buscarCoordenadas(texto: string): Promise<Punto | null> {
  if (!geocodificarActivo()) return null;
  const espera = ultimaConsulta + 1100 - Date.now();
  if (espera > 0) await esperar(espera);
  ultimaConsulta = Date.now();
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es&q=${encodeURIComponent(texto)}`;
  const res = await fetch(url, { headers: { "User-Agent": AGENTE, "Accept-Language": "es" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Nominatim respondió ${res.status}`);
  const datos = (await res.json()) as { lat?: string; lon?: string }[];
  const lat = Number(datos[0]?.lat), lng = Number(datos[0]?.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/**
 * Formas más sencillas de una dirección, por si Nominatim no reconoce la original (15-10-2026: fallaban 13 de 61 por «nave 5», «local 7»,
 * paréntesis o «de los»): sin nave, local, planta ni paréntesis; después sin artículos; y por último solo el nombre de la vía y el número.
 */
export function variantesDireccion(address: string, city: string): string[] {
  const limpia = address.replace(/\([^)]*\)/g, "").replace(/,?\s*(nave|local|bajo|planta|piso|puerta|edificio)\b[^,]*/gi, "").replace(/\bs\/n\b/gi, "").replace(/\s+,/g, ",").replace(/[\s,]+$/, "").trim();
  const sinArticulos = limpia.replace(/\b(de la|de los|de las|del|de)\s+/gi, "");
  const via = /^(.*?),?\s*(\d+)\b/.exec(sinArticulos);
  const formas = [`${limpia}, ${city}, España`, `${sinArticulos}, ${city}, España`];
  if (via) formas.push(`${via[1].replace(/^(Calle|C\/|Avenida|Avda\.?|Plaza|Paseo)\s+/i, "")} ${via[2]}, ${city}, España`);
  return [...new Set(formas)];
}

/** Busca y guarda las coordenadas de un gimnasio (primero por dirección, luego por ciudad). Nunca lanza. */
export async function ubicarGimnasio(gymId: string): Promise<void> {
  if (!geocodificarActivo()) return;
  try {
    const g = await db.gym.findUnique({ where: { id: gymId }, select: { address: true, city: true, province: true } });
    if (!g) return;
    let punto: Punto | null = null, origen: OrigenUbicacion = "ciudad";
    if (g.address?.trim()) {
      punto = await buscarCoordenadas(`${g.address}, ${g.city}, ${g.province}, España`);
      for (const forma of punto ? [] : variantesDireccion(g.address, g.city)) if ((punto = await buscarCoordenadas(forma))) break;
      origen = "direccion";
    }
    if (!punto) { punto = await buscarCoordenadas(`${g.city}, ${g.province}, España`); origen = "ciudad"; }
    // Aunque no se encuentre, se anota el intento para no repetirlo en cada visita (se reintenta si cambian la dirección o la ciudad).
    await db.gym.update({ where: { id: gymId }, data: { lat: punto?.lat ?? null, lng: punto?.lng ?? null, geoSource: punto ? origen : null, geocodedAt: new Date() } });
  } catch (e) {
    await registrarFallo({ origen: "TAREA", contexto: "No se pudo ubicar un gimnasio en el mapa", error: e });
  }
}

/** Ubica unos pocos gimnasios que aún no tienen coordenadas (se llama en segundo plano desde /gimnasios). */
let ocupado = false;
export async function ubicarPendientes(maximo = 5): Promise<void> {
  if (!geocodificarActivo() || ocupado) return;
  ocupado = true;
  try {
    const pendientes = await db.gym.findMany({ where: { AND: [publicGyms()], geocodedAt: null }, select: { id: true }, take: maximo, orderBy: { id: "asc" } });
    for (const p of pendientes) await ubicarGimnasio(p.id);
  } finally {
    ocupado = false;
  }
}
