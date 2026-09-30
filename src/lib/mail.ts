import { isEmail, oneLine } from "./text";

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
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const asunto = oneLine(subject);
  if (!isEmail(to)) {
    console.error("[mail] destinatario no válido, mensaje descartado");
    return false;
  }
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const from = process.env.MAIL_FROM;
    if (!from) {
      console.error("[mail] falta MAIL_FROM: no se envía el mensaje");
      return false;
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject: asunto, text }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) console.error(`[mail] el proveedor rechazó el mensaje «${asunto}» (código ${res.status})`);
      return res.ok;
    } catch (e) {
      console.error(`[mail] no se pudo contactar con el proveedor: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    }
  }
  if (logMode()) {
    console.log(`[mail] to=${to} subject="${asunto}"\n${text}\n[/mail]`);
    return true;
  }
  console.error(`[mail] no hay proveedor de correo configurado (RESEND_API_KEY): no se envía «${asunto}»`);
  return false;
}
