import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/db";
import { LEVEL_LABEL } from "../../../lib/labels";

export const dynamic = "force-dynamic";

const getTrainer = cache((slug: string) => db.trainer.findUnique({ where: { slug }, include: { gym: true, fighters: { where: { listed: true, hiddenAt: null }, orderBy: { lastName: "asc" } } } }));

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
      <h1>{t.name}</h1>
      {t.gym && <p className="mut">Gimnasio: <Link href={`/gimnasios/${t.gym.slug}`}>{t.gym.name}</Link></p>}
      {t.bio && <p>{t.bio}</p>}
      <h2>Peleadores</h2>
      <div className="grid">
        {t.fighters.map((b) => <Link key={b.id} href={`/peleadores/${b.slug}`} className="card"><span className={`tag ${b.level}`}>{LEVEL_LABEL[b.level]}</span><strong>{b.firstName} {b.lastName}</strong></Link>)}
      </div>
    </>
  );
}
