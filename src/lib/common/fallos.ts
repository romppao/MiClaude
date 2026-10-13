import { db } from "./db";
import { VERSION } from "./version";

/**
 * Registro de fallos de la aplicación (13 de octubre de 2026, petición del fundador).
 *
 * Cualquier parte del servidor que capture un error que no sabe resolver llama a `registrarFallo`. El fallo se guarda en la tabla
 * AppError, que moderación revisa en /moderacion/fallos. Reglas:
 *  - **Nunca lanza.** Registrar un fallo no puede provocar otro: si la base no responde, queda solo en el registro del servidor.
 *  - **Agrupa.** El mismo fallo (mismo origen, mismo mensaje sin números ni identificadores, misma ruta) suma uno a `count`.
 *  - **Sin datos personales.** Correos, claves y enlaces con clave se tachan antes de guardar; de la persona solo se guarda su tipo de cuenta.
 *  - **Se reabre solo.** Si un fallo marcado como resuelto vuelve a pasar, vuelve a «sin revisar» y se anota en el historial.
 * Las páginas, rutas y acciones del servidor ya quedan cubiertas por `onRequestError` (src/instrumentation.ts); los fallos del navegador
 * llegan por /api/fallos. Lo que se captura con try/catch a propósito (un correo que no sale, un aviso que no llega) se registra a mano.
 */

export const ORIGENES_FALLO = {
  PAGINA: "Al mostrar una página",
  ACCION: "Al guardar un formulario",
  RUTA: "En una dirección de datos (API)",
  CLIENTE: "En el navegador de la persona",
  CORREO: "Al enviar un correo",
  AVISOS: "Al enviar avisos",
  TAREA: "En una tarea automática",
  SERVIDOR: "En el servidor",
} as const;
export type OrigenFallo = keyof typeof ORIGENES_FALLO;

export const ESTADOS_FALLO = {
  OPEN: "Sin revisar",
  INVESTIGATING: "En estudio",
  RESOLVED: "Resuelto",
  IGNORED: "Descartado",
} as const;
export type EstadoFallo = keyof typeof ESTADOS_FALLO;

const MAX_MENSAJE = 500;
const MAX_PILA = 4000;
const MAX_RUTA = 300;

/** Tacha lo que pueda identificar a alguien o abrir una cuenta: correos, claves de enlaces, tokens largos y cadenas de conexión. */
export function tacharDatos(texto: string): string {
  return texto
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "postgresql://[oculto]")
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[correo]")
    .replace(/([?&](?:token|clave|key|code|codigo|secret)=)[^&\s"']+/gi, "$1[oculto]")
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[clave]");
}

/** Mensaje sin las partes que cambian de una vez a otra (números, identificadores), para reconocer el mismo fallo. */
export function normalizarMensaje(mensaje: string): string {
  return mensaje
    .replace(/\b[a-z0-9]{20,}\b/gi, "*")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/** Ruta sin parámetros ni números (la ficha 12 y la 13 son la misma pantalla). */
export function normalizarRuta(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  return ruta.split(/[?#]/)[0].replace(/\d+/g, "#").slice(0, MAX_RUTA) || "/";
}

/** Huella del fallo: dos FNV-1a de 32 bits (no hace falta criptografía; sin `node:crypto` para que src/instrumentation.ts compile en todos los entornos). */
export function huellaFallo(origen: OrigenFallo, mensaje: string, ruta: string | null | undefined): string {
  const texto = `${origen}|${normalizarMensaje(mensaje)}|${normalizarRuta(ruta) ?? ""}`;
  let a = 0x811c9dc5, b = 0x01000193 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x5bd1e995) >>> 0;
  }
  return `${origen.toLowerCase()}-${a.toString(16).padStart(8, "0")}${b.toString(16).padStart(8, "0")}`;
}

function aTexto(error: unknown): { mensaje: string; pila: string | null } {
  if (error instanceof Error) return { mensaje: `${error.name && error.name !== "Error" ? `${error.name}: ` : ""}${error.message || "(sin mensaje)"}`, pila: error.stack ?? null };
  if (typeof error === "string") return { mensaje: error, pila: null };
  try { return { mensaje: JSON.stringify(error) ?? String(error), pila: null }; } catch { return { mensaje: String(error), pila: null }; }
}

// Freno ante una avalancha (por ejemplo, la base caída y cada visita fallando): como mucho 60 escrituras por minuto en cada proceso.
let ventana = 0;
let escritas = 0;
function hayCupo(ahora = Date.now()): boolean {
  if (ahora - ventana > 60_000) { ventana = ahora; escritas = 0; }
  return ++escritas <= 60;
}

export type DatosFallo = {
  origen: OrigenFallo;
  error: unknown;
  /** Contexto en palabras de quien lo registra («no se pudo enviar el correo de recuperación»). Va delante del mensaje técnico. */
  contexto?: string;
  ruta?: string | null;
  digest?: string | null;
  papel?: string | null;
};

/** Guarda (o suma) un fallo. No lanza nunca y siempre lo escribe también en el registro del servidor. */
export async function registrarFallo(datos: DatosFallo): Promise<void> {
  const { mensaje: tecnico, pila } = aTexto(datos.error);
  const mensaje = tacharDatos(datos.contexto ? `${datos.contexto}: ${tecnico}` : tecnico).slice(0, MAX_MENSAJE);
  const ruta = datos.ruta ? tacharDatos(datos.ruta.split("#")[0]).slice(0, MAX_RUTA) : null;
  console.error(`[fallo ${datos.origen}] ${mensaje}${ruta ? ` (${ruta})` : ""}`);
  if (!hayCupo()) return;
  try {
    const fingerprint = huellaFallo(datos.origen, mensaje, ruta);
    const stack = pila ? tacharDatos(pila).slice(0, MAX_PILA) : null;
    const ahora = new Date();
    const previo = await db.appError.findUnique({ where: { fingerprint }, select: { id: true, status: true } });
    if (!previo) {
      await db.appError.create({ data: { fingerprint, origin: datos.origen, message: mensaje, stack, path: ruta, digest: datos.digest ?? null, role: datos.papel ?? null, firstVersion: VERSION, version: VERSION } });
      return;
    }
    const reabrir = previo.status === "RESOLVED";
    await db.appError.update({
      where: { id: previo.id },
      data: { count: { increment: 1 }, lastSeenAt: ahora, message: mensaje, stack: stack ?? undefined, path: ruta, digest: datos.digest ?? null, role: datos.papel ?? null, version: VERSION, ...(reabrir ? { status: "OPEN" } : {}) },
    });
    if (reabrir) await db.auditLog.create({ data: { entity: "APP_ERROR", entityId: previo.id, action: "FALLO_REAPARECE", before: { status: "RESOLVED" }, after: { status: "OPEN" } } });
  } catch (e) {
    console.error(`[fallo] no se pudo guardar en la base: ${e instanceof Error ? e.message : String(e)}`);
  }
}
