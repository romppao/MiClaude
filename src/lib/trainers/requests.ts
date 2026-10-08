import type { ClassRequestStatus } from "@prisma/client";

/**
 * Solicitudes de clase (petición del fundador, 8 de octubre de 2026: «poder reservar las clases privadas publicadas es misión imposible,
 * ya que no hay opción ni un botón para hacerlo»). La persona pide la clase diciendo cuándo le viene bien; el entrenador la acepta o la
 * rechaza con un mensaje, y los dos lo ven en la aplicación y por correo. Ring España no cobra: la clase se paga al entrenador.
 */
export const REQUEST_PREFERRED_MAX = 200;
export const REQUEST_MESSAGE_MAX = 500;
export const REQUEST_PHONE_MAX = 20;
export const REQUEST_REPLY_MAX = 500;
/** Solicitudes nuevas por persona y día (evita el abuso del correo a los entrenadores). */
export const REQUESTS_PER_DAY = 10;

export const REQUEST_STATUS_LABEL: Record<ClassRequestStatus, string> = {
  PENDING: "Esperando respuesta",
  ACCEPTED: "Aceptada",
  DECLINED: "No disponible",
  CANCELLED: "Cancelada",
};

const limpio = (s: string) => s.replace(/\s+/g, " ").trim();

export type RequestInput = { preferred: string; message: string; phone: string };
export type RequestParsed = { ok: true; value: { preferred: string; message: string | null; phone: string | null } } | { ok: false; problema: string };

/** Valida lo que escribe quien solicita una clase. Los códigos de problema tienen su texto en `messages.ts`. */
export function parseClassRequest(input: RequestInput): RequestParsed {
  const preferred = limpio(input.preferred);
  if (!preferred) return { ok: false, problema: "solicitud_cuando" };
  if (preferred.length > REQUEST_PREFERRED_MAX) return { ok: false, problema: "solicitud_cuando_largo" };
  const message = limpio(input.message);
  if (message.length > REQUEST_MESSAGE_MAX) return { ok: false, problema: "solicitud_mensaje_largo" };
  const phone = input.phone.replace(/[\s.-]/g, "");
  if (phone && !/^\+?\d{6,15}$/.test(phone)) return { ok: false, problema: "solicitud_telefono" };
  return { ok: true, value: { preferred, message: message || null, phone: phone || null } };
}

/** Qué puede hacer cada parte con una solicitud según su estado. */
export const puedeResponder = (status: ClassRequestStatus) => status === "PENDING";
export const puedeCancelar = (status: ClassRequestStatus) => status === "PENDING" || status === "ACCEPTED";
