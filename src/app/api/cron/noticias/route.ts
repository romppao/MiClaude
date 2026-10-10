import { NextResponse } from "next/server";
import { actualizarNoticias } from "../../../../lib/news/refresh";

export const dynamic = "force-dynamic";

/**
 * Endpoint de actualización automática 24/7 en la nube (cron sin coste).
 * Permite a GitHub Actions, n8n o un servicio externo activar la lectura de noticias
 * y extracción de miniaturas de YouTube y prensa sin necesidad de tener el PC encendido.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") ?? request.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET ?? "ring-cron-actualizar-2026";

  if (secret !== cronSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const resultado = await actualizarNoticias({ forzar: true });
    return NextResponse.json({ ok: true, resultado, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al actualizar" },
      { status: 500 },
    );
  }
}
