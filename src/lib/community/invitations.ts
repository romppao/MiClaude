import type { Discipline, InvitationKind, InvitationStatus } from "@prisma/client";
import { isDiscipline } from "../common/disciplines";

/**
 * Invitaciones a un peleador concreto (17 de octubre de 2026, petición del fundador: «promotores, federaciones, clubes y entrenadores no
 * pueden ponerse en contacto con peleadores […] tal vez busquemos un perfil en concreto para ofrecerle participar en nuestra velada, o un
 * entrenador busca sparring para sus peleadores»). Plan aprobado: propuesta **con aceptación**, sin chat. Quien invita es un organizador
 * aprobado (promotora, federación o club) o un entrenador, con el correo verificado; el peleador acepta o rechaza y **solo al aceptar**
 * se comparte el canal de contacto que él elija. Estas reglas son puras (sin base de datos) para poder probarlas una a una.
 */
export const INVITATION_KIND_LABEL: Record<InvitationKind, string> = { EVENT: "Participar en una velada", SPARRING: "Sparring", TRAIN: "Entrenar juntos" };
export const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = { PENDING: "Esperando respuesta", ACCEPTED: "Aceptada", DECLINED: "Rechazada", WITHDRAWN: "Retirada", EXPIRED: "Caducada" };
/** Invitaciones nuevas por persona y día. */
export const INVITATIONS_PER_DAY = 10;
/** Días que tiene el peleador para responder. */
export const INVITATION_DAYS_TO_ANSWER = 14;
/** Tras un rechazo, días hasta poder repetir el mismo tipo de invitación (a la misma velada, si es de velada). */
export const INVITATION_DAYS_BEFORE_REPEAT = 30;
export const INVITATION_MESSAGE_MAX = 500;
export const INVITATION_REPLY_MAX = 500;
/** Hasta resolver la decisión sobre menores (T-014), solo se invita a quien consta como mayor de edad. */
export const MIN_AGE_FOR_INVITATIONS = 18;
export const CONTACT_CHANNELS = ["EMAIL", "PHONE", "INSTAGRAM"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

const limpio = (s: string) => s.replace(/\s+/g, " ").trim();
export const parseInvitationKind = (v: string): InvitationKind | null => (v === "EVENT" || v === "SPARRING" || v === "TRAIN" ? v : null);

/** Edad cumplida en `hoy` («AAAA-MM-DD»); null si no consta la fecha de nacimiento. */
export function edadEn(nacimiento: Date | null | undefined, hoy: string): number | null {
  if (!nacimiento) return null;
  const n = nacimiento.toISOString().slice(0, 10);
  let edad = Number(hoy.slice(0, 4)) - Number(n.slice(0, 4));
  if (hoy.slice(5) < n.slice(5)) edad -= 1;
  return edad;
}

export type Remitente = { role: string; emailVerifiedAt: Date | null; invitacionesSuspendidas?: boolean };
export type Comprobacion = { ok: true } | { ok: false; problema: string };

/** Quién puede invitar: organizadores aprobados (el rol ORGANIZER solo lo da la aprobación) y entrenadores, con el correo verificado. */
export function puedeInvitar(u: Remitente): Comprobacion {
  if (!u.emailVerifiedAt) return { ok: false, problema: "invitacion_sin_correo" };
  if (u.role !== "ORGANIZER" && u.role !== "TRAINER") return { ok: false, problema: "invitacion_sin_permiso" };
  if (u.invitacionesSuspendidas) return { ok: false, problema: "invitacion_suspendida" };
  return { ok: true };
}

export type Destino = { listed: boolean; hiddenAt: Date | null; userId: string | null; acceptsInvitations: boolean; birthDate: Date | null };

/**
 * ¿Se puede invitar a esta ficha? Una ficha oculta no existe para quien invita; sin titular nadie podría responder; si el peleador cerró las
 * invitaciones, o no consta que sea mayor de edad, no se envía. «No disponible» no distingue el motivo para no dar pistas (tampoco el bloqueo).
 */
export function destinoDisponible(d: Destino, hoy: string): Comprobacion {
  if (!d.listed || d.hiddenAt) return { ok: false, problema: "no_existe" };
  if (!d.userId) return { ok: false, problema: "invitacion_sin_titular" };
  if (!d.acceptsInvitations) return { ok: false, problema: "invitacion_no_disponible" };
  const edad = edadEn(d.birthDate, hoy);
  if (edad === null || edad < MIN_AGE_FOR_INVITATIONS) return { ok: false, problema: "invitacion_no_disponible" };
  return { ok: true };
}

export type InvitationInput = { kind: string; discipline: string; message: string; disciplinasDelDestino: Discipline[]; disciplinasDelPropio?: Discipline[] };
export type InvitationParsed = { ok: true; value: { kind: InvitationKind; discipline: Discipline; message: string | null } } | { ok: false; problema: string };

/** Valida lo escrito: tipo, disciplina (de la ficha invitada y, en un sparring, también del peleador en cuyo nombre se propone) y mensaje. */
export function parseInvitation(input: InvitationInput): InvitationParsed {
  const kind = parseInvitationKind(input.kind);
  if (!kind) return { ok: false, problema: "invitacion_tipo" };
  if (!isDiscipline(input.discipline) || !input.disciplinasDelDestino.includes(input.discipline)) return { ok: false, problema: "invitacion_disciplina" };
  if (kind === "SPARRING" && !(input.disciplinasDelPropio ?? []).includes(input.discipline)) return { ok: false, problema: "invitacion_disciplina" };
  const message = limpio(input.message);
  if (message.length > INVITATION_MESSAGE_MAX) return { ok: false, problema: "texto_largo" };
  return { ok: true, value: { kind, discipline: input.discipline, message: message || null } };
}

export type VeladaInvitable = { organizerId: string | null; status: string; registrationOpen: boolean; date: Date; discipline: Discipline };

/** Una invitación a una velada: tiene que ser del que invita (o de moderación), estar programada, con inscripción abierta, y no haberse celebrado. */
export function veladaInvitable(ev: VeladaInvitable, quien: { id: string; role: string }, hoy: string): Comprobacion {
  if (ev.organizerId !== quien.id && quien.role !== "ADMIN") return { ok: false, problema: "invitacion_velada_ajena" };
  if (ev.status !== "SCHEDULED" || !ev.registrationOpen || ev.date.toISOString().slice(0, 10) < hoy) return { ok: false, problema: "invitacion_velada" };
  return { ok: true };
}

type DeInvitacion = { status: InvitationStatus; expiresAt: Date };
export const invitacionCaducada = (i: DeInvitacion, ahora: Date) => i.status === "PENDING" && i.expiresAt.getTime() <= ahora.getTime();
export const puedeResponderInvitacion = (i: DeInvitacion, ahora: Date) => i.status === "PENDING" && !invitacionCaducada(i, ahora);
export const puedeRetirarInvitacion = (i: DeInvitacion) => i.status === "PENDING";
export const caducaEn = (desde: Date) => new Date(desde.getTime() + INVITATION_DAYS_TO_ANSWER * 864e5);
/** Desde cuándo cuenta un rechazo para no repetir la misma invitación. */
export const desdeRepeticion = (ahora: Date) => new Date(ahora.getTime() - INVITATION_DAYS_BEFORE_REPEAT * 864e5);

/** Lo que se comparte con quien invitó al aceptar: solo el canal que eligió el peleador (si falta el dato elegido, el correo de la cuenta). */
export function contactoCompartido(canal: string, datos: { email: string; phone: string | null; instagram: string | null }): string {
  if (canal === "PHONE" && datos.phone) return `Teléfono: ${datos.phone}`;
  if (canal === "INSTAGRAM" && datos.instagram) return `Instagram: @${datos.instagram}`;
  return `Correo: ${datos.email}`;
}

export type AjustesDeContacto = { acceptsInvitations: boolean; contactChannel: ContactChannel; contactPhone: string | null; contactInstagram: string | null };
export type AjustesParsed = { ok: true; value: AjustesDeContacto } | { ok: false; problema: string };

/** Valida «Quién puede invitarme» y «Cómo me contactan al aceptar». El teléfono y el Instagram solo se piden si ese canal está elegido. */
export function parseAjustesDeContacto(input: { accepts: string; channel: string; phone: string; instagram: string }): AjustesParsed {
  const channel = (CONTACT_CHANNELS as readonly string[]).includes(input.channel) ? (input.channel as ContactChannel) : "EMAIL";
  const phone = input.phone.replace(/[\s.-]/g, "");
  const instagram = input.instagram.trim().replace(/^@/, "");
  if (channel === "PHONE" && !/^\+?[0-9]{9,15}$/.test(phone)) return { ok: false, problema: "contacto_telefono" };
  if (channel === "INSTAGRAM" && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) return { ok: false, problema: "contacto_instagram" };
  return { ok: true, value: { acceptsInvitations: input.accepts === "1", contactChannel: channel, contactPhone: channel === "PHONE" ? phone : null, contactInstagram: channel === "INSTAGRAM" ? instagram : null } };
}
