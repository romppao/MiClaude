import { db } from "../../../../lib/common/db";
import { nombreDeDescarga } from "../../../../lib/media/rules";

export const dynamic = "force-dynamic";

/** Foto que el público subió a una velada (guardada ya normalizada en WebP). ?descargar=1 la descarga. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.length > 40) return new Response(null, { status: 404 });
  const m = await db.mediaItem.findUnique({ where: { id }, select: { image: true, hiddenAt: true, event: { select: { slug: true } } } });
  if (!m?.image || m.hiddenAt) return new Response(null, { status: 404 });
  const descargar = new URL(request.url).searchParams.get("descargar") === "1";
  return new Response(new Uint8Array(m.image), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff", ...(descargar && { "Content-Disposition": `attachment; filename="${nombreDeDescarga(`${m.event.slug}-${id.slice(-6)}`, "webp")}"` }) },
  });
}
