import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "../../../../../lib/accounts/auth";
import { db } from "../../../../../lib/common/db";
import { profileAccess, profileKind } from "../../../../../lib/profiles/profiles";
import { saveProfile } from "../../../../actions/profiles";
import ProfileEditor from "../../../../components/ProfileEditor";
export const metadata = { title: "Personalizar perfil", robots: { index: false } };
export default async function Edit({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind: raw, id } = await params; const kind = profileKind(raw); if (!kind) notFound();
  const user = await requireVerifiedUser(); const { source, profile: p, editable } = await profileAccess(kind, id, user);
  if (!source) notFound(); if (!editable) redirect("/mi-cuenta?problema=sin_permiso");
  const owner = p?.ownerId ? await db.user.findUnique({ where: { id: p.ownerId }, select: { email: true } }) : null;
  return <><h1>Personalizar {source.name}</h1><p><Link href={source.href}>Volver al perfil público</Link></p>
    <form action={saveProfile} className="profile-form">
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="entityId" value={id} />
      <ProfileEditor kind={kind} id={id} avatarX={p?.avatarX ?? 50} avatarY={p?.avatarY ?? 50} bannerX={p?.bannerX ?? 50} bannerY={p?.bannerY ?? 50} version={p?.updatedAt.getTime()} />
      {kind !== "peleador" && <>
        {kind === "federacion" && <label className="field"><span>Nombre de la federación</span><input name="name" defaultValue={p?.name ?? source.name} required maxLength={150} /></label>}
        <label className="field"><span>Presentación</span><textarea name="bio" defaultValue={p?.bio ?? ""} maxLength={2000} rows={5} /></label>
        <label className="field"><span>Zona de actividad</span><input name="city" defaultValue={p?.city ?? ""} maxLength={100} /></label>
        <label className="field"><span>Web o página de contacto</span><input type="url" name="website" defaultValue={p?.website ?? ""} maxLength={500} /></label>
      </>}
      {user.role === "ADMIN" && (kind === "gimnasio" || kind === "entrenador" || kind === "federacion") && <label className="field"><span>Correo del titular autorizado (solo moderación)</span><input name="ownerEmail" type="email" defaultValue={owner?.email ?? ""} maxLength={200} /><span className="hint">Debe tener una cuenta con correo confirmado. Deja vacío para retirar el acceso; no cambia quién puede moderar.</span></label>}
      <button>Guardar perfil</button>
    </form></>;
}
