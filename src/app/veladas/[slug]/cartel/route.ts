import { db } from "../../../../lib/common/db";
import { leerFoto } from "../../../../lib/media/fotos";

export const dynamic = "force-dynamic";

/** Cartel de una velada (WebP ya normalizado). Solo el de las veladas visibles: las pendientes de autorizar o rechazadas no se sirven. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug.length > 120) return new Response(null, { status: 404 });
  const e = await db.event.findUnique({ where: { slug }, select: { status: true, posterAt: true, posterKey: true, posterBytes: { select: { bytes: true } } } });
  if (!e || !e.posterAt || ["PENDING_AUTHORIZATION", "REJECTED"].includes(e.status)) return new Response(null, { status: 404 });
  const bytes = await leerFoto({ clave: e.posterKey, bytes: e.posterBytes?.bytes ?? null });
  if (!bytes) return new Response(null, { status: 404 });
  // Con la versión en la dirección (?v=, ver urlCartel) se puede guardar mucho tiempo; sin ella, poco, por si cambia.
  const versionada = new URL(request.url).searchParams.has("v");
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "image/webp", "Cache-Control": versionada ? "public, max-age=31536000, immutable" : "public, max-age=300", "X-Content-Type-Options": "nosniff" },
  });
}
