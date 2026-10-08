import type { Discipline, ProposalKind, ProposalStatus } from "@prisma/client";
import { isDiscipline } from "../common/disciplines";

/**
 * Retos a combate y propuestas de sparring entre peleadores (propuesta n.º 1 del diseño v3, aprobada por el fundador el 7 de octubre de
 * 2026, y pedida de nuevo el 8 de octubre: «no encuentro la manera de retar a otros peleadores o solicitar sparring»).
 * Un peleador con ficha propone; el otro acepta o rechaza con un mensaje. Aceptar **no crea un combate**: para que cuente en el récord se
 * registra cuando se celebra (o lo pone un organizador en su cartel). Ring España no organiza ni supervisa los sparrings.
 */
export const PROPOSAL_KIND_LABEL: Record<ProposalKind, string> = { FIGHT: "Reto a combate", SPARRING: "Sparring" };
export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = { PENDING: "Esperando respuesta", ACCEPTED: "Aceptada", DECLINED: "Rechazada", CANCELLED: "Cancelada" };
export const PROPOSAL_PLACE_MAX = 100;
export const PROPOSAL_MESSAGE_MAX = 500;
export const PROPOSAL_REPLY_MAX = 500;
/** Propuestas nuevas por peleador y día. */
export const PROPOSALS_PER_DAY = 10;
/** Hasta cuántos días por delante se puede proponer una fecha. */
export const PROPOSAL_DAYS_AHEAD = 365;

const limpio = (s: string) => s.replace(/\s+/g, " ").trim();
export const parseProposalKind = (v: string): ProposalKind | null => (v === "FIGHT" || v === "SPARRING" ? v : null);

export type ProposalInput = { kind: string; discipline: string; day: string; place: string; message: string; today: string; disciplinasDelRival: Discipline[] };
export type ProposalParsed =
  | { ok: true; value: { kind: ProposalKind; discipline: Discipline; day: Date | null; place: string | null; message: string | null } }
  | { ok: false; problema: string };

/** Valida una propuesta. La disciplina tiene que ser una de las del rival; la fecha, si se pone, de hoy a un año. */
export function parseProposal(input: ProposalInput): ProposalParsed {
  const kind = parseProposalKind(input.kind);
  if (!kind) return { ok: false, problema: "propuesta_tipo" };
  if (!isDiscipline(input.discipline) || !input.disciplinasDelRival.includes(input.discipline)) return { ok: false, problema: "propuesta_disciplina" };
  let day: Date | null = null;
  if (input.day) {
    const limite = new Date(Date.parse(`${input.today}T00:00:00Z`) + PROPOSAL_DAYS_AHEAD * 864e5).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.day) || Number.isNaN(Date.parse(`${input.day}T00:00:00Z`)) || input.day < input.today || input.day > limite) return { ok: false, problema: "propuesta_dia" };
    day = new Date(`${input.day}T00:00:00Z`);
  }
  const place = limpio(input.place);
  if (place.length > PROPOSAL_PLACE_MAX) return { ok: false, problema: "propuesta_lugar_largo" };
  const message = limpio(input.message);
  if (message.length > PROPOSAL_MESSAGE_MAX) return { ok: false, problema: "propuesta_mensaje_largo" };
  return { ok: true, value: { kind, discipline: input.discipline, day, place: place || null, message: message || null } };
}

export const puedeResponderPropuesta = (status: ProposalStatus) => status === "PENDING";
export const puedeCancelarPropuesta = (status: ProposalStatus) => status === "PENDING" || status === "ACCEPTED";
