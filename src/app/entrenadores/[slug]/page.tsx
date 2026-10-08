import ProfileThumbnail from "../../components/ProfileThumbnail";
import ProfileHeader from "../../components/ProfileHeader";
import ProfileDetails from "../../components/ProfileDetails";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "../../../lib/accounts/auth";
import { db } from "../../../lib/common/db";
import { DISCIPLINE_LABEL } from "../../../lib/common/disciplines";
import { LEVEL_LABEL } from "../../../lib/common/labels";
import { CLASS_KIND_LABEL, classMeta } from "../../../lib/trainers/classes";

export const dynamic = "force-dynamic";

const getTrainer = cache((slug: string) => db.trainer.findUnique({ where: { slug }, include: { gym: true, classes: { where: { active: true }, orderBy: [{ kind: "asc" }, { priceEuros: "asc" }] }, fighters: { where: { listed: true, hiddenAt: null }, orderBy: { lastName: "asc" }, include: { disciplines: true } } } }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await getTrainer((await params).slug);
  if (!t) return { title: "Entrenador no encontrado" };
  return { title: t.name, description: `${t.name}${t.gym ? `, entrenador en ${t.gym.name}` : ", entrenador"}: peleadores a los que entrena en Ring España.` };
}

export default async function TrainerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTrainer(slug);
  if (!t) notFound();
  const user = await getUser();
  return (
    <>
      <ProfileHeader kind="entrenador" id={t.id} name={t.name} subtitle={t.gym?.name ?? "Entrenador"}/><ProfileDetails kind="entrenador" id={t.id}/>
      {t.gym && <p className="mut">Gimnasio: <Link href={`/gimnasios/${t.gym.slug}`}>{t.gym.name}</Link></p>}
      {(t.disciplines.length > 0 || t.yearsCoaching !== null) && <p className="chips" style={{ marginTop: 12 }}>{t.disciplines.map((d) => <span key={d} className="pildora">{DISCIPLINE_LABEL[d]}</span>)}{t.yearsCoaching !== null && <span className="pildora pildora-acc">{t.yearsCoaching} años entrenando</span>}{t.province && <span className="pildora">{t.city && t.city !== t.province ? `${t.city}, ` : ""}{t.province}</span>}</p>}
      {t.bio && <p>{t.bio}</p>}
      {t.userId && <>
        <h2>Clases</h2>
        {t.classes.length === 0 && <p className="mut">Este entrenador todavía no ha publicado clases.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
          {t.classes.map((c) => (
            <section key={c.id} className="tarjeta" aria-label={c.title}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className={`pildora ${c.kind === "INDIVIDUAL" ? "pildora-acc" : "pildora-violeta"}`}>{CLASS_KIND_LABEL[c.kind]}</span><span style={{ font: "800 26px var(--font)", letterSpacing: "-.03em" }}>{c.priceEuros} €</span></div>
              <div><h3 style={{ margin: 0 }}>{c.title}</h3><div className="meta">{classMeta(c)}{c.discipline ? ` · ${DISCIPLINE_LABEL[c.discipline]}` : ""}{c.capacity ? ` · ${c.capacity} plazas` : ""}</div></div>
              {user?.id !== t.userId && <Link className="btn" href={`/clases/${c.id}/solicitar`} aria-label={`Solicitar la clase «${c.title}»`}>Solicitar esta clase</Link>}
            </section>
          ))}
        </div>
        {t.classes.length > 0 && <p className="mut">Precio por persona y sesión. Pulsa «Solicitar esta clase», dile cuándo te viene bien y el entrenador te responderá. La clase se paga directamente al entrenador: Ring España no cobra nada.</p>}
      </>}
      <h2>Peleadores</h2>
      {t.fighters.length === 0 && <p className="mut">Todavía no hay peleadores de este entrenador en Ring España.</p>}
      <div className="grid">
        {t.fighters.map((b) => <Link key={b.id} href={`/peleadores/${b.slug}`} className="card">{b.disciplines.map(d => <span key={d.discipline} className={`tag ${d.level}`}>{DISCIPLINE_LABEL[d.discipline]} · {LEVEL_LABEL[d.level]}</span>)}<ProfileThumbnail kind="peleador" id={b.id} name={`${b.firstName} ${b.lastName}`}/><strong>{b.firstName} {b.lastName}</strong></Link>)}
      </div>
    </>
  );
}
