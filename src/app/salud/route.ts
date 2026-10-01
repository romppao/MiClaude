import { db } from "../../lib/common/db";

export const dynamic = "force-dynamic";

/** Comprobación de salud para el alojamiento: responde 200 si la aplicación y la base de datos funcionan, y 503 si no. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ estado: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ estado: "sin conexión con la base de datos" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
