import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { CLASS_KIND_LABEL, classMeta } from "../../lib/trainers/classes";
import { answerClassRequest, createClass, toggleClass } from "../actions/trainers";
import { REQUEST_REPLY_MAX, REQUEST_STATUS_LABEL } from "../../lib/trainers/requests";
import { fmtDate } from "../../lib/common/labels";
import CamposClase from "../components/CamposClase";
import Icono from "../components/Icono";

export const metadata = { title: "Mis clases" };
export const dynamic = "force-dynamic";

/** «Mis clases» del entrenador (diseño v3): sus clases, pausarlas o activarlas, y crear otra. */
export default async function MisClases() {
  const user = await requireUser("/mis-clases");
  const trainer = await db.trainer.findUnique({ where: { userId: user.id }, include: { classes: { orderBy: [{ active: "desc" }, { createdAt: "asc" }] } } });
  if (!trainer) redirect(user.role === "TRAINER" ? "/" : "/registro?tipo=entrenador");
  const solicitudes = await db.classRequest.findMany({ where: { class: { trainerId: trainer.id }, OR: [{ status: "PENDING" }, { createdAt: { gte: new Date(Date.now() - 60 * 864e5) } }] }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 50, include: { class: true, user: { select: { name: true, email: true } } } });
  const pendientes = solicitudes.filter((r) => r.status === "PENDING");
  return (
    <div className="pantalla">
      <div className="cabecera-pantalla" style={{ justifyContent: "center" }}><span className="titulo" aria-hidden="true">Mis clases</span></div>
      {/* Solicitudes de las clases (petición del fundador, 8 de octubre de 2026): primero las que esperan respuesta. */}
      <section id="solicitudes" aria-labelledby="titulo-solicitudes" style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 80 }}>
        <div className="titulo-seccion"><h1 id="titulo-solicitudes" style={{ margin: 0 }}>Solicitudes</h1><span className="meta">{pendientes.length === 1 ? "1 esperando respuesta" : `${pendientes.length} esperando respuesta`}</span></div>
        {solicitudes.length === 0 && <p className="mut" style={{ margin: 0 }}>Cuando alguien solicite una de tus clases, aparecerá aquí y te llegará un correo.</p>}
        {solicitudes.map((r) => (
          <article key={r.id} className="tarjeta" style={r.status === "PENDING" ? { borderColor: "var(--acc)" } : undefined} aria-label={`Solicitud de ${r.user.name} para ${r.class.title}`}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><strong>{r.user.name}</strong><span className="meta">{REQUEST_STATUS_LABEL[r.status]} · {fmtDate(r.createdAt)}</span></div>
            <div className="meta">{r.class.title}</div>
            <div>Le viene bien: {r.preferred}</div>
            {r.message && <p style={{ margin: 0 }}>«{r.message}»</p>}
            <div className="meta">Contacto: <a href={`mailto:${r.user.email}`}>{r.user.email}</a>{r.phone ? <> · <a href={`tel:${r.phone}`}>{r.phone}</a></> : null}</div>
            {r.reply && <div className="meta">Tu respuesta: {r.reply}</div>}
            {r.status === "PENDING" && (
              <form action={answerClassRequest} style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                <input type="hidden" name="requestId" value={r.id} />
                <label className="field"><span>Mensaje para {r.user.name} (opcional)</span><textarea name="reply" rows={2} maxLength={REQUEST_REPLY_MAX} placeholder="Día y hora, dónde es, qué tiene que traer…" /></label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button name="decision" value="aceptar" style={{ flex: 1 }}>Aceptar la clase</button>
                  <button name="decision" value="rechazar" className="secondary" style={{ flex: 1 }}>No puedo darla</button>
                </div>
              </form>
            )}
          </article>
        ))}
      </section>
      <div>
        <h2 style={{ font: "800 28px var(--font)" }}>Tus clases</h2>
        <p className="lead">Pausa una clase para ocultarla de tu perfil sin borrarla.</p>
      </div>
      {trainer.classes.map((c) => (
        <section key={c.id} className="tarjeta" style={{ opacity: c.active ? 1 : 0.6 }} aria-label={`${c.title}, ${c.active ? "publicada" : "en pausa"}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className={`pildora ${c.kind === "INDIVIDUAL" ? "pildora-acc" : "pildora-violeta"}`}>{CLASS_KIND_LABEL[c.kind]}</span><span style={{ font: "800 26px var(--font)", letterSpacing: "-.03em" }}>{c.priceEuros} €</span></div>
          <div><h2 style={{ font: "700 18px/1.2 var(--font)" }}>{c.title}</h2><div className="meta">{classMeta(c)}{c.discipline ? ` · ${DISCIPLINE_LABEL[c.discipline]}` : ""}{c.capacity ? ` · ${c.capacity} plazas` : ""}</div></div>
          <form action={toggleClass} style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <input type="hidden" name="classId" value={c.id} /><input type="hidden" name="activar" value={c.active ? "0" : "1"} />
            <span className="meta" style={{ flex: 1 }}>{c.active ? "Publicada" : "En pausa"}</span>
            <button className="secondary" aria-label={`${c.active ? "Pausar" : "Activar"} la clase «${c.title}»`}>{c.active ? "Pausar" : "Activar"}</button>
          </form>
        </section>
      ))}
      {trainer.classes.length === 0 && <p className="mut">Todavía no has publicado ninguna clase.</p>}
      <section id="nueva" className="tarjeta" aria-labelledby="titulo-nueva-clase" style={{ gap: 16 }}>
        <h2 id="titulo-nueva-clase" style={{ font: "800 24px var(--font)" }}>Crear una clase</h2>
        <form action={createClass} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {trainer.disciplines.length > 1 && <label className="field"><span>Disciplina</span><select name="discipline" defaultValue={trainer.disciplines[0]}>{trainer.disciplines.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select></label>}
          <CamposClase />
          <button className="btn-grande"><Icono nombre="mas" />Publicar la clase</button>
        </form>
      </section>
      <Link href={`/entrenadores/${trainer.slug}`} className="btn secondary">Ver mi perfil público</Link>
    </div>
  );
}
