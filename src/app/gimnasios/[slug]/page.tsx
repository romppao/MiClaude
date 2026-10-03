import ProfileThumbnail from "../../components/ProfileThumbnail";
import ProfileHeader from "../../components/ProfileHeader";
import ProfileDetails from "../../components/ProfileDetails";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/common/db";
import { LEVEL_LABEL } from "../../../lib/common/labels";

export const dynamic = "force-dynamic";

const getGym = cache((slug: string) => db.gym.findUnique({ where: { slug }, include: { fighters: { where: { listed: true, hiddenAt: null }, orderBy: { lastName: "asc" } }, trainers: true } }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const gym = await getGym((await params).slug);
  if (!gym) return { title: "Gimnasio no encontrado" };
  return { title: gym.name, description: `${gym.name}, gimnasio de deportes de contacto en ${gym.city} (${gym.province}): entrenadores y peleadores en Ring España.` };
}

export default async function GymPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gym = await getGym(slug);
  if (!gym) notFound();
  return (
    <>
      <ProfileHeader kind="gimnasio" id={gym.id} name={gym.name} subtitle={[gym.city,gym.province].join(" · ")}>{gym.verifiedAt && <span className="tag" title="Verificado por un moderador">✓ verificado</span>}</ProfileHeader><ProfileDetails kind="gimnasio" id={gym.id}/>
      <p className="mut">{[gym.address, gym.city, gym.province].filter(Boolean).join(", ")}</p>
      {gym.website && <p><a href={gym.website} rel="noopener noreferrer nofollow">{gym.website}</a></p>}
      <h2>Entrenadores</h2>
      {gym.trainers.length === 0 ? <p className="mut">Este gimnasio todavía no tiene entrenadores registrados.</p> : <ul>{gym.trainers.map((t) => <li key={t.id}><Link href={`/entrenadores/${t.slug}`}>{t.name}</Link></li>)}</ul>}
      <h2>Peleadores</h2>
      {gym.fighters.length === 0 && <p className="mut">Todavía no hay peleadores de este gimnasio en Ring España.</p>}
      <div className="grid">
        {gym.fighters.map((b) => <Link key={b.id} href={`/peleadores/${b.slug}`} className="card"><span className={`tag ${b.level}`}>{LEVEL_LABEL[b.level]}</span><ProfileThumbnail kind="peleador" id={b.id} name={`${b.firstName} ${b.lastName}`}/><strong>{b.firstName} {b.lastName}</strong></Link>)}
      </div>
    </>
  );
}
