import { db } from "../../../../../lib/common/db";
import { getUser } from "../../../../../lib/accounts/auth";
import { profileKind, profileAccess } from "../../../../../lib/profiles/profiles";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string; slot: string }> }) {
  const { kind: raw, id, slot } = await params; const kind = profileKind(raw);
  if (!kind || id.length > 100 || !["avatar", "banner"].includes(slot)) return new Response(null, { status: 404 });
  const { source, editable } = await profileAccess(kind, id, await getUser());
  if (!source || (!source.visible && !editable)) return new Response(null, { status: 404 });
  const image = await db.profile.findUnique({ where: { kind_entityId: { kind, entityId: id } }, select: { avatar: true, banner: true } });
  const bytes = slot === "avatar" ? image?.avatar : image?.banner;
  if (!bytes) return new Response(null, { status: 204 });
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
