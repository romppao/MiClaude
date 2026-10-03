import Link from "next/link";
import { getUser } from "../../lib/accounts/auth";
import { profileAccess, type ProfileKind } from "../../lib/profiles/profiles";

export default async function ProfileHeader({ kind, id, name, subtitle, children, visible = true }: { kind: ProfileKind; id: string; name: string; subtitle?: string; children?: React.ReactNode; visible?: boolean }) {
  const user = await getUser();
  const { profile, editable } = await profileAccess(kind, id, user);
  const query = profile ? `?v=${profile.updatedAt.getTime()}` : "";
  const position = (x: number, y: number) => `${x}% ${y}%`;
  return <section className="profile-hero">
    {visible && profile?.hasBanner && <img className="profile-banner" src={`/imagenes/${kind}/${id}/banner${query}`} alt="" style={{ objectPosition: position(profile.bannerX, profile.bannerY) }} />}
    <div className="profile-shade" />
    <div className="profile-identity">
      <div className="profile-avatar">
        <span aria-hidden="true">{name.split(/\s+/).map(w => w[0]).slice(0, 2).join("")}</span>
        {visible && profile?.hasAvatar && <img src={`/imagenes/${kind}/${id}/avatar${query}`} alt={`Foto o logotipo de ${name}`} style={{ objectPosition: position(profile.avatarX, profile.avatarY) }} />}
      </div>
      <div className="profile-heading"><h1>{name}</h1>{subtitle && <p>{subtitle}</p>}{children}</div>
    </div>
    {editable && <Link className="btn profile-edit" href={`/perfiles/${kind}/${id}/editar`}>Editar foto y banner</Link>}
  </section>;
}
