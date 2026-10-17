import { db } from "../../../../../lib/common/db";
import { getUser } from "../../../../../lib/accounts/auth";
import { profileKind, profileAccess } from "../../../../../lib/profiles/profiles";
import { leerFoto } from "../../../../../lib/media/fotos";
export const dynamic = "force-dynamic";
/** Siempre se revalida (`no-cache`, `private`): quien ya tiene la imagen recibe un 304 sin bytes, y una ficha ocultada deja de verse al instante. */
const CABECERAS = { "Cache-Control": "private, no-cache", "X-Content-Type-Options": "nosniff" };
export async function GET(request: Request, { params }: { params: Promise<{ kind: string; id: string; slot: string }> }) {
  const { kind: raw, id, slot } = await params; const kind = profileKind(raw);
  if (!kind || id.length > 100 || !["avatar", "banner"].includes(slot)) return new Response(null, { status: 404 });
  const { source, editable } = await profileAccess(kind, id, await getUser());
  if (!source || (!source.visible && !editable)) return new Response(null, { status: 404 });
  const where = { kind_entityId: { kind, entityId: id } };
  // Primero solo la versión (barato): si la persona ya tiene esa imagen, no se leen los bytes de la base de datos.
  const version = await db.profile.findUnique({ where, select: { updatedAt: true, hasAvatar: true, hasBanner: true } });
  if (!version || !(slot === "avatar" ? version.hasAvatar : version.hasBanner)) {
    // Un gimnasio sin logotipo propio enseña el que se encontró en su web (lib/common/logos-gimnasios.ts); el que suba él mismo siempre manda.
    if (slot === "avatar" && source.logo) return new Response(null, { status: 302, headers: { ...CABECERAS, Location: source.logo } });
    return new Response(null, { status: 204 });
  }
  const etag = `"${slot}-${version.updatedAt.getTime()}"`;
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ...CABECERAS, ETag: etag } });
  const image = await db.profile.findUnique({ where, select: { avatar: true, banner: true, avatarKey: true, bannerKey: true } });
  // Del almacén de fotos si tiene clave; si no, de la base (fotos anteriores al traslado: lib/media/fotos.ts).
  const bytes = image && await leerFoto(slot === "avatar" ? { clave: image.avatarKey, bytes: image.avatar } : { clave: image.bannerKey, bytes: image.banner });
  if (!bytes) return new Response(null, { status: 204 });
  return new Response(new Uint8Array(bytes), { headers: { ...CABECERAS, "Content-Type": "image/webp", ETag: etag } });
}
