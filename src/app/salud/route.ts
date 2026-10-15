import { db } from "../../lib/common/db";
import { VERSION } from "../../lib/common/version";
import { estadoDeLaCola } from "../../lib/common/cola-correo";

export const dynamic = "force-dynamic";

/** Comprobación de salud para el alojamiento: responde 200 si la aplicación y la base de datos funcionan, y 503 si no. */
export async function GET() {
  try {
    const inicio = Date.now();
    await db.$queryRaw`SELECT 1`;
    const baseDeDatosMs = Date.now() - inicio;
    // Cola de correos (T-008): solo cuántos esperan y cuántos fallaron, nunca a quién.
    const correos = await estadoDeLaCola().catch(() => null);
    return Response.json({ estado: "ok", version: VERSION, baseDeDatosMs, correos, avisosDeFallos: process.env.SENTRY_DSN ? "activados" : "sin configurar" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ estado: "sin conexión con la base de datos" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
