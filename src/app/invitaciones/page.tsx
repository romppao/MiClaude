import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "../../lib/common/db";
import { requireUser } from "../../lib/accounts/auth";
import { fmtDate } from "../../lib/common/labels";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { publicFighterName } from "../../lib/common/names";
import { INVITATION_KIND_LABEL, INVITATION_STATUS_LABEL, invitacionCaducada, puedeInvitar, puedeRetirarInvitacion } from "../../lib/community/invitations";
import { withdrawInvitation } from "../actions/invitations";

export const metadata: Metadata = { title: "Mis invitaciones", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Invitaciones que ha enviado una organización aprobada o un entrenador, con su estado y, si aceptan, el contacto que han elegido compartir. */
export default async function MisInvitaciones() {
  const user = await requireUser("/invitaciones");
  if (user.role !== "ORGANIZER" && user.role !== "TRAINER") redirect(user.fighter ? "/propuestas#pestana-invitaciones" : "/mi-panel");
  const permiso = puedeInvitar({ role: user.role, emailVerifiedAt: user.emailVerifiedAt, invitacionesSuspendidas: !!user.invitationsSuspendedAt });
  const ahora = new Date();
  const enviadas = await db.invitation.findMany({
    where: { fromUserId: user.id }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 100,
    include: { to: { select: { firstName: true, lastName: true, slug: true } }, event: { select: { name: true, slug: true } }, onBehalfOf: { select: { firstName: true, lastName: true } } },
  });
  return (
    <div className="pantalla" style={{ gap: 18 }}>
      <div><h1>Mis invitaciones</h1><p className="lead" style={{ fontSize: 16 }}>Las invitaciones que has enviado a peleadores. Si aceptan, aquí verás el contacto que han elegido compartir contigo.</p></div>
      {!permiso.ok && <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>{permiso.problema === "invitacion_sin_correo" ? <>Primero <Link href="/verificar">confirma tu correo electrónico</Link>.</> : permiso.problema === "invitacion_suspendida" ? "El envío de invitaciones de tu cuenta está en pausa mientras moderación revisa avisos. Si crees que es un error, cuéntanoslo desde «Avisar de un contenido» (al pie de cualquier pantalla)." : "Tu cuenta no puede enviar invitaciones por ahora."}</div>}
      <p style={{ margin: 0 }}><Link className="btn" href="/peleadores">Buscar un peleador al que invitar</Link></p>
      {enviadas.length === 0 && <p className="mut" style={{ margin: 0 }}>Todavía no has enviado ninguna invitación. Abre la ficha de un peleador y pulsa «Invitar a este peleador».</p>}
      {enviadas.map((i) => {
        const estado = invitacionCaducada(i, ahora) ? "EXPIRED" : i.status;
        return (
          <article key={i.id} className="tarjeta" style={estado === "ACCEPTED" ? { borderColor: "var(--acc)" } : undefined} aria-label={`${INVITATION_KIND_LABEL[i.kind]} a ${publicFighterName(i.to)}`}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><span className="kicker">{INVITATION_KIND_LABEL[i.kind]}</span><span className="meta">{INVITATION_STATUS_LABEL[estado]} · {fmtDate(i.createdAt)}</span></div>
            <div style={{ font: "800 20px/1.15 var(--font)" }}><Link href={`/peleadores/${i.to.slug}`}>{publicFighterName(i.to)}</Link></div>
            <div className="meta">{i.event ? <>Velada <Link href={`/veladas/${i.event.slug}`}>{i.event.name}</Link></> : i.onBehalfOf ? `Sparring para ${i.onBehalfOf.firstName} ${i.onBehalfOf.lastName}` : "Entrenar juntos"}{i.discipline ? ` · ${DISCIPLINE_LABEL[i.discipline]}` : ""}</div>
            {i.message && <p style={{ margin: 0 }}>«{i.message}»</p>}
            {estado === "ACCEPTED" && <p style={{ margin: 0 }}><strong>Contacto compartido:</strong> {i.contactShared}</p>}
            {i.reply && <div className="meta">Su respuesta: {i.reply}</div>}
            {puedeRetirarInvitacion(i) && estado === "PENDING" && (
              <form action={withdrawInvitation} style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}><input type="hidden" name="invitationId" value={i.id} /><button className="secondary">Retirar la invitación</button></form>
            )}
          </article>
        );
      })}
    </div>
  );
}
