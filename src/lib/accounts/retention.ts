import { db } from "../common/db";

const DIA = 864e5;
/** Cuentas cuyo correo nunca se verificó se borran a los 30 días: no han podido publicar nada y así nadie retiene un correo ajeno. */
export const DIAS_CUENTA_SIN_VERIFICAR = 30;

/**
 * Borra lo que ya no sirve: sesiones y enlaces caducados, intentos antiguos (2 días), cuentas sin verificar de hace más de 30 días,
 * solicitudes de ficha decididas (90 días desde que se decidieron), avisos resueltos (12 meses) e historial de cambios (3 años). Los plazos figuran en /privacidad.
 */
export async function purgeStale(now: Date = new Date()) {
  await db.$transaction([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.emailToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.rateHit.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 2 * DIA) } } }),
    // Solicitudes ya decididas: se borran a los 90 días (el texto con datos de comprobación se vacía al decidir).
    db.claimRequest.deleteMany({ where: { status: { not: "PENDING" }, OR: [{ reviewedAt: { lt: new Date(now.getTime() - 90 * DIA) } }, { reviewedAt: null, createdAt: { lt: new Date(now.getTime() - 90 * DIA) } }] } }),
    // Avisos ya resueltos: 12 meses. Historial de cambios: 3 años.
    db.report.deleteMany({ where: { status: { not: "OPEN" }, resolvedAt: { lt: new Date(now.getTime() - 365 * DIA) } } }),
    db.auditLog.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 3 * 365 * DIA) } } }),
    db.user.deleteMany({ where: { emailVerifiedAt: null, fighter: null, role: { in: ["FAN", "FIGHTER"] }, createdAt: { lt: new Date(now.getTime() - DIAS_CUENTA_SIN_VERIFICAR * DIA) } } }),
  ]);
}

let lastPurge = 0;
/** Ejecuta la limpieza como mucho una vez cada 30 minutos por proceso; nunca hace fallar la petición que la dispara. */
export async function maybePurge() {
  const now = Date.now();
  if (now - lastPurge < 30 * 60_000) return;
  lastPurge = now;
  try {
    await purgeStale();
  } catch (e) {
    console.error(`[limpieza] no se pudo completar: ${e instanceof Error ? e.message : String(e)}`);
  }
}
