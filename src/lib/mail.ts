/**
 * Envío de correo. Sin proveedor configurado, el mensaje se escribe en el log del servidor
 * (suficiente en desarrollo). Para producción, implementar aquí el envío real (Resend, SES, SMTP…)
 * leyendo credenciales de variables de entorno; el resto de la app no cambia.
 */
export const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function sendMail(to: string, subject: string, text: string) {
  console.log(`[mail] to=${to} subject="${subject}"\n${text}\n[/mail]`);
}
