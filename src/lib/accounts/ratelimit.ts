import { headers } from "next/headers";
import { db } from "../common/db";

/**
 * Límite de frecuencia sobre la tabla RateHit: cada intento deja una fila con su clave («acción:correo» o «acción:IP»)
 * y se cuentan las de la ventana de tiempo. Sirve para frenar la fuerza bruta en el acceso y los envíos masivos de correo.
 */
export const MINUTO = 60_000;
export const HORA = 60 * MINUTO;

/**
 * Dirección IP de quien hace la petición, tal como la indica el servidor intermedio (proxy) que hay delante de la aplicación.
 * Devuelve null si no hay (desarrollo en local) o no tiene aspecto de dirección: entonces solo se aplican los límites por correo.
 * En producción la aplicación debe ir detrás de un proxy que sustituya la cabecera X-Forwarded-For; si no, la IP se podría falsear.
 */
export function normalizeIp(raw: string | null | undefined): string | null {
  const ip = (raw ?? "").split(",")[0].trim();
  if (!ip || ip.length > 45 || !/^[0-9a-fA-F:.]+$/.test(ip)) return null;
  if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") return null;
  return ip;
}

export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return normalizeIp(h.get("x-forwarded-for")) ?? normalizeIp(h.get("x-real-ip"));
}

const since = (windowMs: number) => new Date(Date.now() - windowMs);

/** Cuántos intentos con esa clave hay dentro de la ventana. */
export const countHits = (key: string, windowMs: number) => db.rateHit.count({ where: { key, createdAt: { gt: since(windowMs) } } });

/** Anota un intento. */
export const addHit = (key: string) => db.rateHit.create({ data: { key } });

/** ¿Ya se ha alcanzado el máximo de intentos en la ventana? (no anota nada) */
export async function isBlocked(key: string, max: number, windowMs: number): Promise<boolean> {
  return (await countHits(key, windowMs)) >= max;
}

/** Anota un intento y dice si sigue dentro del límite (el intento que llega al máximo todavía se admite). */
export async function allow(key: string, max: number, windowMs: number): Promise<boolean> {
  await addHit(key);
  return (await countHits(key, windowMs)) <= max;
}

/** Borra los intentos de una clave (por ejemplo, tras iniciar sesión correctamente). */
export const clearHits = (key: string) => db.rateHit.deleteMany({ where: { key } });
