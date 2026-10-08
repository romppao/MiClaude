/**
 * Comprobación del entorno al arrancar el servidor en producción: si falta algo imprescindible, el servidor
 * no arranca (mejor un fallo claro al desplegar que enlaces rotos o correos que no salen semanas después).
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (env.NODE_ENV !== "production") return { errors, warnings };

  if (!env.DATABASE_URL) errors.push("Falta DATABASE_URL (dirección de la base de datos PostgreSQL).");
  if (!env.APP_URL) errors.push("Falta APP_URL (dirección pública de la web, por ejemplo https://ringespana.es): los enlaces de los correos apuntarían a localhost.");
  else if (!/^https?:\/\/[^/\s]+\/?$/.test(env.APP_URL)) errors.push("APP_URL debe ser solo la dirección de la web (por ejemplo https://ringespana.es): empieza por http:// o https://, sin espacios ni saltos de línea y sin ruta.");
  else if (!env.APP_URL.startsWith("https://") && !/^http:\/\/localhost(:\d+)?/.test(env.APP_URL)) warnings.push("APP_URL no usa https: las cuentas y las sesiones deberían servirse siempre por una conexión cifrada.");

  if (env.RESEND_API_KEY) {
    if (!env.MAIL_FROM) errors.push("Con RESEND_API_KEY hace falta también MAIL_FROM (remitente de los correos).");
  } else if (env.MAIL_TRANSPORT !== "log") {
    warnings.push("No hay proveedor de correo (RESEND_API_KEY): no se enviará ningún correo de verificación ni de recuperación de contraseña. Para pruebas, use MAIL_TRANSPORT=log.");
  }
  const r2 = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"].filter((k) => !!env[k]);
  if (r2.length > 0 && r2.length < 4) errors.push("La configuración del almacén de vídeos está incompleta: hacen falta R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_BUCKET (ver docs/VIDEOS.md).");
  if (!env.CREADOR_CORREO?.trim()) warnings.push("No hay cuenta del creador (CREADOR_CORREO): nadie puede gestionar cuentas ni moderadores desde la aplicación (ver docs/CREADOR.md).");
  if (r2.length === 0 && !env.MEDIA_DIR && env.DEMO_MODE !== "si") warnings.push("No hay almacén de vídeos (R2_*): los vídeos solo se podrán compartir con un enlace (ver docs/VIDEOS.md).");
  if (!env.CONTACT_EMAIL) warnings.push("Falta CONTACT_EMAIL: la página de privacidad no indica ningún contacto para ejercer los derechos sobre los datos (y RESPONSABLE_NOMBRE, el responsable del tratamiento).");
  return { errors, warnings };
}
