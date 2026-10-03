import { db } from "../../lib/common/db";
import { profileSelect, type ProfileKind } from "../../lib/profiles/profiles";
export default async function ProfileDetails({ kind, id }: { kind: ProfileKind; id: string }) {
  const p = await db.profile.findUnique({ where: { kind_entityId: { kind, entityId: id } }, select: profileSelect });
  if (!p || !(p.bio || p.city || p.website)) return null;
  return <section className="card profile-extras"><h2>Sobre este perfil</h2>{p.bio && <p style={{whiteSpace:"pre-line"}}>{p.bio}</p>}{p.city && <p>Zona de actividad: {p.city}</p>}{p.website && <p><a href={p.website} rel="noopener noreferrer nofollow ugc">Web y contacto</a></p>}</section>;
}
