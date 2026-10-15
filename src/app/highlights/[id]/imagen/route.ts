import { db } from "../../../../lib/common/db";
import { getUser } from "../../../../lib/accounts/auth";
import { leerFoto } from "../../../../lib/media/fotos";

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
  const fila = await db.highlight.findUnique({ where: { id }, select: { image: true, imageKey: true } });
  const bytes = fila && await leerFoto({ clave: fila.imageKey, bytes: fila.image });
  if (!bytes) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(bytes), { headers: { ...CABECERAS, "Content-Type": "image/webp", ETag: etag } });
}
