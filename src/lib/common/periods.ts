/** Plazo aprobado en G4: compartido por consultas deportivas y limpieza de cuentas sin acoplar sus dominios. */
export const FIGHTER_AVAILABILITY_DAYS = 60;

/** Avisos dentro de la app: conservación de doce meses según el encargo H1. */
export function notificationCutoff(now = new Date()) { const cutoff = new Date(now); cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1); return cutoff; }
