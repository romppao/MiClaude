import { createHash } from "node:crypto";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import Paginacion from "../components/Paginacion";
import { hayBloqueo } from "../../lib/community/bloqueos";
import Link from "next/link";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { publicGyms } from "../../lib/common/gym-directory";
import { searchIds } from "../../lib/common/search";
import { flatParams } from "../../lib/common/safe";
import { PROVINCES } from "../../lib/common/labels";
import { saveGym, requestGymClaim, transferGym, setGymMember, inviteGymTransfer, answerGymTransfer, cancelGymTransfer, inviteGymMember, answerGymMemberInvitation, cancelGymMemberInvitation } from "../actions/gyms";
import FormularioGimnasio from "../components/FormularioGimnasio";
import { bloqueadosPor } from "../../lib/community/bloqueos";
import { titular } from "../../lib/common/titular";

export const metadata = { title: "Mis gimnasios", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Área privada: buscar/reclamar, estado de solicitudes y control de los gimnasios cuya propiedad se revisó. */
export default async function MyGyms({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = flatParams(await searchParams);
  const token = /^[a-f0-9]{64}$/.test(params.cesion ?? "") ? params.cesion! : "";
  const user = await requireVerifiedUser(`/mis-gimnasios${token ? `?cesion=${token}` : ""}`);
  const { q, province, gimnasio, miembros, invitaciones } = params;
  const receivedTransfer = token ? await db.gymTransferInvitation.findFirst({ where: { tokenHash: createHash("sha256").update(token).digest("hex"), recipientEmail: user.email.toLowerCase(), status: "PENDING", expiresAt: { gt: new Date() } }, include: { gym: true, sender: { select: { name: true } } } }) : null;
  const transfer = receivedTransfer && !await hayBloqueo(user.id, receivedTransfer.senderId) && receivedTransfer.gym.ownerUserId === receivedTransfer.senderId && receivedTransfer.gym.status !== "REMOVED" ? receivedTransfer : null;
  const transfersWhere = { senderId: user.id, status: "PENDING" as const, expiresAt: { gt: new Date() } };
  const totalTransfers = await db.gymTransferInvitation.count({ where: transfersWhere });
  const transferWindow = pageWindow(totalTransfers, pageNumber(params.cesiones));
  const outgoingTransfers = await db.gymTransferInvitation.findMany({ where: transfersWhere, include: { gym: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: transferWindow.take, skip: transferWindow.skip });
  const { contacto } = titular();
  const blocked = await bloqueadosPor(user.id);
  const blockedTrainers = (await db.profile.findMany({ where: { kind: "entrenador", ownerId: { in: blocked } }, select: { entityId: true } })).map(p => p.entityId);
  const visibleUser = { OR: [{ userId: null }, { userId: { notIn: blocked } }] };
  const invitationWhere = { status: "PENDING" as const, expiresAt: { gt: new Date() }, OR: [{ recipientId: user.id }, { senderId: user.id }], senderId: { notIn: blocked }, recipientId: { notIn: blocked } };
  const totalInvitations = await db.gymMemberInvitation.count({ where: invitationWhere });
  const invitationWindow = pageWindow(totalInvitations, pageNumber(invitaciones));
  const invitations = await db.gymMemberInvitation.findMany({ where: invitationWhere, include: { gym: true, sender: { select: { name: true } }, fighter: true, trainer: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: invitationWindow.take, skip: invitationWindow.skip });
  const ids = await searchIds("gym", q);
  const [owned, claims, found, selected] = await Promise.all([
    db.gym.findMany({ where: { ownerUserId: user.id }, orderBy: [{ name: "asc" }, { id: "asc" }] }),
    db.gymClaimRequest.findMany({ where: { userId: user.id }, include: { gym: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 50 }),
    q || province ? db.gym.findMany({ where: { AND: [publicGyms(), { ...(ids ? { id: { in: ids } } : {}), ...(province ? { province } : {}) }] }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 30 }) : [],
    gimnasio ? db.gym.findFirst({ where: { id: gimnasio, ...(user.role === "ADMIN" ? {} : { ownerUserId: user.id }) }, include: { trainers: { where: { ...visibleUser, id: { notIn: blockedTrainers } } }, fighters: { where: { ...visibleUser, listed: true, hiddenAt: null } } } }) : null,
  ]);
  const [fighterIds, trainerIds] = selected && miembros ? await Promise.all([searchIds("fighter", miembros), searchIds("trainer", miembros)]) : [null, null];
  const [fighters, trainers] = selected && miembros ? await Promise.all([
    db.fighter.findMany({ where: { ...visibleUser, listed: true, hiddenAt: null, ...(fighterIds ? { id: { in: fighterIds } } : {}) }, orderBy: [{ lastName: "asc" }, { id: "asc" }], take: 30 }),
    db.trainer.findMany({ where: { ...visibleUser, id: { ...(trainerIds ? { in: trainerIds } : {}), notIn: blockedTrainers } }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 30 }),
  ]) : [[], []];
  const claimLabel = { PENDING: "Pendiente de revisión", APPROVED: "Aprobada", REJECTED: "Rechazada", CONFLICT: "Conflicto de propiedad: en revisión" };
  return <div className="pantalla">
    <h1>Mis gimnasios</h1>
    {token && (transfer ? <section className="tarjeta" aria-label="Aceptar cesión de gimnasio"><h2>Te invitan a gestionar {transfer.gym.name}</h2><p>{transfer.sender.name} te propone cederte la gestión. Al aceptar tendrás el control del gimnasio y la otra persona dejará de gestionarlo. La cesión no concede un sello de verificación.</p><form action={answerGymTransfer}><input type="hidden" name="token" value={token} /><button name="decision" value="accept">Aceptar cesión de gimnasio</button><button name="decision" value="decline" className="secondary">Rechazar cesión de gimnasio</button></form></section> : <p role="status">Esta invitación no está disponible. Comprueba que has entrado con el correo destinatario; puede haber caducado o haber sido cancelada.</p>)}
    {outgoingTransfers.length > 0 && <section aria-label="Cesiones pendientes"><h2>Cesiones pendientes</h2>{outgoingTransfers.map(i => <article className="tarjeta" key={i.id}><h3>{i.gym.name}</h3><p>Invitación a {i.recipientEmail}. La propiedad no cambia hasta que se acepte.</p><form action={cancelGymTransfer}><input type="hidden" name="invitationId" value={i.id} /><button className="secondary">Cancelar cesión</button></form></article>)}<Paginacion ruta="/mis-gimnasios" params={{ q, province, gimnasio, miembros }} parametro="cesiones" actual={transferWindow.current} paginas={transferWindow.pages} desde={transferWindow.from} hasta={transferWindow.to} total={totalTransfers} unidad={["cesión", "cesiones"]} /></section>}
    <p>¿Tu gimnasio ya está en Lona? Búscalo por nombre, ciudad o provincia y solicita su control.</p>
    <form method="get" className="search"><label className="field"><span>Nombre o ciudad</span><input name="q" defaultValue={q} maxLength={80} /></label><label className="field"><span>Provincia</span><select name="province" defaultValue={province ?? ""}><option value="">Todas</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label><button>Buscar mi gimnasio</button></form>
    {(q || province) && <section aria-label="Gimnasios encontrados"><h2>Gimnasios encontrados</h2>{found.map((g) => <article className="tarjeta" key={g.id}><h3>{g.name} · {g.city}</h3><Link className="btn secondary" href={`/gimnasios/${g.slug}`}>Ver ficha</Link>{g.ownerUserId === user.id ? <Link className="btn secondary" href={`/mis-gimnasios?gimnasio=${g.id}`}>Gestionar</Link> : <details><summary>Es mi gimnasio — reclamarlo</summary><form action={requestGymClaim}><input type="hidden" name="gymId" value={g.id} /><label className="field"><span>Explica tu relación y cómo comprobarla (sin DNI)</span><textarea name="evidence" required minLength={10} maxLength={2000} /></label><label className="field"><span>Web o redes oficiales</span><input name="evidenceUrl" type="url" maxLength={500} /></label><button>Solicitar la reclamación</button></form></details>}</article>)}{!found.length && <p>No se han encontrado gimnasios. Puedes dar de alta el tuyo para revisión.</p>}{found.length === 30 && <p>Se muestran hasta 30: concreta el nombre o la ciudad.</p>}</section>}
    <section id="invitaciones" aria-label="Invitaciones de miembros"><h2>Invitaciones de miembros</h2>
      <p>La ficha solo cambia al aceptar. Si ya tienes otro gimnasio, se sustituirá por el de la invitación. Las invitaciones caducan a los 14 días.</p>
      {invitations.map(i => <article className="tarjeta" key={i.id}><h3>{i.gym.name} · {i.fighter ? `${i.fighter.firstName} ${i.fighter.lastName}` : i.trainer?.name}</h3><p>Invita: {i.sender.name}. Pendiente de respuesta.</p>{i.recipientId === user.id ? <form action={answerGymMemberInvitation}><input type="hidden" name="invitationId" value={i.id} /><button name="decision" value="accept">Aceptar vinculación</button><button name="decision" value="decline" className="secondary">Rechazar vinculación</button></form> : <form action={cancelGymMemberInvitation}><input type="hidden" name="invitationId" value={i.id} /><button className="secondary">Cancelar invitación</button></form>}</article>)}
      {!invitations.length && <p>No hay invitaciones pendientes.</p>}
      <Paginacion ruta="/mis-gimnasios" params={{ q, province, gimnasio, miembros }} parametro="invitaciones" ancla="invitaciones" actual={invitationWindow.current} paginas={invitationWindow.pages} desde={invitationWindow.from} hasta={invitationWindow.to} total={totalInvitations} unidad={["invitación", "invitaciones"]} />
    </section>
    <section className="tarjeta"><h2>Mis solicitudes</h2>{claims.map((c) => <p key={c.id}>{c.gym.name}: {claimLabel[c.status]}{c.note ? ` · ${c.note}` : ""}</p>)}{!claims.length && <p>No tienes reclamaciones.</p>}</section>
    <section className="tarjeta"><h2>Gimnasios que gestiono</h2>{owned.map((g) => <Link key={g.id} className="fila" href={`/mis-gimnasios?gimnasio=${g.id}`}>{g.name} · {g.status === "PUBLISHED" ? "Publicado" : g.status === "PENDING" ? "Por revisar" : "Retirado"}</Link>)}</section>
    {selected && <section aria-label="Gestionar gimnasio"><h2>Gestionar {selected.name}</h2><FormularioGimnasio action={saveGym} gym={selected} admin={user.role === "ADMIN"} /><Link className="btn secondary" href={`/perfiles/gimnasio/${selected.id}/editar`}>Editar fotos, logotipo y presentación</Link>
      <p>Invita a peleadores y entrenadores con cuenta a vincular su ficha. Moderación mantiene su vinculación directa.</p>
      <form method="get" className="search"><input type="hidden" name="gimnasio" value={selected.id} /><label className="field"><span>Buscar peleador o entrenador para vincular</span><input name="miembros" defaultValue={miembros} maxLength={80} /></label><button>Buscar miembros</button></form>
      {[...fighters.map((f) => ({ id: f.id, name: `${f.firstName} ${f.lastName}`, kind: "fighter" })), ...trainers.map((t) => ({ id: t.id, name: t.name, kind: "trainer" }))].map((m) => <form className="fila" action={user.role === "ADMIN" ? setGymMember : inviteGymMember} key={`${m.kind}-${m.id}`}><input type="hidden" name="gymId" value={selected.id} /><input type="hidden" name="memberId" value={m.id} /><input type="hidden" name="kind" value={m.kind} /><span className="cuerpo">{m.name}</span><button name="decision" value="link">{user.role === "ADMIN" ? "Vincular" : "Invitar a vincularse"}</button></form>)}
      <h3>Miembros vinculados</h3>{[...selected.fighters.map((f) => ({ id: f.id, name: `${f.firstName} ${f.lastName}`, kind: "fighter" })), ...selected.trainers.map((t) => ({ id: t.id, name: t.name, kind: "trainer" }))].map((m) => <form className="fila" action={setGymMember} key={`${m.kind}-${m.id}`}><input type="hidden" name="gymId" value={selected.id} /><input type="hidden" name="memberId" value={m.id} /><input type="hidden" name="kind" value={m.kind} /><span className="cuerpo">{m.name}</span><button name="decision" value="unlink" className="secondary">Desvincular</button></form>)}
      {selected.ownerUserId === user.id && <form action={inviteGymTransfer} className="tarjeta"><input type="hidden" name="gymId" value={selected.id} /><h3>Invitar a gestionar el gimnasio</h3><label className="field"><span>Correo electrónico de la persona destinataria</span><input name="email" type="email" required maxLength={200} /></label><p>Recibirá un enlace para aceptar con ese correo confirmado, aunque todavía no tenga cuenta. Hasta que acepte, tú conservas el control. El enlace caduca en 14 días. Una nueva invitación cancela la anterior.</p><button>Invitar a aceptar la cesión</button></form>}
      {user.role === "ADMIN" && <details><summary>Cesión directa de moderación</summary><form action={transferGym}><input type="hidden" name="gymId" value={selected.id} /><label className="field"><span>Correo confirmado de la nueva cuenta titular</span><input name="email" type="email" required maxLength={200} /></label><p>Esta intervención de moderación cambia la propiedad directamente.</p><button>Ceder gimnasio</button></form></details>}
      <form action={saveGym}><input type="hidden" name="gymId" value={selected.id} />{["name", "city", "province", "address", "phone", "email", "website", "instagram"].map((k) => <input type="hidden" key={k} name={k} value={String(selected[k as keyof typeof selected] ?? "")} />)}{selected.disciplines.map((d) => <input key={d} type="hidden" name="disciplina" value={d} />)}<input type="hidden" name="status" value="REMOVED" /><label className="chip"><input type="checkbox" name="confirmar" value="si" required />Entiendo que dejará de verse y que volver a publicarlo necesita revisión</label><button className="secondary">Retirar el gimnasio del directorio</button></form>
    </section>}
    <details id="alta"><summary>Dar de alta mi gimnasio</summary><FormularioGimnasio action={saveGym} admin={user.role === "ADMIN"} /></details>
  </div>;
}
