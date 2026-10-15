import { db } from "./db";
import { entregarCorreo, hayTransporte, logMode } from "./mail-transporte";
import { registrarFallo } from "./fallos";

/**
 * Cola de correos (T-008). Cada correo se guarda en `EmailOutbox` antes de entregarse, y se entrega desde ahí:
 *  - **Nada se pierde:** si el proveedor falla, el correo queda pendiente y se reintenta (1 min, 5 min, 30 min, 2 h y 12 h; tras 6 intentos
 *    queda como fallido y se apunta en «Fallos»).
 *  - **Límite diario:** el plan gratuito de Resend admite 100 correos al día (`MAIL_LIMITE_DIARIO`). Al llegar, los correos esperan al día
 *    siguiente. Los de la cuenta (confirmar el correo, contraseña) pasan antes y tienen reservados los últimos `RESERVA_CUENTA` del cupo:
 *    un día con muchos avisos de combates nunca impide que alguien confirme su cuenta.
 *  - **Sin duplicados:** cada correo se «reserva» (PENDING → SENDING) con una actualización atómica antes de entregarlo, así dos procesos a la
 *    vez no lo envían dos veces.
 * La cola se vacía al enviar cualquier correo nuevo y con la tarea programada de las noticias (cada 6 horas; /api/cron/noticias).
 */
export const LIMITE_DIARIO_POR_DEFECTO = 100;
export const RESERVA_CUENTA = 10;
export const MAX_INTENTOS = 6;
const ESPERAS_MIN = [1, 5, 30, 120, 720];
const HORA = 3600_000;

/** Prioridad de un correo: 0 los de la cuenta (confirmar el correo, contraseña), 1 el resto. */
export type Prioridad = 0 | 1;

/** Minutos de espera antes del siguiente intento, según cuántos van. */
export const esperaTras = (intentos: number) => ESPERAS_MIN[Math.min(Math.max(intentos, 1), ESPERAS_MIN.length) - 1];

/** Cupo diario del proveedor; sin límite en el modo registro (desarrollo y pruebas). */
export function limiteDiario(env: NodeJS.ProcessEnv = process.env): number {
  if (!env.RESEND_API_KEY) return Infinity;
  const n = Number.parseInt(env.MAIL_LIMITE_DIARIO ?? "", 10);
  return Number.isInteger(n) && n > 0 ? n : LIMITE_DIARIO_POR_DEFECTO;
}

/** ¿Cabe un correo más hoy? Los de prioridad 1 dejan libres los últimos RESERVA_CUENTA para los de la cuenta. */
export const cabeHoy = (enviadosHoy: number, limite: number, prioridad: number) => enviadosHoy < (prioridad === 0 ? limite : limite - Math.min(RESERVA_CUENTA, Math.floor(limite / 2)));

export type CorreoNuevo = { to: string; subject: string; text: string; replyTo?: string; unsubscribeUrl?: string; prioridad?: Prioridad };

/** Guarda el correo en la cola y lo intenta entregar ya. Devuelve true si se ha entregado o está en cola esperando cupo; false si falló. */
export async function encolarYEnviar(c: CorreoNuevo): Promise<boolean> {
  const fila = await db.emailOutbox.create({ data: { to: c.to, subject: c.subject, body: c.text, replyTo: c.replyTo ?? null, unsubscribeUrl: c.unsubscribeUrl ?? null, priority: c.prioridad ?? 1 } });
  const resultado = await enviarDeLaCola(fila.id);
  // De paso, se reintentan unos pocos pendientes (sin esperar: la persona no debe notarlo).
  void procesarCola(5).catch(() => undefined);
  return resultado !== "fallo";
}

/** Entrega un correo de la cola si sigue pendiente. «en_cola» si espera cupo; «ocupado» si otro proceso lo tiene. */
export async function enviarDeLaCola(id: string, ahora = new Date()): Promise<"enviado" | "en_cola" | "fallo" | "ocupado"> {
  // nextAttemptAt pasa a ser «cuándo se reservó»: así un correo que esperaba desde hace horas no parece abandonado a mitad de envío.
  const reservado = await db.emailOutbox.updateMany({ where: { id, status: "PENDING" }, data: { status: "SENDING", nextAttemptAt: ahora } });
  if (!reservado.count) return "ocupado";
  const c = await db.emailOutbox.findUniqueOrThrow({ where: { id } });
  const limite = limiteDiario();
  if (Number.isFinite(limite)) {
    const enviadosHoy = await db.emailOutbox.count({ where: { status: "SENT", sentAt: { gt: new Date(ahora.getTime() - 24 * HORA) } } });
    if (!cabeHoy(enviadosHoy, limite, c.priority)) {
      await db.emailOutbox.update({ where: { id }, data: { status: "PENDING", nextAttemptAt: new Date(ahora.getTime() + HORA) } });
      return "en_cola";
    }
  }
  const ok = hayTransporte() && await entregarCorreo(c.to, c.subject, c.body, { replyTo: c.replyTo ?? undefined, unsubscribeUrl: c.unsubscribeUrl ?? undefined });
  if (ok) {
    // El cuerpo puede llevar un enlace de un solo uso (confirmar el correo, contraseña): una vez entregado, no se guarda.
    await db.emailOutbox.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), body: "", attempts: c.attempts + 1, lastError: null } });
    return "enviado";
  }
  const intentos = c.attempts + 1;
  const agotado = intentos >= MAX_INTENTOS;
  await db.emailOutbox.update({ where: { id }, data: { status: agotado ? "FAILED" : "PENDING", attempts: intentos, nextAttemptAt: new Date(ahora.getTime() + esperaTras(intentos) * 60_000), lastError: hayTransporte() ? "El proveedor no aceptó el correo" : "No hay proveedor de correo configurado", ...(agotado ? { body: "" } : {}) } });
  if (agotado) await registrarFallo({ origen: "CORREO", error: `Un correo no se pudo entregar tras ${MAX_INTENTOS} intentos («${c.subject}»)` });
  return "fallo";
}

/** Reintenta los correos pendientes cuyo turno ha llegado, primero los de la cuenta. Devuelve cuántos se entregaron. */
export async function procesarCola(max = 20): Promise<{ enviados: number; pendientes: number }> {
  // Un proceso que murió a mitad de envío deja correos «SENDING»: tras 10 minutos vuelven a la cola.
  await db.emailOutbox.updateMany({ where: { status: "SENDING", nextAttemptAt: { lt: new Date(Date.now() - 10 * 60_000) } }, data: { status: "PENDING" } });
  const turno = await db.emailOutbox.findMany({ where: { status: "PENDING", nextAttemptAt: { lte: new Date() } }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }], take: max, select: { id: true } });
  let enviados = 0;
  for (const { id } of turno) {
    const r = await enviarDeLaCola(id);
    if (r === "enviado") enviados++;
    if (r === "en_cola") break; // sin cupo hoy: los demás también esperarían
  }
  return { enviados, pendientes: await db.emailOutbox.count({ where: { status: "PENDING" } }) };
}

/** Recuento para /salud y moderación: solo números, nunca direcciones. */
export async function estadoDeLaCola() {
  const [pendientes, fallidos] = await Promise.all([db.emailOutbox.count({ where: { status: { in: ["PENDING", "SENDING"] } } }), db.emailOutbox.count({ where: { status: "FAILED" } })]);
  return { pendientes, fallidos, modo: logMode() && !process.env.RESEND_API_KEY ? "registro" : "proveedor" };
}
