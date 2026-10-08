import type { User } from "@prisma/client";
import { publicUserName } from "../common/names";
import { db } from "../common/db";
export const PROFILE_KINDS = ["peleador", "gimnasio", "entrenador", "promotor", "federacion"] as const;
export type ProfileKind = typeof PROFILE_KINDS[number];
export function profileKind(raw: string): ProfileKind | null {
  return PROFILE_KINDS.find(k => k === raw) ?? null;
}
export const profileSelect = { id: true, kind: true, entityId: true, ownerId: true, name: true, bio: true, city: true, website: true, hasAvatar: true, hasBanner: true, avatarX: true, avatarY: true, bannerX: true, bannerY: true, updatedAt: true } as const;
export async function profileSource(kind: ProfileKind, id: string) {
  if (kind === "peleador") {
    const f = await db.fighter.findUnique({ where: { id } });
    return f ? { name: `${f.firstName} ${f.lastName}`, href: `/peleadores/${f.slug}`, ownerId: f.userId, visible: f.listed && !f.hiddenAt } : null;
  }
  if (kind === "gimnasio") { const g = await db.gym.findUnique({ where: { id } }); return g ? { name: g.name, href: `/gimnasios/${g.slug}`, ownerId: null, visible: true } : null; }
  if (kind === "entrenador") { const t = await db.trainer.findUnique({ where: { id } }); return t ? { name: t.name, href: `/entrenadores/${t.slug}`, ownerId: t.userId, visible: true } : null; }
  if (kind === "promotor") {
    const u = await db.user.findUnique({ where: { id }, include: { organizerRequest: true } });
    return u?.role === "ORGANIZER" ? { name: u.organizerRequest?.orgName ?? publicUserName(u.name), href: `/promotores/${u.id}`, ownerId: u.id, visible: true } : null;
  }
  const p = await db.profile.findUnique({ where: { kind_entityId: { kind, entityId: id } }, select: profileSelect });
  return p ? { name: p.name ?? "Federación", href: `/federaciones/${id}`, ownerId: p.ownerId, visible: true } : null;
}
export function canEditProfile(user: Pick<User, "id" | "role"> | null, ownerId: string | null, assignedOwner: string | null) {
  return !!user && (user.role === "ADMIN" || ownerId === user.id || assignedOwner === user.id);
}
export async function profileAccess(kind: ProfileKind, id: string, user: Pick<User, "id" | "role"> | null) {
  const [source, profile] = await Promise.all([profileSource(kind, id), db.profile.findUnique({ where: { kind_entityId: { kind, entityId: id } }, select: profileSelect })]);
  return { source, profile, editable: !!source && canEditProfile(user, source.ownerId, kind === "peleador" || kind === "promotor" ? null : profile?.ownerId ?? null) };
}
