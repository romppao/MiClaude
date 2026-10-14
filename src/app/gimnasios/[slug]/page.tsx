import { publicGyms } from "../../../lib/common/gym-directory";
import { createReport } from "../../actions/community";
import ProfileThumbnail from "../../components/ProfileThumbnail";
import ProfileHeader from "../../components/ProfileHeader";
import ProfileDetails from "../../components/ProfileDetails";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/common/db";
import { DISCIPLINE_LABEL } from "../../../lib/common/disciplines";
import { LEVEL_LABEL } from "../../../lib/common/labels";
import { puntoDeGimnasio } from "../../../lib/common/mapa";
import DondeEsta from "../../components/DondeEsta";

export const dynamic = "force-dynamic";

const getGym = cache((slug: string) => db.gym.findFirst({ where: { AND: [publicGyms(), { slug }] }, include: { fighters: { where: { listed: true, hiddenAt: null }, orderBy: { lastName: "asc" }, include: { disciplines: true } }, trainers: true } }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const gym = await getGym((await params).slug);
  if (!gym) return { title: "Gimnasio no encontrado" };
  return { title: gym.name, description: `${gym.name}, gimnasio de deportes de contacto en ${gym.city} (${gym.province}): entrenadores y peleadores en Lona.` };
}

export default async function GymPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gym = await getGym(slug);
  if (!gym) notFound();
  return (
    <>
      <ProfileHeader kind="gimnasio" id={gym.id} name={gym.name} subtitle={[gym.city,gym.province].join(" · ")}>{gym.verifiedAt && <span className="tag" title="Verificado por un moderador">✓ verificado</span>}</ProfileHeader><ProfileDetails kind="gimnasio" id={gym.id}/>
      <DondeEsta titulo="Dónde está" nombre={gym.name} direccion={[gym.address, gym.city, gym.province].filter(Boolean).join(", ")} punto={puntoDeGimnasio(gym)} />
      {gym.website && <p><a href={gym.website} rel="noopener noreferrer nofollow">{gym.website}</a></p>}
      {gym.isFictional && <p className="notice notice-info">Gimnasio ficticio de la demo.</p>}
      {gym.sourceLicense === "ODbL-1.0" && <p className="meta"><a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">© colaboradores de OpenStreetMap · datos ODbL</a>{gym.sourceRef && <> · <a href={`https://www.openstreetmap.org/${gym.sourceRef}`} rel="noopener noreferrer nofollow">Ver origen</a></>}</p>}
      {!gym.ownerUserId && <p>Perfil creado con datos públicos ({gym.source === "OSM" ? "OpenStreetMap" : gym.source === "FEDERACION" ? "federación" : "alta manual"}). <Link href={`/mis-gimnasios?q=${encodeURIComponent(gym.name)}`}>¿Es tu gimnasio? Reclámalo</Link></p>}
      {gym.phone && <p>Teléfono profesional: <a href={`tel:${gym.phone.replace(/[^+\d]/g, "")}`}>{gym.phone}</a></p>}
      {gym.email && <p>Correo profesional: <a href={`mailto:${gym.email}`}>{gym.email}</a></p>}
      {gym.instagram && <p><a href={gym.instagram} rel="noopener noreferrer nofollow">Instagram</a></p>}
      {gym.disciplines.length > 0 && <p>{gym.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(" · ")}</p>}
      <details><summary>Pedir corrección o retirada de este gimnasio</summary><form action={createReport}><input type="hidden" name="entity" value="GYM" /><input type="hidden" name="entityId" value={gym.id} /><input type="hidden" name="back" value={`/gimnasios/${gym.slug}`} /><label className="field"><span>Motivo</span><input type="hidden" name="reason" value="OTRO" /><textarea name="message" required maxLength={1000} /></label><button>Enviar aviso a moderación</button></form></details>
      <h2>Entrenadores</h2>
      {gym.trainers.length === 0 ? <p className="mut">Este gimnasio todavía no tiene entrenadores registrados.</p> : <ul>{gym.trainers.map((t) => <li key={t.id}><Link href={`/entrenadores/${t.slug}`}>{t.name}</Link></li>)}</ul>}
      <h2>Peleadores</h2>
      {gym.fighters.length === 0 && <p className="mut">Todavía no hay peleadores de este gimnasio en Lona.</p>}
      <div className="grid">
        {gym.fighters.map((b) => <Link key={b.id} href={`/peleadores/${b.slug}`} className="card">{b.disciplines.map(d => <span key={d.discipline} className={`tag ${d.level}`}>{DISCIPLINE_LABEL[d.discipline]} · {LEVEL_LABEL[d.level]}</span>)}<ProfileThumbnail kind="peleador" id={b.id} name={`${b.firstName} ${b.lastName}`}/><strong>{b.firstName} {b.lastName}</strong></Link>)}
      </div>
    </>
  );
}
