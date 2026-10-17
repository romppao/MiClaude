import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "../../../../lib/common/db";
import { getUser } from "../../../../lib/accounts/auth";
import { fmtDate } from "../../../../lib/common/labels";
import { todayMadrid } from "../../../../lib/common/dates";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../../../lib/common/disciplines";
import { publicFighterName } from "../../../../lib/common/names";
import { hayBloqueo } from "../../../../lib/community/bloqueos";
import { INVITATION_MESSAGE_MAX, destinoDisponible, parseInvitationKind, puedeInvitar } from "../../../../lib/community/invitations";
import { sendInvitation } from "../../../actions/invitations";

export const metadata: Metadata = { title: "Invitar a un peleador", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Invitar a un peleador concreto (17 de octubre de 2026): una organización aprobada (a una velada) o un entrenador (a un sparring para uno de
 * sus peleadores o a entrenar juntos). El peleador acepta o rechaza; solo si acepta se comparte el contacto que él elija. Sin chat.
 */
export default async function Invitar({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tipo?: string; velada?: string }> }) {
  const { slug } = await params;
  const destino = await db.fighter.findUnique({ where: { slug }, include: { disciplines: true } });
  if (!destino || destino.hiddenAt || !destino.listed) notFound();
  const user = await getUser();
  const nombre = publicFighterName(destino);
  const { tipo: tipoPedido, velada } = await searchParams;
  const hoy = todayMadrid();
  const permiso = user ? puedeInvitar({ role: user.role, emailVerifiedAt: user.emailVerifiedAt }) : null;
  const disponible = destinoDisponible({ listed: destino.listed, hiddenAt: destino.hiddenAt, userId: destino.userId, acceptsInvitations: destino.acceptsInvitations, birthDate: destino.birthDate }, hoy);
  // La ficha propia cuenta como no disponible (nadie se invita a sí mismo).
  const bloqueo = user ? destino.userId === user.id || (await hayBloqueo(user.id, destino.userId)) : false;
  const puede = !!user && permiso?.ok && disponible.ok && !bloqueo;

  const veladas = puede ? await db.event.findMany({ where: { organizerId: user.id, status: "SCHEDULED", registrationOpen: true, date: { gte: new Date(`${hoy}T00:00:00Z`) } }, orderBy: [{ date: "asc" }, { id: "asc" }], take: 30, select: { id: true, name: true, date: true, discipline: true } }) : [];
  const entrenador = puede && user.role === "TRAINER" ? await db.trainer.findUnique({ where: { userId: user.id }, include: { fighters: { orderBy: [{ lastName: "asc" }, { id: "asc" }] } } }) : null;
  const propios = (entrenador?.fighters ?? []).filter((f) => f.id !== destino.id);
  const disciplinas = DISCIPLINE_ORDER.filter((d) => destino.disciplines.some((x) => x.discipline === d));
  const tipos = [
    ...(veladas.length ? [["EVENT", "Participar en una velada"] as const] : []),
    ...(entrenador && propios.length ? [["SPARRING", "Un sparring para uno de mis peleadores"] as const] : []),
    ...(entrenador && destino.trainerId !== entrenador.id ? [["TRAIN", "Entrenar juntos"] as const] : []),
  ];
  const tipo = parseInvitationKind(tipoPedido ?? "") ?? (tipos[0]?.[0] ?? "EVENT");

  return (
    <div className="pantalla" style={{ gap: 18, maxWidth: 640 }}>
      <div><h1>Invitar a un peleador</h1><p className="lead" style={{ fontSize: 16 }}>A <Link href={`/peleadores/${destino.slug}`}>{nombre}</Link>. Le llegará un aviso y un correo; tiene 14 días para responder. <strong>Solo si acepta</strong> se comparte el contacto que él o ella elija.</p></div>
      {!user ? (
        <div className="tarjeta"><p style={{ margin: 0 }}>Para invitar a un peleador entra con tu cuenta de organización o de entrenador.</p><Link className="btn btn-grande" href={`/entrar?next=${encodeURIComponent(`/peleadores/${destino.slug}/invitar`)}`}>Entrar</Link></div>
      ) : !user.emailVerifiedAt ? (
        <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>Primero <Link href="/verificar">confirma tu correo electrónico</Link>.</div>
      ) : !permiso?.ok ? (
        <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>Solo pueden invitar a peleadores las organizaciones aprobadas (promotoras, federaciones y clubes) y los entrenadores. {user.role === "FAN" && <>Si organizas veladas, <Link href="/organizador">pide ser organizador</Link>.</>}</div>
      ) : !disponible.ok || bloqueo ? (
        <div className="notice"><span aria-hidden="true">ℹ </span>{disponible.ok || disponible.problema !== "invitacion_sin_titular" ? "Este peleador no recibe invitaciones ahora mismo." : "Esta ficha todavía no la ha reclamado su peleador, así que nadie podría responder. Cuando la reclame, podrás invitarlo."}</div>
      ) : tipos.length === 0 ? (
        <div className="notice"><span aria-hidden="true">ℹ </span>No tienes nada que proponerle todavía. {user.role === "TRAINER" ? <>Añade peleadores a tu equipo o <Link href="/organizador#crear">crea una velada con la inscripción abierta</Link>.</> : <><Link href="/organizador#crear">Crea una velada</Link> y abre la inscripción para poder invitarlo.</>}</div>
      ) : (
        <form action={sendInvitation} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <input type="hidden" name="toId" value={destino.id} />
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="leyenda">¿Qué le propones?</legend>
            <div className="segmentos">{tipos.map(([valor, texto]) => <label key={valor}><input type="radio" name="kind" value={valor} defaultChecked={tipo === valor} required />{texto}</label>)}</div>
          </fieldset>
          {veladas.length > 0 && (
            <label className="field"><span>Velada (si le propones participar en una)</span>
              <select name="eventId" defaultValue={veladas.find((v) => v.id === velada)?.id ?? ""}><option value="">Elige una velada</option>{veladas.map((v) => <option key={v.id} value={v.id}>{v.name} · {fmtDate(v.date)} · {DISCIPLINE_LABEL[v.discipline]}</option>)}</select>
              <span className="hint">Solo salen tus veladas con la inscripción abierta. La disciplina tiene que ser la de la velada.</span>
            </label>
          )}
          {entrenador && propios.length > 0 && (
            <label className="field"><span>Peleador tuyo para el sparring</span>
              <select name="onBehalfOfId" defaultValue=""><option value="">Elige a uno de tus peleadores</option>{propios.map((p) => <option key={p.id} value={p.id}>{publicFighterName(p)}</option>)}</select>
            </label>
          )}
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="leyenda">Disciplina</legend>
            <div className="chips">{disciplinas.map((d, i) => <label key={d} className="chip"><input type="radio" name="discipline" value={d} defaultChecked={i === 0} required />{DISCIPLINE_LABEL[d]}</label>)}</div>
          </fieldset>
          <label className="field"><span>Mensaje (opcional)</span><textarea name="message" rows={4} maxLength={INVITATION_MESSAGE_MAX} placeholder="Cuéntale por qué quieres contar con él o con ella: fecha, categoría, lugar…" /></label>
          <button className="btn-grande">Enviar la invitación</button>
          <p className="mut" style={{ margin: 0 }}>Puedes retirarla mientras no responda. Si te rechaza, no podrás repetir la misma invitación hasta pasados 30 días.</p>
        </form>
      )}
    </div>
  );
}
