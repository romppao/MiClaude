import type { ClassRequestStatus } from "@prisma/client";

/**
 * Solicitudes de clase (petición del fundador, 8 de octubre de 2026: «poder reservar las clases privadas publicadas es misión imposible,
 * ya que no hay opción ni un botón para hacerlo»). La persona pide la clase diciendo cuándo le viene bien; el entrenador la acepta o la
 * rechaza con un mensaje, y los dos lo ven en la aplicación y por correo. Ring España no cobra: la clase se paga al entrenador.
 */
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

/** Franja de la barra de horas: de 07:00 a 23:00, en saltos de media hora. Minutos desde las 00:00 (hora peninsular). */
export const HORA_MIN = 7 * 60;
export const HORA_MAX = 23 * 60;
export const PASO_MINUTOS = 30;
/** Hasta cuántos días por delante se puede pedir una clase. */
export const DIAS_POR_DELANTE = 90;

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
/** «18:30». */
export const hora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
/** «martes 14 de octubre» a partir de «2026-10-14». */
export function diaLegible(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
}
/** Lo que lee el entrenador: «martes 14 de octubre, entre las 18:00 y las 20:00» (o solo el día en una clase colectiva). */
export function textoDeHorario(dia: string, desde: number | null, hasta: number | null): string {
  return desde !== null && hasta !== null ? `${diaLegible(dia)}, entre las ${hora(desde)} y las ${hora(hasta)}` : diaLegible(dia);
}

export type RequestInput = { day: string; from: string; to: string; message: string; phone: string; kind: "INDIVIDUAL" | "GROUP"; minutes: number; today: string };
export type RequestParsed =
  | { ok: true; value: { preferred: string; day: Date; fromMinute: number | null; toMinute: number | null; message: string | null; phone: string | null } }
  | { ok: false; problema: string };

const minutos = (raw: string) => (/^\d{1,4}$/.test(raw.trim()) ? Number(raw.trim()) : NaN);

/**
 * Valida lo que elige quien solicita una clase (rediseño del 8 de octubre de 2026: «le obliga a escribir mucho; mejor seleccionar la
 * fecha en un calendario y su rango de tiempo con una barra»). El día, de hoy a 90 días; en una clase individual, una franja de 07:00 a
 * 23:00 en medias horas que quepa la clase entera. Los códigos de problema tienen su texto en `messages.ts`.
 */
export function parseClassRequest(input: RequestInput): RequestParsed {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.day) || Number.isNaN(Date.parse(`${input.day}T00:00:00Z`))) return { ok: false, problema: "solicitud_dia" };
  const limite = new Date(Date.parse(`${input.today}T00:00:00Z`) + DIAS_POR_DELANTE * 864e5).toISOString().slice(0, 10);
  if (input.day < input.today || input.day > limite) return { ok: false, problema: "solicitud_dia" };
  let fromMinute: number | null = null, toMinute: number | null = null;
  if (input.kind === "INDIVIDUAL") {
    const desde = minutos(input.from), hasta = minutos(input.to);
    const valido = (m: number) => Number.isInteger(m) && m >= HORA_MIN && m <= HORA_MAX && m % PASO_MINUTOS === 0;
    if (!valido(desde) || !valido(hasta) || hasta <= desde) return { ok: false, problema: "solicitud_horas" };
    if (hasta - desde < input.minutes) return { ok: false, problema: "solicitud_horas_cortas" };
    fromMinute = desde; toMinute = hasta;
  }
  const message = limpio(input.message);
  if (message.length > REQUEST_MESSAGE_MAX) return { ok: false, problema: "solicitud_mensaje_largo" };
  const phone = input.phone.replace(/[\s.-]/g, "");
  if (phone && !/^\+?\d{6,15}$/.test(phone)) return { ok: false, problema: "solicitud_telefono" };
  return { ok: true, value: { preferred: textoDeHorario(input.day, fromMinute, toMinute), day: new Date(`${input.day}T00:00:00Z`), fromMinute, toMinute, message: message || null, phone: phone || null } };
}

/** Qué puede hacer cada parte con una solicitud según su estado. */
export const puedeResponder = (status: ClassRequestStatus) => status === "PENDING";
export const puedeCancelar = (status: ClassRequestStatus) => status === "PENDING" || status === "ACCEPTED";
