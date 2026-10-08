import { db } from "../../../../lib/common/db";
import { getUser } from "../../../../lib/accounts/auth";
import { responderVideo } from "../../../../lib/media/storage";

export const dynamic = "force-dynamic";

/** Vídeo de un highlight subido a la aplicación. Solo si la ficha es pública (o es la propia) y el highlight no se ha retirado. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.length > 40) return new Response(null, { status: 404 });
  const h = await db.highlight.findUnique({ where: { id }, select: { videoKey: true, hiddenAt: true, fighter: { select: { listed: true, hiddenAt: true, userId: true } } } });
  if (!h?.videoKey || h.hiddenAt) return new Response(null, { status: 404 });
  if ((!h.fighter.listed || h.fighter.hiddenAt) && (!h.fighter.userId || (await getUser())?.id !== h.fighter.userId)) return new Response(null, { status: 404 });
  return responderVideo(h.videoKey, request.headers.get("range"));
}
