import Link from "next/link";
import { getUser } from "../../lib/accounts/auth";
import { profileAccess, type ProfileKind } from "../../lib/profiles/profiles";

export default async function ProfileHeader({ kind, id, name, subtitle, children, visible = true }: { kind: ProfileKind; id: string; name: string; subtitle?: string; children?: React.ReactNode; visible?: boolean }) {
  const user = await getUser();
  const { source, profile, editable } = await profileAccess(kind, id, user);
  const query = profile ? `?v=${profile.updatedAt.getTime()}` : "";
  const position = (x: number, y: number) => `${x}% ${y}%`;
  // Gimnasios: el banner propio manda. Sin él, su imagen de perfil o el logo hallado
  // tiene un espacio completo, sin recortes ni texto encima; no se inventa una marca.
  const logoDeBanner = visible && kind === "gimnasio" && !profile?.hasBanner
    ? profile?.hasAvatar ? `/imagenes/${kind}/${id}/avatar${query}` : source?.logo
    : null;
  const banner = profile?.hasBanner ? `/imagenes/${kind}/${id}/banner${query}` : logoDeBanner;
  return <section className={`profile-hero${logoDeBanner ? " profile-hero-logo" : ""}`}>
    {visible && banner && <img className={`profile-banner${logoDeBanner ? " profile-banner-logo" : ""}`} src={banner} alt="" style={profile?.hasBanner ? { objectPosition: position(profile.bannerX, profile.bannerY) } : undefined} />}
    <div className="profile-shade" />
    <div className="profile-identity">
      <div className="profile-avatar">
        <span aria-hidden="true">{name.split(/\s+/).map(w => w[0]).slice(0, 2).join("")}</span>
        {visible && (profile?.hasAvatar || source?.logo) && <img className={!profile?.hasAvatar && source?.logo ? "profile-avatar-logo" : undefined} src={`/imagenes/${kind}/${id}/avatar${query}`} alt={`Foto o logotipo de ${name}`} style={profile?.hasAvatar ? { objectPosition: position(profile.avatarX, profile.avatarY) } : undefined} />}
      </div>
      <div className="profile-heading"><h1>{name}</h1>{subtitle && <p>{subtitle}</p>}{children}</div>
    </div>
    {editable && <Link className="btn profile-edit" href={`/perfiles/${kind}/${id}/editar`}>Editar foto y banner</Link>}
  </section>;
}
