import { randomInt } from "node:crypto";
import type { Prisma, TicketStatus } from "@prisma/client";
import { db } from "../common/db";
import { dayKey } from "../common/dates";

/**
 * Entradas de las veladas reservadas en Lona (petición del fundador, 15 de octubre de 2026: «quiero que se puedan comprar entradas…
 * para evitar las malas reservas… se deberá pagar la mitad vía Bizum para reservar»).
 *
 * - La promotora fija el precio, el aforo y su número de Bizum. Lona no cobra ni guarda dinero: solo lleva la cuenta de las reservas.
 * - Al reservar se pide una **señal del 50 %** (redondeada al euro, hacia arriba) por Bizum, con el código de la reserva como concepto.
 *   El resto se paga en la puerta.
 * - La señal se envía en **24 horas**, y nunca después de 3 horas antes de que empiece la velada. Si no llega a tiempo, la reserva caduca
 *   y libera las plazas. La promotora puede confirmarla aunque haya caducado, si el Bizum le llegó tarde y aún hay sitio.
 * - Una reserva activa por persona y velada, de 1 a 6 entradas.
 */

export const MAX_ENTRADAS = 6;
export const HORAS_PARA_SENAL = 24;
/** Las reservas se cierran 3 horas antes del inicio: la promotora necesita tiempo para cuadrar la lista de la puerta. */
export const HORAS_CIERRE_ANTES = 3;
/** Hora que se supone si la promotora no la ha puesto (las veladas suelen empezar por la tarde). */
export const HORA_POR_DEFECTO = 20 * 60;

/** Estados que ocupan plaza. Una reserva pendiente ya vencida no cuenta aunque nadie la haya marcado como caducada todavía. */
export const OCUPAN_PLAZA: TicketStatus[] = ["PENDING_DEPOSIT", "CONFIRMED", "CHECKED_IN"];

export const ESTADO_ENTRADA: Record<TicketStatus, string> = {
  PENDING_DEPOSIT: "Pendiente de señal",
  CONFIRMED: "Confirmada",
  CHECKED_IN: "Validada en la puerta",
  CANCELLED: "Cancelada",
  EXPIRED: "Caducada",
};

export const senal = (totalEuros: number) => Math.ceil(totalEuros / 2);

/** «20:30» → minutos desde las 00:00, o null si no es una hora válida. */
export function parseHora(raw: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(raw.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export const fmtHora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

/** Momento de inicio de la velada (su día a la hora indicada, en hora peninsular, con el cambio de horario incluido). */
export function inicioDeVelada(fecha: Date, startMinute: number | null | undefined): Date {
  const minutos = startMinute ?? HORA_POR_DEFECTO;
  const local = Date.parse(`${dayKey(fecha)}T00:00:00Z`) + minutos * 60_000;
  // Diferencia de Madrid con UTC en ese instante aproximado (1 o 2 horas).
  const partes = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(local));
  const h = Number(partes.find((p) => p.type === "hour")?.value), min = Number(partes.find((p) => p.type === "minute")?.value);
  const desfase = ((h * 60 + min - (minutos % 1440)) + 1440) % 1440;
  return new Date(local - desfase * 60_000);
}

/** Último momento para reservar (3 horas antes del inicio). */
export const cierreDeReservas = (fecha: Date, startMinute: number | null | undefined) => new Date(inicioDeVelada(fecha, startMinute).getTime() - HORAS_CIERRE_ANTES * 3_600_000);

/** Plazo para enviar la señal: 24 horas o, si llega antes, el cierre de reservas. */
export function plazoDeSenal(ahora: Date, fecha: Date, startMinute: number | null | undefined): Date {
  return new Date(Math.min(ahora.getTime() + HORAS_PARA_SENAL * 3_600_000, cierreDeReservas(fecha, startMinute).getTime()));
}

/** Número de Bizum de la promotora: un móvil español (6 o 7 y ocho cifras más), con o sin +34. Devuelve las 9 cifras o null. */
export function parseBizum(raw: string): string | null {
  const cifras = raw.replace(/[\s.-]/g, "").replace(/^(\+34|0034)/, "");
  return /^[67]\d{8}$/.test(cifras) ? cifras : null;
}

export const fmtBizum = (cifras: string) => `${cifras.slice(0, 3)} ${cifras.slice(3, 6)} ${cifras.slice(6)}`;

/** Código corto para el concepto del Bizum y para la puerta. Sin letras que se confundan (0/O, 1/I/L). */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const nuevoCodigo = () => `LONA-${Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("")}`;

type Cliente = Prisma.TransactionClient | typeof db;

/** Marca como caducadas las reservas pendientes cuyo plazo ha pasado (de una velada o de todas). */
export function caducarVencidas(cliente: Cliente = db, eventId?: string, ahora = new Date()) {
  return cliente.ticketReservation.updateMany({ where: { status: "PENDING_DEPOSIT", depositUntil: { lt: ahora }, ...(eventId && { eventId }) }, data: { status: "EXPIRED" } });
}

/** Entradas que ocupan plaza en una velada. */
export async function plazasOcupadas(cliente: Cliente, eventId: string, ahora = new Date()): Promise<number> {
  const r = await cliente.ticketReservation.aggregate({
    where: { eventId, OR: [{ status: { in: ["CONFIRMED", "CHECKED_IN"] } }, { status: "PENDING_DEPOSIT", depositUntil: { gte: ahora } }] },
    _sum: { quantity: true },
  });
  return r._sum.quantity ?? 0;
}

type VeladaConEntradas = { status: string; date: Date; startMinute: number | null; ticketsOpen: boolean; ticketPriceEuros: number | null; bizumPhone: string | null };

/** Por qué no se puede reservar ahora (código de PROBLEMAS) o null si se puede. */
export function motivoSinReserva(e: VeladaConEntradas, ahora = new Date()): string | null {
  if (e.status !== "SCHEDULED") return "entradas_no_disponibles";
  if (!e.ticketsOpen || !e.ticketPriceEuros || !e.bizumPhone) return "entradas_no_disponibles";
  if (ahora >= cierreDeReservas(e.date, e.startMinute)) return "entradas_cerradas";
  return null;
}
