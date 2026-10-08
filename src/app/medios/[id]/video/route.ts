import { db } from "../../../../lib/common/db";
import { responderVideo, TIPOS_DE_VIDEO, tipoDeClave } from "../../../../lib/media/storage";
import { nombreDeDescarga } from "../../../../lib/media/rules";

export const dynamic = "force-dynamic";

/** Vídeo que el público subió a una velada. ?descargar=1 lo descarga (para que el peleador lo guarde). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.length > 40) return new Response(null, { status: 404 });
  const m = await db.mediaItem.findUnique({ where: { id }, select: { videoKey: true, hiddenAt: true, event: { select: { slug: true } } } });
  if (!m?.videoKey || m.hiddenAt) return new Response(null, { status: 404 });
  const descargar = new URL(request.url).searchParams.get("descargar") === "1";
  return responderVideo(m.videoKey, request.headers.get("range"), descargar ? nombreDeDescarga(`${m.event.slug}-${id.slice(-6)}`, TIPOS_DE_VIDEO[tipoDeClave(m.videoKey)]) : undefined);
}
