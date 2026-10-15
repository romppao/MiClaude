import { randomUUID } from "node:crypto";

/**
 * Avisos de fallos a Sentry (T-010; ADR-003: plan gratuito, región de la UE). Sin SDK ni dependencias: se envía el «sobre» (envelope) por
 * HTTP, el formato estándar de Sentry. Así se puede cambiar de servicio sin tocar el resto (petición del fundador: fácil de modificar).
 *
 * Solo llega a Sentry lo que ya se guarda en «Fallos» (fallos.ts): el mensaje con los datos personales tachados, el origen, la ruta y la
 * versión. Nunca el usuario, su correo, su IP ni el cuerpo de la petición. Se avisa solo la primera vez que aparece un fallo y cuando vuelve
 * tras darse por resuelto, para no gastar el cupo gratuito con repeticiones (el recuento sigue en «Fallos»).
 * Sin SENTRY_DSN no se envía nada.
 */
export type Dsn = { endpoint: string; clave: string; dsn: string };

/** Interpreta un DSN de Sentry («https://<clave>@<servidor>/<proyecto>»). Devuelve null si no es válido. */
export function leerDsn(dsn: string | undefined): Dsn | null {
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const proyecto = u.pathname.replace(/^\/+|\/+$/g, "");
    if (u.protocol !== "https:" || !u.username || !/^\d+$/.test(proyecto)) return null;
    return { endpoint: `https://${u.host}/api/${proyecto}/envelope/`, clave: u.username, dsn };
  } catch {
    return null;
  }
}

export type FalloParaSentry = { mensaje: string; origen: string; ruta: string | null; huella: string; version: string; pila?: string | null };

/** Construye el sobre (tres líneas JSON: cabecera, cabecera del elemento y evento). Pura, para poder probarla. */
export function sobre(f: FalloParaSentry, d: Dsn, ahora = new Date(), id = randomUUID().replace(/-/g, "")): string {
  const evento = {
    event_id: id,
    timestamp: ahora.toISOString(),
    level: "error",
    platform: "node",
    release: `lona@${f.version}`,
    environment: process.env.DEMO_MODE === "si" ? "demo" : process.env.NODE_ENV === "production" ? "produccion" : "desarrollo",
    message: { formatted: f.mensaje },
    tags: { origen: f.origen, ...(f.ruta ? { ruta: f.ruta } : {}) },
    fingerprint: [f.huella],
    ...(f.pila ? { extra: { pila: f.pila } } : {}),
  };
  return [JSON.stringify({ event_id: id, sent_at: ahora.toISOString(), dsn: d.dsn }), JSON.stringify({ type: "event" }), JSON.stringify(evento)].join("\n");
}

/** Envía el fallo a Sentry si hay SENTRY_DSN. Nunca lanza ni espera más de 3 segundos. Devuelve si se aceptó. */
export async function avisarASentry(f: FalloParaSentry, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const d = leerDsn(env.SENTRY_DSN);
  if (!d) return false;
  try {
    const r = await fetch(d.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope", "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${d.clave}, sentry_client=lona/1.0` },
      body: sobre(f, d),
      signal: AbortSignal.timeout(3000),
    });
    return r.ok;
  } catch {
    return false;
  }
}
