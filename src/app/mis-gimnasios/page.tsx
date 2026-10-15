import Link from "next/link";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { publicGyms } from "../../lib/common/gym-directory";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { PROVINCES } from "../../lib/common/labels";
import { saveGym, requestGymClaim, transferGym, setGymMember } from "../actions/gyms";
import FormularioGimnasio from "../components/FormularioGimnasio";
import { titular } from "../../lib/common/titular";

export const metadata = { title: "Mis gimnasios", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Área privada: buscar/reclamar, estado de solicitudes y control de los gimnasios cuya propiedad se revisó. */
export default async function MyGyms({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireVerifiedUser("/mis-gimnasios");
  const { contacto } = titular();
  const { q, province, gimnasio, miembros } = flatParams(await searchParams);
  const ids = await searchIds("gym", q);
  const [owned, claims, found, selected] = await Promise.all([
    db.gym.findMany({ where: { ownerUserId: user.id }, orderBy: [{ name: "asc" }, { id: "asc" }] }),
    db.gymClaimRequest.findMany({ where: { userId: user.id }, include: { gym: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 50 }),
    q || province ? db.gym.findMany({ where: { AND: [publicGyms(), { ...(ids ? { id: { in: ids } } : {}), ...(province ? { province } : {}) }] }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 30 }) : [],
    gimnasio ? db.gym.findFirst({ where: { id: gimnasio, ...(user.role === "ADMIN" ? {} : { ownerUserId: user.id }) }, include: { trainers: true, fighters: { where: { listed: true, hiddenAt: null } } } }) : null,
  ]);
  const [fighterIds, trainerIds] = selected && miembros ? await Promise.all([searchIds("fighter", miembros), searchIds("trainer", miembros)]) : [null, null];
  const [fighters, trainers] = selected && miembros ? await Promise.all([
    db.fighter.findMany({ where: { listed: true, hiddenAt: null, ...(fighterIds ? { id: { in: fighterIds } } : {}) }, orderBy: [{ lastName: "asc" }, { id: "asc" }], take: 30 }),
    db.trainer.findMany({ where: trainerIds ? { id: { in: trainerIds } } : {}, orderBy: [{ name: "asc" }, { id: "asc" }], take: 30 }),
  ]) : [[], []];
  const claimLabel = { PENDING: "Pendiente de revisión", APPROVED: "Aprobada", REJECTED: "Rechazada", CONFLICT: "Conflicto de propiedad: en revisión" };
  return <div className="pantalla">
    <h1>Mis gimnasios</h1>
    <p>¿Tu gimnasio ya está en Lona? Búscalo por nombre, ciudad o provincia y solicita su control.</p>
    <form method="get" className="search"><label className="field"><span>Nombre o ciudad</span><input name="q" defaultValue={q} maxLength={80} /></label><label className="field"><span>Provincia</span><select name="province" defaultValue={province ?? ""}><option value="">Todas</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label><button>Buscar mi gimnasio</button></form>
    {(q || province) && <section aria-label="Gimnasios encontrados"><h2>Gimnasios encontrados</h2>{found.map((g) => <article className="tarjeta" key={g.id}><h3>{g.name} · {g.city}</h3><Link className="btn secondary" href={`/gimnasios/${g.slug}`}>Ver ficha</Link>{g.ownerUserId === user.id ? <Link className="btn secondary" href={`/mis-gimnasios?gimnasio=${g.id}`}>Gestionar</Link> : <details><summary>Es mi gimnasio — reclamarlo</summary><form action={requestGymClaim}><input type="hidden" name="gymId" value={g.id} /><label className="field"><span>Explica tu relación y cómo comprobarla (sin DNI)</span><textarea name="evidence" required minLength={10} maxLength={2000} /></label><label className="field"><span>Web o redes oficiales</span><input name="evidenceUrl" type="url" maxLength={500} /></label><button>Solicitar la reclamación</button></form></details>}</article>)}{!found.length && <p>No se han encontrado gimnasios. Puedes dar de alta el tuyo para revisión.</p>}{found.length === 30 && <p>Se muestran hasta 30: concreta el nombre o la ciudad.</p>}</section>}
    <section className="tarjeta"><h2>Mis solicitudes</h2>{claims.map((c) => <p key={c.id}>{c.gym.name}: {claimLabel[c.status]}{c.note ? ` · ${c.note}` : ""}</p>)}{!claims.length && <p>No tienes reclamaciones.</p>}</section>
    <section className="tarjeta"><h2>Gimnasios que gestiono</h2>{owned.map((g) => <Link key={g.id} className="fila" href={`/mis-gimnasios?gimnasio=${g.id}`}>{g.name} · {g.status === "PUBLISHED" ? "Publicado" : g.status === "PENDING" ? "Por revisar" : "Retirado"}</Link>)}</section>
    {selected && <section aria-label="Gestionar gimnasio"><h2>Gestionar {selected.name}</h2><FormularioGimnasio action={saveGym} gym={selected} admin={user.role === "ADMIN"} /><Link className="btn secondary" href={`/perfiles/gimnasio/${selected.id}/editar`}>Editar fotos, logotipo y presentación</Link>
      {/* Revisión de Claude (15-10-2026): vincular a otra persona al club sin su permiso cambiaba su ficha pública. Solo moderación vincula;
          cada peleador o entrenador elige su gimnasio desde su ficha, y el titular puede desvincular a quien no pertenezca a su club. */}
      {user.role === "ADMIN" ? <>
      <form method="get" className="search"><input type="hidden" name="gimnasio" value={selected.id} /><label className="field"><span>Buscar peleador o entrenador para vincular</span><input name="miembros" defaultValue={miembros} maxLength={80} /></label><button>Buscar miembros</button></form>
      {[...fighters.map((f) => ({ id: f.id, name: `${f.firstName} ${f.lastName}`, kind: "fighter" })), ...trainers.map((t) => ({ id: t.id, name: t.name, kind: "trainer" }))].map((m) => <form className="fila" action={setGymMember} key={`${m.kind}-${m.id}`}><input type="hidden" name="gymId" value={selected.id} /><input type="hidden" name="memberId" value={m.id} /><input type="hidden" name="kind" value={m.kind} /><span className="cuerpo">{m.name}</span><button name="decision" value="link">Vincular</button></form>)}
      </> : <p className="mut">Cada peleador y entrenador elige su gimnasio desde su propia ficha. Aquí ves quién está vinculado y puedes desvincular a quien no pertenezca a tu club.</p>}
      <h3>Miembros vinculados</h3>{[...selected.fighters.map((f) => ({ id: f.id, name: `${f.firstName} ${f.lastName}`, kind: "fighter" })), ...selected.trainers.map((t) => ({ id: t.id, name: t.name, kind: "trainer" }))].map((m) => <form className="fila" action={setGymMember} key={`${m.kind}-${m.id}`}><input type="hidden" name="gymId" value={selected.id} /><input type="hidden" name="memberId" value={m.id} /><input type="hidden" name="kind" value={m.kind} /><span className="cuerpo">{m.name}</span><button name="decision" value="unlink" className="secondary">Desvincular</button></form>)}
      {user.role === "ADMIN" ? <form action={transferGym} className="tarjeta"><input type="hidden" name="gymId" value={selected.id} /><h3>Ceder la propiedad</h3><label className="field"><span>Correo de una cuenta con correo confirmado</span><input name="email" type="email" required maxLength={200} /></label><p>Al cederlo, esa cuenta tendrá el control y tú dejarás de gestionarlo.</p><button>Ceder gimnasio</button></form> : <p className="mut">Para ceder el gimnasio a otra persona, pídelo a moderación{contacto ? <> escribiendo a <a href={`mailto:${contacto}`}>{contacto}</a></> : null}: lo comprobará con las dos cuentas.</p>}
      <form action={saveGym}><input type="hidden" name="gymId" value={selected.id} />{["name", "city", "province", "address", "phone", "email", "website", "instagram"].map((k) => <input type="hidden" key={k} name={k} value={String(selected[k as keyof typeof selected] ?? "")} />)}{selected.disciplines.map((d) => <input key={d} type="hidden" name="disciplina" value={d} />)}<input type="hidden" name="status" value="REMOVED" /><label className="chip"><input type="checkbox" name="confirmar" value="si" required />Entiendo que dejará de verse y que volver a publicarlo necesita revisión</label><button className="secondary">Retirar el gimnasio del directorio</button></form>
    </section>}
    <details id="alta"><summary>Dar de alta mi gimnasio</summary><FormularioGimnasio action={saveGym} admin={user.role === "ADMIN"} /></details>
  </div>;
}
