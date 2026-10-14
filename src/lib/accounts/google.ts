import { createHash, randomBytes } from "node:crypto";
import { APP_URL } from "../common/mail";
import { TIPOS_DE_CUENTA, type TipoDeCuenta } from "./landing";

/**
 * Entrar y registrarse con Google (petición del fundador, 14 de octubre de 2026; ficha docs/tareas/T-015-entrar-con-google.md).
 * OpenID Connect con código de autorización + PKCE (S256), `state` y `nonce`. Solo se piden nombre y correo (`openid email profile`):
 * con esos permisos Google no limita a usuarios de prueba ni muestra avisos (ayuda de Google Cloud, «Manage App Audience»).
 * Aquí está todo lo que no depende de la petición (se prueba en tests/unit/google.test.ts); las rutas están en src/app/api/auth/google/.
 */

export const GOOGLE_AUTORIZACION = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKENS = "https://oauth2.googleapis.com/token";
const EMISORES = new Set(["https://accounts.google.com", "accounts.google.com"]);
/** Cookie con el estado del viaje a Google (10 minutos, solo la lee nuestro servidor). */
export const COOKIE_GOOGLE = "google_oidc";
export const DURACION_VIAJE_S = 600;

/** Las claves se configuran en el alojamiento (GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET); sin ellas el botón no aparece. */
export function configGoogle(): { clientId: string; clientSecret: string; redirectUri: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, redirectUri: `${APP_URL}/api/auth/google/callback` };
}
export const googleDisponible = () => configGoogle() !== null;

const base64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const aleatorio = () => base64url(randomBytes(32));

/** Lo que se guarda en la cookie durante el viaje a Google y se comprueba a la vuelta. */
export type ViajeGoogle = { state: string; verifier: string; nonce: string; modo: "entrar" | "registro"; tipo: TipoDeCuenta; next: string };

/** Prepara un viaje nuevo: valores aleatorios para `state`, `nonce` y el verificador PKCE. */
export function nuevoViaje(modo: string, tipo: string, next: string): ViajeGoogle {
  return {
    state: aleatorio(), verifier: aleatorio(), nonce: aleatorio(),
    modo: modo === "registro" ? "registro" : "entrar",
    tipo: TIPOS_DE_CUENTA.find((t) => t === tipo && t !== "entidad") ?? "usuario",
    next,
  };
}

/** Lee la cookie del viaje; si está manipulada o le falta algo, null. */
export function leerViaje(valor: string | undefined): ViajeGoogle | null {
  if (!valor) return null;
  try {
    const v = JSON.parse(Buffer.from(valor, "base64url").toString("utf8")) as Partial<ViajeGoogle>;
    if (typeof v.state !== "string" || typeof v.verifier !== "string" || typeof v.nonce !== "string" || typeof v.next !== "string") return null;
    return nuevoViajeDe(v as ViajeGoogle);
  } catch {
    return null;
  }
}
const nuevoViajeDe = (v: ViajeGoogle): ViajeGoogle => ({ ...v, modo: v.modo === "registro" ? "registro" : "entrar", tipo: TIPOS_DE_CUENTA.find((t) => t === v.tipo && t !== "entidad") ?? "usuario" });
export const escribirViaje = (v: ViajeGoogle) => Buffer.from(JSON.stringify(v), "utf8").toString("base64url");

/** Dirección de Google a la que se lleva a la persona. */
export function urlDeAutorizacion(cfg: { clientId: string; redirectUri: string }, viaje: ViajeGoogle): string {
  const u = new URL(GOOGLE_AUTORIZACION);
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", cfg.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", viaje.state);
  u.searchParams.set("nonce", viaje.nonce);
  u.searchParams.set("code_challenge", base64url(createHash("sha256").update(viaje.verifier).digest()));
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("prompt", "select_account"); // que elija la cuenta: en un móvil compartido no entra con la de otra persona
  return u.toString();
}

/** Datos de la persona que da Google, ya comprobados. */
export type IdentidadGoogle = { sub: string; email: string; nombre: string };

/**
 * Comprueba el `id_token` recibido DIRECTAMENTE del endpoint de tokens de Google por TLS. Por eso no se verifica la firma
 * (OpenID Connect Core 1.0, §3.1.3.7, punto 6). Sí se comprueban emisor, destinatario, caducidad, `nonce` y correo confirmado.
 */
export function validarIdToken(idToken: string, esperado: { clientId: string; nonce: string; ahora?: number }):
  { ok: true; identidad: IdentidadGoogle } | { ok: false; motivo: string } {
  const partes = idToken.split(".");
  if (partes.length !== 3) return { ok: false, motivo: "formato" };
  let c: Record<string, unknown>;
  try { c = JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8")); } catch { return { ok: false, motivo: "formato" }; }
  const ahora = Math.floor((esperado.ahora ?? Date.now()) / 1000);
  if (typeof c.iss !== "string" || !EMISORES.has(c.iss)) return { ok: false, motivo: "emisor" };
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (!aud.includes(esperado.clientId)) return { ok: false, motivo: "destinatario" };
  if (typeof c.exp !== "number" || c.exp <= ahora) return { ok: false, motivo: "caducado" };
  if (c.nonce !== esperado.nonce) return { ok: false, motivo: "nonce" };
  if (typeof c.sub !== "string" || !c.sub || c.sub.length > 255) return { ok: false, motivo: "sub" };
  if (typeof c.email !== "string" || !c.email.includes("@")) return { ok: false, motivo: "correo" };
  if (c.email_verified !== true && c.email_verified !== "true") return { ok: false, motivo: "correo_sin_confirmar" };
  const nombre = (typeof c.name === "string" && c.name.trim()) || c.email.split("@")[0];
  return { ok: true, identidad: { sub: c.sub, email: c.email.toLowerCase(), nombre: nombre.replace(/\s+/g, " ").trim().slice(0, 80) } };
}

/** Qué hacer con la persona que vuelve de Google, según lo que ya hay en la base de datos. */
export type DecisionCuenta =
  | { accion: "entrar"; userId: string }
  | { accion: "vincular"; userId: string; protegerCuenta: boolean }
  | { accion: "crear" };

/**
 * 1) Ya vinculada a ese `sub`: entra. 2) Hay una cuenta con ese correo: se vincula. Si esa cuenta no había confirmado el correo,
 * alguien pudo crearla con un correo ajeno («secuestro previo»): se invalida su contraseña y se cierran sus sesiones antes de vincular.
 * 3) No hay cuenta: se crea.
 */
export function decidirCuenta(
  porSub: { id: string } | null,
  porCorreo: { id: string; googleSub: string | null; emailVerifiedAt: Date | null } | null,
): DecisionCuenta {
  if (porSub) return { accion: "entrar", userId: porSub.id };
  if (porCorreo) return { accion: "vincular", userId: porCorreo.id, protegerCuenta: !porCorreo.emailVerifiedAt };
  return { accion: "crear" };
}

/** Canjea el código por los tokens en Google. Devuelve el `id_token` o lanza un error sin datos personales. */
export async function canjearCodigo(cfg: { clientId: string; clientSecret: string; redirectUri: string }, code: string, verifier: string): Promise<string> {
  const r = await fetch(GOOGLE_TOKENS, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: cfg.clientId, client_secret: cfg.clientSecret, redirect_uri: cfg.redirectUri, grant_type: "authorization_code", code_verifier: verifier }),
    signal: AbortSignal.timeout(10_000),
  });
  const datos = (await r.json().catch(() => ({}))) as { id_token?: unknown; error?: unknown };
  if (!r.ok || typeof datos.id_token !== "string") throw new Error(`Google no devolvió el id_token (HTTP ${r.status}${typeof datos.error === "string" ? `, ${datos.error}` : ""})`);
  return datos.id_token;
}
