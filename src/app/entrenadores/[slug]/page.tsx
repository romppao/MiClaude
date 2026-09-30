import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/db";
import { LEVEL_LABEL } from "../../../lib/labels";

export const dynamic = "force-dynamic";

export default async function TrainerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await db.trainer.findUnique({ where: { slug }, include: { gym: true, boxers: { orderBy: { lastName: "asc" } } } });
  if (!t) notFound();
  return (
    <>
      <h1>{t.name}</h1>
      {t.gym && <p className="mut">Gimnasio: <Link href={`/gimnasios/${t.gym.slug}`}>{t.gym.name}</Link></p>}
      {t.bio && <p>{t.bio}</p>}
      <h2>Boxeadores</h2>
      <div className="grid">
        {t.boxers.map((b) => <Link key={b.id} href={`/boxeadores/${b.slug}`} className="card"><span className={`tag ${b.level}`}>{LEVEL_LABEL[b.level]}</span><strong>{b.firstName} {b.lastName}</strong></Link>)}
      </div>
    </>
  );
}
