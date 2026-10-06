import { db } from "../../../../../lib/common/db";
import { getUser } from "../../../../../lib/accounts/auth";
import { profileKind, profileAccess } from "../../../../../lib/profiles/profiles";
import { getImageStore } from "../../../../../lib/common/imageStore";
import { imageKey } from "../../../../../lib/common/imageKeys";
export const dynamic = "force-dynamic";
const BASE = { "X-Content-Type-Options": "nosniff" };
/** Imagen de una ficha visible pedida con su versión actual (`?v=`): el contenido de esa URL nunca cambia, así que puede guardarse un año. */
const PUBLICA = { ...BASE, "Cache-Control": "public, max-age=31536000, immutable" };
/** Ficha visible pero sin versión (o con una antigua): siempre se revalida; quien ya tiene la imagen recibe un 304 sin bytes. */
const REVALIDA = { ...BASE, "Cache-Control": "private, no-cache" };
/** Ficha oculta (solo la ve su titular o moderación): nunca se guarda en caché. */
const OCULTA = { ...BASE, "Cache-Control": "private, no-store" };
export async function GET(request: Request, { params }: { params: Promise<{ kind: string; id: string; slot: string }> }) {
  const { kind: raw, id, slot } = await params; const kind = profileKind(raw);
  if (!kind || id.length > 100 || (slot !== "avatar" && slot !== "banner")) return new Response(null, { status: 404 });
  const { source, editable } = await profileAccess(kind, id, await getUser());
  if (!source || (!source.visible && !editable)) return new Response(null, { status: 404 });
  // Primero solo la versión (barato): si la persona ya tiene esa imagen, no se leen los bytes.
  const version = await db.profile.findUnique({ where: { kind_entityId: { kind, entityId: id } }, select: { updatedAt: true, hasAvatar: true, hasBanner: true } });
  if (!version || !(slot === "avatar" ? version.hasAvatar : version.hasBanner)) return new Response(null, { status: 204 });
  const marca = String(version.updatedAt.getTime());
  const etag = `"${slot}-${marca}"`;
  const versionada = new URL(request.url).searchParams.get("v") === marca;
  const cabeceras = !source.visible ? OCULTA : versionada ? PUBLICA : REVALIDA;
  if (source.visible && request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ...cabeceras, ETag: etag } });
  const image = await getImageStore().get(imageKey(kind, id, slot));
  if (!image) return new Response(null, { status: 204 });
  return new Response(new Uint8Array(image.bytes), { headers: { ...cabeceras, "Content-Type": image.contentType, ...(source.visible && { ETag: etag }) } });
}
