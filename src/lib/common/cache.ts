import { unstable_cache } from "next/cache";

/** Etiquetas de las lecturas públicas que se pueden invalidar desde las acciones. */
export const ETIQUETAS_CACHE = ["fichas", "ranking", "veladas", "gimnasios", "entrenadores", "perfiles"] as const;
export type EtiquetaCache = (typeof ETIQUETAS_CACHE)[number];

/**
 * Ejecuta una lectura pública cacheada. La clave debe incluir todos los parámetros
 * ya validados y normalizados; no se usa con cookies, sesión ni datos privados.
 */
export function leerCacheado<T>(clave: string, etiquetas: readonly EtiquetaCache[], segundos: number, fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, [clave], { tags: [...etiquetas], revalidate: segundos })();
}

