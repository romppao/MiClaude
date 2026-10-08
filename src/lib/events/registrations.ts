import type { RegistrationStatus } from "@prisma/client";

/**
 * Inscripción de peleadores en veladas e interclubs (propuesta n.º 3 del diseño v3; pedida por el fundador el 9 de octubre de 2026:
 * «solicitar participación en una velada o interclub, y que los organizadores puedan gestionar todas esas solicitudes, filtrar las listas
 * con x parámetros, listarlo por un orden… todo para facilitar la selección de los peleadores»).
 * El organizador abre o cierra la inscripción; el peleador la solicita con su categoría y su peso; el organizador acepta o rechaza, y
 * después empareja a los aceptados en el cartel. Aceptar no crea combates.
 */
export const REG_STATUS_LABEL: Record<RegistrationStatus, string> = { PENDING: "Pendiente", ACCEPTED: "Aceptada", DECLINED: "Rechazada", WITHDRAWN: "Retirada" };
export const REG_MESSAGE_MAX = 500;
export const REG_REPLY_MAX = 500;
export const REG_NOTE_MAX = 500;
export const PESO_MIN = 20;
export const PESO_MAX = 200;
/** Solicitudes nuevas por peleador y día. */
export const REGISTRATIONS_PER_DAY = 10;

const limpio = (s: string) => s.replace(/\s+/g, " ").trim();

/** ¿Se puede pedir participar hoy? Abierta por el organizador, evento programado y futuro (o de hoy), y sin pasar la fecha límite. */
export function inscripcionAbierta(e: { registrationOpen: boolean; status: string; date: Date; registrationUntil: Date | null }, hoy: string): boolean {
  const dia = (d: Date) => d.toISOString().slice(0, 10);
  return e.registrationOpen && e.status === "SCHEDULED" && dia(e.date) >= hoy && (!e.registrationUntil || dia(e.registrationUntil) >= hoy);
}

export type RegistrationParsed = { ok: true; value: { weightKg: number | null; message: string | null } } | { ok: false; problema: string };

/** Peso (opcional, de 20 a 200 kg, con coma o punto y como mucho un decimal) y mensaje (opcional). */
export function parseRegistration(input: { weightKg: string; message: string }): RegistrationParsed {
  const crudo = input.weightKg.trim().replace(",", ".");
  let weightKg: number | null = null;
  if (crudo) {
    if (!/^\d{2,3}(\.\d)?$/.test(crudo) || Number(crudo) < PESO_MIN || Number(crudo) > PESO_MAX) return { ok: false, problema: "inscripcion_peso" };
    weightKg = Number(crudo);
  }
  const message = limpio(input.message);
  if (message.length > REG_MESSAGE_MAX) return { ok: false, problema: "inscripcion_mensaje_largo" };
  return { ok: true, value: { weightKg, message: message || null } };
}

/** Requisitos y fecha límite que escribe el organizador al abrir la inscripción. La fecha, de hoy al día del evento. */
export function parseRegistrationSettings(input: { note: string; until: string; hoy: string; diaEvento: string }): { ok: true; value: { registrationNote: string | null; registrationUntil: Date | null } } | { ok: false; problema: string } {
  const note = limpio(input.note);
  if (note.length > REG_NOTE_MAX) return { ok: false, problema: "inscripcion_requisitos_largo" };
  if (input.until && (!/^\d{4}-\d{2}-\d{2}$/.test(input.until) || Number.isNaN(Date.parse(`${input.until}T00:00:00Z`)) || input.until < input.hoy || input.until > input.diaEvento)) return { ok: false, problema: "inscripcion_fecha_limite" };
  return { ok: true, value: { registrationNote: note || null, registrationUntil: input.until ? new Date(`${input.until}T00:00:00Z`) : null } };
}

/** Una fila de la lista del organizador, con lo que hace falta para filtrar y ordenar. */
export type FilaInscripcion = {
  id: string; status: RegistrationStatus; createdAt: Date; nombre: string; gimnasio: string | null; provincia: string | null;
  divisionId: string | null; weightClass: string | null; weightKg: number | null; combates: number; victorias: number; aura: number;
};

export const ORDENES = {
  fecha: "Fecha de la solicitud (primero las más antiguas)",
  aura: "Más aura primero",
  victorias: "Más victorias primero",
  combates: "Más combates primero",
  experiencia: "Menos combates primero",
  peso: "Peso declarado (de menos a más)",
  nombre: "Nombre (A-Z)",
} as const;
export type Orden = keyof typeof ORDENES;
export const parseOrden = (v: string | undefined): Orden => (v && Object.prototype.hasOwnProperty.call(ORDENES, v) ? (v as Orden) : "fecha");

export type FiltrosInscripcion = { estado?: RegistrationStatus | "TODAS"; weightClass?: string; divisionId?: string; provincia?: string; minCombates?: number; maxCombates?: number; texto?: string; orden?: Orden };

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Filtra y ordena las solicitudes de un evento. Por defecto, solo las pendientes y por orden de llegada. A igualdad, por nombre, para que
 * el orden sea siempre el mismo.
 */
export function filtrarYOrdenar<T extends FilaInscripcion>(filas: T[], f: FiltrosInscripcion): T[] {
  const estado = f.estado ?? "PENDING";
  const texto = f.texto ? sinTildes(f.texto.trim()) : "";
  const quedan = filas.filter((r) =>
    (estado === "TODAS" || r.status === estado) &&
    (!f.weightClass || r.weightClass === f.weightClass) &&
    (!f.divisionId || r.divisionId === f.divisionId) &&
    (!f.provincia || r.provincia === f.provincia) &&
    (f.minCombates === undefined || r.combates >= f.minCombates) &&
    (f.maxCombates === undefined || r.combates <= f.maxCombates) &&
    (!texto || sinTildes(`${r.nombre} ${r.gimnasio ?? ""}`).includes(texto)));
  const porNombre = (a: T, b: T) => a.nombre.localeCompare(b.nombre, "es") || a.id.localeCompare(b.id);
  const orden = f.orden ?? "fecha";
  const comparar: Record<Orden, (a: T, b: T) => number> = {
    fecha: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    aura: (a, b) => b.aura - a.aura,
    victorias: (a, b) => b.victorias - a.victorias,
    combates: (a, b) => b.combates - a.combates,
    experiencia: (a, b) => a.combates - b.combates,
    peso: (a, b) => (a.weightKg ?? Infinity) - (b.weightKg ?? Infinity),
    nombre: () => 0,
  };
  return [...quedan].sort((a, b) => comparar[orden](a, b) || porNombre(a, b));
}

export const puedeResponderInscripcion = (s: RegistrationStatus) => s === "PENDING" || s === "ACCEPTED" || s === "DECLINED";
export const puedeRetirarInscripcion = (s: RegistrationStatus) => s === "PENDING" || s === "ACCEPTED";
