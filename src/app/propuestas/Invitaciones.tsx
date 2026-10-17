import Link from "next/link";
import { fmtDate } from "../../lib/common/labels";
import { INVITATION_KIND_LABEL, INVITATION_REPLY_MAX, INVITATION_STATUS_LABEL, invitacionCaducada, puedeResponderInvitacion } from "../../lib/community/invitations";
import { answerInvitation, setInvitationSettings } from "../actions/invitations";
import { bloquearUsuario, createReport } from "../actions/community";
import { REASONS_BY_ENTITY, REPORT_REASONS } from "../../lib/community/reports";
import { BotonBloquear } from "../components/Bloquear";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import type { Discipline, InvitationKind, InvitationStatus } from "@prisma/client";

/**
 * Pestaña «Invitaciones» de «Mis propuestas»: las que ha recibido el peleador de organizaciones y entrenadores (aceptar, rechazar, bloquear) y
 * sus ajustes: si recibe invitaciones y qué contacto se comparte al aceptar. Solo al aceptar se comparte ese contacto, con quien invitó.
 */
export type InvitacionRecibida = {
  id: string; kind: InvitationKind; status: InvitationStatus; message: string | null; reply: string | null; contactShared: string | null; discipline: Discipline | null;
  createdAt: Date; expiresAt: Date; fromUserId: string;
  fromUser: { role: string; name: string; organizerRequest: { orgName: string } | null; trainer: { name: string; slug: string } | null };
  event: { name: string; slug: string; date: Date } | null;
  onBehalfOf: { firstName: string; lastName: string } | null;
};
export type AjustesDelPeleador = { acceptsInvitations: boolean; contactChannel: string; contactPhone: string | null; contactInstagram: string | null };

const RECIBIDAS = "/propuestas#pestana-invitaciones";
const quien = (i: InvitacionRecibida) => i.fromUser.role === "ORGANIZER" ? (i.fromUser.organizerRequest?.orgName ?? i.fromUser.name) : (i.fromUser.trainer?.name ?? i.fromUser.name);

export default function PestanaInvitaciones({ invitaciones, ajustes, ahora }: { invitaciones: InvitacionRecibida[]; ajustes: AjustesDelPeleador; ahora: Date }) {
  return (
    <>
      <h2 className="sr-only">Invitaciones recibidas</h2>
      {!ajustes.acceptsInvitations && <p className="notice notice-info"><span aria-hidden="true">ℹ </span>Ahora no recibes invitaciones de organizaciones ni de entrenadores. Puedes volver a abrirlas más abajo.</p>}
      {invitaciones.length === 0 && <p className="mut" style={{ margin: 0 }}>Todavía no te ha invitado nadie. Cuando una organización (promotora, federación o club) o un entrenador quiera contar contigo, te llegará un aviso y lo verás aquí.</p>}
      {invitaciones.map((i) => {
        const caducada = invitacionCaducada(i, ahora);
        const estado = caducada ? "EXPIRED" : i.status;
        return (
          <article key={i.id} className="tarjeta" style={estado === "PENDING" ? { borderColor: "var(--acc)" } : undefined} aria-label={`${INVITATION_KIND_LABEL[i.kind]} de ${quien(i)}`}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><span className="kicker">{INVITATION_KIND_LABEL[i.kind]}</span><span className="meta">{INVITATION_STATUS_LABEL[estado]} · {fmtDate(i.createdAt)}</span></div>
            <div style={{ font: "800 20px/1.15 var(--font)" }}>{i.fromUser.role === "TRAINER" && i.fromUser.trainer ? <Link href={`/entrenadores/${i.fromUser.trainer.slug}`}>{quien(i)}</Link> : quien(i)}</div>
            <div className="meta">
              {i.event ? <>Velada <Link href={`/veladas/${i.event.slug}`}>{i.event.name}</Link> · {fmtDate(i.event.date)}</> : i.onBehalfOf ? `Sparring para ${i.onBehalfOf.firstName} ${i.onBehalfOf.lastName}` : "Entrenar juntos"}
              {i.discipline ? ` · ${DISCIPLINE_LABEL[i.discipline]}` : ""}
            </div>
            {i.message && <p style={{ margin: 0 }}>«{i.message}»</p>}
            {estado === "ACCEPTED" && <p className="mut" style={{ margin: 0 }}>Has compartido con ellos: {i.contactShared ?? "tu correo"}.</p>}
            {i.reply && <div className="meta">Tu respuesta: {i.reply}</div>}
            {i.kind === "EVENT" && i.event && estado === "ACCEPTED" && <p style={{ margin: 0 }}><Link className="btn" href={`/veladas/${i.event.slug}/inscribirme`}>Inscribirme en la velada</Link></p>}
            {puedeResponderInvitacion(i, ahora) && (
              <form action={answerInvitation} style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                <input type="hidden" name="invitationId" value={i.id} />
                <label className="field"><span>Mensaje (opcional)</span><textarea name="reply" rows={2} maxLength={INVITATION_REPLY_MAX} placeholder="Gracias, cuéntame más…" /></label>
                <p className="hint" style={{ margin: 0 }}>Si aceptas, solo se comparte el contacto que has elegido abajo. Tienes hasta el {fmtDate(i.expiresAt)} para responder.</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button name="decision" value="accept" style={{ flex: 1 }}>Aceptar la invitación</button>
                  <button name="decision" value="decline" className="secondary" style={{ flex: 1 }}>Rechazar</button>
                </div>
              </form>
            )}
            <BotonBloquear accion={bloquearUsuario} origen="invitacion" id={i.id} back={RECIBIDAS} nombre={quien(i)} />
            <details>
              <summary className="mut">Denunciar esta invitación</summary>
              <form action={createReport} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <input type="hidden" name="entity" value="INVITACION" />
                <input type="hidden" name="entityId" value={i.id} />
                <input type="hidden" name="back" value={RECIBIDAS} />
                <label className="field"><span>Motivo</span>
                  <select name="reason" defaultValue="" required>
                    <option value="" disabled>Elige un motivo…</option>
                    {REASONS_BY_ENTITY.INVITACION.map((k) => <option key={k} value={k}>{REPORT_REASONS[k]}</option>)}
                  </select>
                </label>
                <label className="field"><span>Detalles (opcional)</span><input name="message" maxLength={500} /></label>
                <p className="hint" style={{ margin: 0 }}>Al denunciarla, la invitación se cierra y no se comparte ningún contacto. Un moderador la revisará y, si hace falta, pausará el envío de esa cuenta.</p>
                <button className="secondary">Enviar la denuncia</button>
              </form>
            </details>
          </article>
        );
      })}
      <section className="tarjeta" aria-labelledby="titulo-ajustes-invitaciones">
        <h2 id="titulo-ajustes-invitaciones" style={{ margin: 0, font: "800 19px/1.2 var(--font)" }}>Quién puede invitarme y cómo me contactan</h2>
        <form action={setInvitationSettings} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <input type="checkbox" name="accepts" value="1" defaultChecked={ajustes.acceptsInvitations} style={{ width: 24, height: 24 }} />
            <span>Quiero recibir invitaciones de organizaciones aprobadas y de entrenadores.</span>
          </label>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="leyenda">Si acepto una invitación, comparto…</legend>
            <div className="chips">
              <label className="chip"><input type="radio" name="channel" value="EMAIL" defaultChecked={ajustes.contactChannel === "EMAIL"} />El correo de mi cuenta</label>
              <label className="chip"><input type="radio" name="channel" value="PHONE" defaultChecked={ajustes.contactChannel === "PHONE"} />Mi teléfono</label>
              <label className="chip"><input type="radio" name="channel" value="INSTAGRAM" defaultChecked={ajustes.contactChannel === "INSTAGRAM"} />Mi Instagram</label>
            </div>
          </fieldset>
          <label className="field"><span>Teléfono (solo si eliges compartirlo)</span><input name="phone" type="tel" inputMode="tel" maxLength={20} defaultValue={ajustes.contactPhone ?? ""} autoComplete="tel" /></label>
          <label className="field"><span>Usuario de Instagram (solo si eliges compartirlo)</span><input name="instagram" maxLength={31} defaultValue={ajustes.contactInstagram ?? ""} placeholder="tuusuario" /></label>
          <p className="hint" style={{ margin: 0 }}>Nadie ve estos datos hasta que aceptas una invitación, y solo los ve quien te invitó. Puedes rechazar, bloquear o avisarnos cuando quieras.</p>
          <button>Guardar</button>
        </form>
      </section>
    </>
  );
}
