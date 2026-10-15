import { isEmail, oneLine } from "./text";
import { registrarFallo } from "./fallos";
import { encolarYEnviar, type Prioridad } from "./cola-correo";
import { hayTransporte } from "./mail-transporte";

/**
 * Enviar un correo desde la aplicación. Todo correo pasa por la cola (cola-correo.ts, T-008): se guarda, se intenta entregar al momento y,
 * si el proveedor falla o se ha llegado al límite diario, se reintenta después sin que se pierda. La entrega en sí está en mail-transporte.ts.
 * Para usar otro proveedor (SES, SMTP…) basta con cambiar mail-transporte.ts; el resto de la aplicación no cambia.
 */
export const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/**
 * Devuelve true si el correo se ha entregado o queda en cola esperando cupo; false si no se pudo (dirección no válida, sin proveedor o fallo
 * del proveedor, que se reintentará). Nunca lanza. `prioridad: 0` para los correos de la cuenta (confirmar el correo, contraseña).
 */
export async function sendMail(to: string, subject: string, text: string, opts: { unsubscribeUrl?: string; replyTo?: string; prioridad?: Prioridad } = {}): Promise<boolean> {
  if (!isEmail(to)) {
    void registrarFallo({ origen: "CORREO", error: "Destinatario no válido: mensaje descartado" });
    return false;
  }
  if (!hayTransporte()) {
    void registrarFallo({ origen: "CORREO", error: process.env.RESEND_API_KEY ? "Falta MAIL_FROM (remitente) en la configuración: no se envía ningún correo" : `No hay proveedor de correo configurado (RESEND_API_KEY): no se envía «${oneLine(subject)}»` });
    return false;
  }
  try {
    return await encolarYEnviar({ to, subject: oneLine(subject), text, replyTo: opts.replyTo && isEmail(opts.replyTo) ? opts.replyTo : undefined, unsubscribeUrl: opts.unsubscribeUrl, prioridad: opts.prioridad });
  } catch (e) {
    await registrarFallo({ origen: "CORREO", contexto: "No se pudo guardar un correo en la cola", error: e });
    return false;
  }
}
