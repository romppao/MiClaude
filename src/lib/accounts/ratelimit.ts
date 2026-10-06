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
 *
 * X-Forwarded-For es una lista («cliente, proxy1, proxy2…») a la que cada proxy de confianza añade al final la dirección de quien le habló.
 * Lo que escribe el propio cliente va al principio y se puede inventar, así que NO se lee el primer valor sino el que añadió nuestro
 * proxy: el `saltos`-ésimo contando desde el final (1 = un solo proxy delante de la aplicación; `TRUSTED_PROXY_HOPS` lo cambia).
 */
export function normalizeIp(raw: string | null | undefined, saltos = 1): string | null {
  const partes = (raw ?? "").split(",").map((p) => p.trim());
  const ip = partes[Math.max(0, partes.length - Math.max(1, saltos))] ?? "";
  if (!ip || ip.length > 45 || !/^[0-9a-fA-F:.]+$/.test(ip)) return null;
  if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") return null;
  return ip;
}

export async function clientIp(): Promise<string | null> {
  const h = await headers();
  const saltos = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10);
  return normalizeIp(h.get("x-forwarded-for"), Number.isInteger(saltos) && saltos >= 1 && saltos <= 5 ? saltos : 1) ?? normalizeIp(h.get("x-real-ip"));
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
  const hit = await db.rateHit.create({ data: { key }, select: { id: true } });
  const permitido = (await countHits(key, windowMs)) <= max;
  // Un intento rechazado no debe alargar indefinidamente el bloqueo: conserva los
  // intentos que ya habían llegado al límite y retira únicamente su propia fila.
  if (!permitido) await db.rateHit.deleteMany({ where: { id: hit.id } });
  return permitido;
}

/**
 * Reserva un intento ANTES de comprobar una contraseña (anota primero y cuenta después, como `allow`): así peticiones simultáneas no pueden
 * ver todas «0 intentos» y probar cientos de contraseñas antes de que se anote el primer fallo. `devolver()` anula la reserva: se usa cuando
 * la contraseña era correcta, porque entrar bien no debe gastar intentos.
 */
export async function reservar(key: string, max: number, windowMs: number): Promise<{ permitido: boolean; devolver: () => Promise<unknown> }> {
  const hit = await db.rateHit.create({ data: { key }, select: { id: true } });
  const permitido = (await countHits(key, windowMs)) <= max;
  const devolver = () => db.rateHit.deleteMany({ where: { id: hit.id } });
  // Igual que en `allow`, una reserva que no se concede no puede ampliar la
  // ventana de bloqueo. `devolver` sigue siendo seguro de llamar dos veces.
  if (!permitido) await devolver();
  return { permitido, devolver };
}

/** Borra los intentos de una clave (por ejemplo, tras iniciar sesión correctamente). */
export const clearHits = (key: string) => db.rateHit.deleteMany({ where: { key } });
