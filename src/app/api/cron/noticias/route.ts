import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { actualizarNoticias } from "../../../../lib/news/refresh";

export const dynamic = "force-dynamic";

function claveCorrecta(recibida: string | null, esperada: string): boolean {
  if (!recibida) return false;
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Endpoint de actualización automática 24/7 en la nube (cron sin coste).
 * Permite a GitHub Actions, n8n o un servicio externo activar la lectura de noticias
 * y extracción de miniaturas de YouTube y prensa sin necesidad de tener el PC encendido.
 * La clave va en la cabecera x-cron-secret (no en la URL, que acaba en los registros) y solo vale CRON_SECRET:
 * sin ella configurada el endpoint queda cerrado, nunca con una clave por defecto escrita en el repositorio público.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Actualización automática no configurada" }, { status: 503 });
  }
  if (!claveCorrecta(request.headers.get("x-cron-secret"), cronSecret)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const resultado = await actualizarNoticias({ forzar: true });
    return NextResponse.json({ ok: true, resultado, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[cron/noticias]", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar" }, { status: 500 });
  }
}
