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

export const dynamic = "force-dynamic";

const getTrainer = cache((slug: string) => db.trainer.findUnique({ where: { slug }, include: { gym: true, fighters: { where: { listed: true, hiddenAt: null }, orderBy: { lastName: "asc" }, include: { disciplines: true } } } }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await getTrainer((await params).slug);
  if (!t) return { title: "Entrenador no encontrado" };
  return { title: t.name, description: `${t.name}${t.gym ? `, entrenador en ${t.gym.name}` : ", entrenador"}: peleadores a los que entrena en Ring España.` };
}

export default async function TrainerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTrainer(slug);
  if (!t) notFound();
  return (
    <>
      <ProfileHeader kind="entrenador" id={t.id} name={t.name} subtitle={t.gym?.name ?? "Entrenador"}/><ProfileDetails kind="entrenador" id={t.id}/>
      {t.gym && <p className="mut">Gimnasio: <Link href={`/gimnasios/${t.gym.slug}`}>{t.gym.name}</Link></p>}
      {t.bio && <p>{t.bio}</p>}
      <h2>Peleadores</h2>
      {t.fighters.length === 0 && <p className="mut">Todavía no hay peleadores de este entrenador en Ring España.</p>}
      <div className="grid">
        {t.fighters.map((b) => <Link key={b.id} href={`/peleadores/${b.slug}`} className="card">{b.disciplines.map(d => <span key={d.discipline} className={`tag ${d.level}`}>{DISCIPLINE_LABEL[d.discipline]} · {LEVEL_LABEL[d.level]}</span>)}<ProfileThumbnail kind="peleador" id={b.id} name={`${b.firstName} ${b.lastName}`}/><strong>{b.firstName} {b.lastName}</strong></Link>)}
      </div>
    </>
  );
}
