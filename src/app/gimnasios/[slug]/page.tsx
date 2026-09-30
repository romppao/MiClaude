import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/db";
import { LEVEL_LABEL } from "../../../lib/labels";

export const dynamic = "force-dynamic";

export default async function GymPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gym = await db.gym.findUnique({ where: { slug }, include: { fighters: { where: { listed: true, hiddenAt: null }, orderBy: { lastName: "asc" } }, trainers: true } });
  if (!gym) notFound();
  return (
    <>
      <h1>{gym.name} {gym.verifiedAt && <span className="tag PRO" title="Verificado por un moderador">✓ verificado</span>}</h1>
      <p className="mut">{[gym.address, gym.city, gym.province].filter(Boolean).join(", ")}</p>
      {gym.website && <p><a href={gym.website} rel="noopener noreferrer nofollow">{gym.website}</a></p>}
      <h2>Entrenadores</h2>
      <ul>{gym.trainers.map((t) => <li key={t.id}><Link href={`/entrenadores/${t.slug}`}>{t.name}</Link></li>)}</ul>
      <h2>Peleadores</h2>
      <div className="grid">
        {gym.fighters.map((b) => <Link key={b.id} href={`/peleadores/${b.slug}`} className="card"><span className={`tag ${b.level}`}>{LEVEL_LABEL[b.level]}</span><strong>{b.firstName} {b.lastName}</strong></Link>)}
      </div>
    </>
  );
}
