import { publicGyms } from "../../../lib/common/gym-directory";
import { createReport } from "../../actions/community";
import { TarjetaPersona } from "../../components/TarjetasDirectorio";
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
import { provinciaConGimnasios } from "../../../lib/common/territorio";

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
  if (!gym || !provinciaConGimnasios(gym.province)) notFound();
  return (
    <>
      <ProfileHeader kind="gimnasio" id={gym.id} name={gym.name} subtitle={[gym.city,gym.province].join(" · ")}>{gym.verifiedAt && <span className="tag" title="Verificado por un moderador">✓ verificado</span>}</ProfileHeader><ProfileDetails kind="gimnasio" id={gym.id}/>
      <DondeEsta titulo="Dónde está" nombre={gym.name} direccion={[gym.address, gym.city, gym.province].filter(Boolean).join(", ")} punto={puntoDeGimnasio(gym)} />
      {gym.website && <p><a href={gym.website} rel="noopener noreferrer nofollow">{gym.website}</a></p>}
      {gym.isFictional && <p className="notice notice-info">Gimnasio ficticio de la demo.</p>}
      {gym.sourceLicense === "ODbL-1.0" && <p className="meta" style={{ fontSize: 16 }}><a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", minHeight: 44 }}>© colaboradores de OpenStreetMap · datos ODbL</a>{gym.sourceRef && <> · <a href={`https://www.openstreetmap.org/${gym.sourceRef}`} rel="noopener noreferrer nofollow" style={{ display: "inline-flex", alignItems: "center", minHeight: 44 }}>Ver origen</a></>}</p>}
      {!gym.ownerUserId && <p>Perfil creado con datos públicos ({gym.source === "OSM" ? "OpenStreetMap" : gym.source === "FEDERACION" ? "federación" : "alta manual"}). <Link href={`/mis-gimnasios?q=${encodeURIComponent(gym.name)}`}>¿Es tu gimnasio? Reclámalo</Link></p>}
      {gym.phone && <p>Teléfono profesional: <a href={`tel:${gym.phone.replace(/[^+\d]/g, "")}`}>{gym.phone}</a></p>}
      {gym.email && <p>Correo profesional: <a href={`mailto:${gym.email}`}>{gym.email}</a></p>}
      {gym.instagram && <p><a href={gym.instagram} rel="noopener noreferrer nofollow">Instagram</a></p>}
      {gym.disciplines.length > 0 && <p>{gym.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(" · ")}</p>}
      <details><summary>Pedir corrección o retirada de este gimnasio</summary><form action={createReport}><input type="hidden" name="entity" value="GYM" /><input type="hidden" name="entityId" value={gym.id} /><input type="hidden" name="back" value={`/gimnasios/${gym.slug}`} /><label className="field"><span>Motivo</span><input type="hidden" name="reason" value="OTRO" /><textarea name="message" required maxLength={1000} /></label><button>Enviar aviso a moderación</button></form><p className="mut">¿Eres el titular o no tienes cuenta? También puedes <Link href={`/avisar?direccion=${encodeURIComponent(`/gimnasios/${gym.slug}`)}`}>avisar sin cuenta</Link>.</p></details>
      <h2>Entrenadores</h2>
      {gym.trainers.length === 0 ? <p className="mut">Este gimnasio todavía no tiene entrenadores registrados.</p> : <ul>{gym.trainers.map((t) => <li key={t.id}><Link href={`/entrenadores/${t.slug}`}>{t.name}</Link></li>)}</ul>}
      <h2>Peleadores</h2>
      {gym.fighters.length === 0 && <p className="mut">Todavía no hay peleadores de este gimnasio en Lona.</p>}
      <div className="desliza desliza-personas" role="region" tabIndex={0} aria-label="Peleadores de este gimnasio (desliza para ver más)">
        {gym.fighters.map((b) => <TarjetaPersona key={b.id} href={`/peleadores/${b.slug}`} tipo="peleador" id={b.id} nombre={`${b.firstName} ${b.lastName}`} disciplina={b.disciplines[0]?.discipline ?? null}
          lineas={[b.disciplines[0] ? `${DISCIPLINE_LABEL[b.disciplines[0].discipline]} · ${LEVEL_LABEL[b.disciplines[0].level]}${b.disciplines.length > 1 ? ` (+${b.disciplines.length - 1})` : ""}` : "Sin disciplina"]} />)}
      </div>
    </>
  );
}
