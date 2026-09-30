import { db } from "./db";

const DIA = 864e5;
/** Cuentas cuyo correo nunca se verificó se borran a los 30 días: no han podido publicar nada y así nadie retiene un correo ajeno. */
export const DIAS_CUENTA_SIN_VERIFICAR = 30;

/** Borra lo que ya no sirve: sesiones y enlaces caducados, intentos antiguos y cuentas sin verificar de hace más de 30 días. */
export async function purgeStale(now: Date = new Date()) {
  await db.$transaction([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.emailToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.rateHit.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 2 * DIA) } } }),
    db.user.deleteMany({ where: { emailVerifiedAt: null, fighter: null, createdAt: { lt: new Date(now.getTime() - DIAS_CUENTA_SIN_VERIFICAR * DIA) } } }),
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
