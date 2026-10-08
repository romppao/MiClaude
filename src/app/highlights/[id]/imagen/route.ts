import { db } from "../../../../lib/common/db";
import { getUser } from "../../../../lib/accounts/auth";

export const dynamic = "force-dynamic";
const CABECERAS = { "Cache-Control": "private, no-cache", "X-Content-Type-Options": "nosniff" };

/** Foto de un highlight. Solo si la ficha es pública (o es la propia) y el highlight no se ha retirado. Revalida con ETag, como las fotos de perfil. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.length > 40) return new Response(null, { status: 404 });
  const h = await db.highlight.findUnique({ where: { id }, select: { hasImage: true, hiddenAt: true, createdAt: true, fighter: { select: { listed: true, hiddenAt: true, userId: true } } } });
  if (!h || h.hiddenAt || !h.hasImage) return new Response(null, { status: 404 });
  const publica = h.fighter.listed && !h.fighter.hiddenAt;
  if (!publica && (!h.fighter.userId || (await getUser())?.id !== h.fighter.userId)) return new Response(null, { status: 404 });
  const etag = `"hl-${id}-${h.createdAt.getTime()}"`;
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ...CABECERAS, ETag: etag } });
  const fila = await db.highlight.findUnique({ where: { id }, select: { image: true } });
  if (!fila?.image) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(fila.image), { headers: { ...CABECERAS, "Content-Type": "image/webp", ETag: etag } });
}
