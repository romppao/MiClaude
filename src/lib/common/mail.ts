import { isEmail, oneLine } from "./text";
import { registrarFallo } from "./fallos";

/**
 * Envío de correo. Tres modos según el entorno:
 *  - RESEND_API_KEY (y MAIL_FROM): envío real mediante Resend (por HTTP, sin dependencias nuevas).
 *  - MAIL_TRANSPORT=log (o cualquier entorno que no sea producción): el mensaje se escribe en el log del servidor.
 *    Es lo que usan el desarrollo y las pruebas; en el log salen enlaces con tokens, por eso no es el modo de producción.
 *  - En producción sin ninguno de los dos: no se envía nada y se devuelve `false`, para que la pantalla lo diga con claridad.
 * Para usar otro proveedor (SES, SMTP…) basta con añadir aquí su envío; el resto de la aplicación no cambia.
 */
export const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

const logMode = () => process.env.MAIL_TRANSPORT === "log" || process.env.NODE_ENV !== "production";

/** Devuelve true si el mensaje se ha entregado al proveedor (o escrito en el log); false si no ha podido enviarse. Nunca lanza. */
export async function sendMail(to: string, subject: string, text: string, opts: { unsubscribeUrl?: string; replyTo?: string } = {}): Promise<boolean> {
  const asunto = oneLine(subject);
  if (!isEmail(to)) {
    void registrarFallo({ origen: "CORREO", error: "Destinatario no válido: mensaje descartado" });
    return false;
  }
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const from = process.env.MAIL_FROM;
    if (!from) {
      void registrarFallo({ origen: "CORREO", error: "Falta MAIL_FROM (remitente) en la configuración: no se envía ningún correo" });
      return false;
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject: asunto, text, ...(opts.replyTo && isEmail(opts.replyTo) && { reply_to: opts.replyTo }), ...(opts.unsubscribeUrl && { headers: { "List-Unsubscribe": `<${opts.unsubscribeUrl}>` } }) }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) void registrarFallo({ origen: "CORREO", error: `El proveedor de correo rechazó el mensaje «${asunto}» (código ${res.status})` });
      return res.ok;
    } catch (e) {
      void registrarFallo({ origen: "CORREO", contexto: "No se pudo contactar con el proveedor de correo", error: e });
      return false;
    }
  }
  if (logMode()) {
    console.log(`[mail] to=${to} subject="${asunto}"${opts.replyTo ? ` reply_to=${opts.replyTo}` : ""}\n${text}\n[/mail]`);
    return true;
  }
  void registrarFallo({ origen: "CORREO", error: `No hay proveedor de correo configurado (RESEND_API_KEY): no se envía «${asunto}»` });
  return false;
}
