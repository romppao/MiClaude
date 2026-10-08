import Link from "next/link";
import { getUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { EVENT_KIND_AYUDA, EVENT_KIND_LABEL, PROVINCES, fmtDate } from "../../lib/common/labels";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../lib/common/disciplines";
import { LIMITS, plural } from "../../lib/common/text";
import { createEvent, requestOrganizer } from "../actions/events";
import { TIPOS_DE_ENTIDAD, TIPO_DE_ENTIDAD_ETIQUETA, puedeOrganizar } from "../../lib/accounts/landing";

export const metadata = { title: "Organizadores" };
export const dynamic = "force-dynamic";

export default async function Organizer() {
  const user = await getUser();
  if (!user) {
    return (
      <>
        <h1>Organizadores de veladas</h1>
        <p>Si organizas veladas, puedes publicar tus carteles y resultados verificados en Ring España. Para pedirlo necesitas una cuenta.</p>
        <p className="acciones"><Link href="/registro" className="btn">Crear mi cuenta</Link><Link href="/entrar?next=%2Forganizador" className="btn secondary">Ya tengo cuenta: entrar</Link></p>
      </>
    );
  }

  if (!puedeOrganizar(user.role)) {
    const req = await db.organizerRequest.findUnique({ where: { userId: user.id } });
    return (
      <>
        <h1>Publica tus veladas</h1>
        <p className="mut">Los organizadores (promotoras, clubes, federaciones) publican carteles y resultados verificados. Un moderador revisa cada solicitud y te responderá por correo electrónico y en esta misma página.</p>
        {req?.status === "PENDING" ? <p>Tu solicitud de «{req.orgName}» está pendiente de revisión. Vuelve a esta página cuando quieras para ver la respuesta.</p>
          : !user.emailVerifiedAt ? <p>Primero <Link href="/verificar">confirma tu correo electrónico</Link> para poder enviar la solicitud.</p>
          : (
            <>
              {req?.status === "REJECTED" && (
                <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>Tu solicitud anterior fue rechazada{req.reviewNote ? <>. Motivo: {req.reviewNote}</> : ""}. Puedes enviar otra con más información.</div>
              )}
              <form className="search" action={requestOrganizer} style={{ flexDirection: "column", maxWidth: 480, alignItems: "stretch" }}>
                <label className="field"><span>Nombre de tu entidad</span><input name="orgName" required defaultValue={req?.orgName} maxLength={LIMITS.orgName} /></label>
                <label className="field"><span>Tipo de entidad</span>
                  <select name="entityKind" defaultValue={req?.kind ?? "PROMOTORA"} required>
                    {TIPOS_DE_ENTIDAD.map((k) => <option key={k} value={k}>{TIPO_DE_ENTIDAD_ETIQUETA[k]}</option>)}
                  </select>
                </label>
                <label className="field"><span>Web o red social (opcional)</span><input name="website" type="url" inputMode="url" defaultValue={req?.website ?? ""} maxLength={LIMITS.url} /><span className="hint">Empieza por https://</span></label>
                <label className="field"><span>¿Cómo podemos comprobarlo?</span><input name="message" required maxLength={LIMITS.message} /><span className="hint">Una web, una red social o una velada anterior. No escribas números de documento.</span></label>
                <button>Solicitar acceso de organizador</button>
              </form>
            </>
          )}
      </>
    );
  }

  const entrenador = user.role === "TRAINER";
  const events = await db.event.findMany({ where: user.role === "ADMIN" ? {} : { organizerId: user.id }, orderBy: { date: "desc" }, take: 50, include: { _count: { select: { bouts: true } } } });
  return (
    <>
      <h1>{entrenador ? "Mis veladas e interclubs" : "Mis veladas"}</h1>
      {entrenador && <p className="mut">Como entrenador puedes organizar veladas e interclubs con tu club: crea el evento, monta el cartel y publica los resultados.</p>}
      {!user.emailVerifiedAt && <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>Para crear veladas primero <Link href="/verificar">confirma tu correo electrónico</Link>.</div>}
      <h2 id="crear">Crear una velada o un interclub</h2>
      <form className="search" action={createEvent}>
        <fieldset className="field" style={{ flexBasis: "100%", border: 0, padding: 0, margin: 0 }}>
          <legend className="leyenda">Tipo de evento</legend>
          <div className="chips">{(["VELADA", "INTERCLUB"] as const).map((k) => <label key={k} className="chip"><input type="radio" name="kind" value={k} defaultChecked={k === "VELADA"} />{EVENT_KIND_LABEL[k]}</label>)}</div>
          <span className="hint">Velada: {EVENT_KIND_AYUDA.VELADA.toLowerCase()} Interclub: {EVENT_KIND_AYUDA.INTERCLUB.toLowerCase()}</span>
        </fieldset>
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Nombre del evento</span><input name="name" required maxLength={LIMITS.eventName} /></label>
        <label className="field"><span>Fecha</span><input name="date" type="date" required min="1980-01-01" /></label>
        <label className="field"><span>Disciplina</span><select name="discipline" defaultValue="" required><option value="">Elige una disciplina</option>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select></label>
        <label className="field"><span>Nivel</span><select name="level" defaultValue="AMATEUR"><option value="AMATEUR">Amateur</option><option value="PRO">Profesional</option></select></label>
        <label className="field"><span>Recinto (opcional)</span><input name="venue" maxLength={LIMITS.venue} /><span className="hint">Si aún no lo sabes, déjalo vacío: aparecerá «Por confirmar».</span></label>
        <label className="field"><span>Ciudad</span><input name="city" maxLength={LIMITS.city} /></label>
        <label className="field"><span>Provincia</span><select name="province" defaultValue="" required><option value="">Elige una provincia</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label className="field"><span>Organiza (opcional)</span><input name="promoter" maxLength={LIMITS.promoter} /><span className="hint">El nombre que verá el público.</span></label>
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Enlace para comprar entradas (opcional)</span><input name="ticketUrl" type="url" maxLength={LIMITS.url} placeholder="https://…" /><span className="hint">Debe empezar por https://</span></label>
        <button>Crear el evento</button>
      </form>
      <h2>Tus veladas</h2>
      {events.length === 0 ? <p className="mut">Aún no has creado ninguna velada. Usa el formulario de arriba para crear la primera.</p> : (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Tus veladas, de la más reciente a la más antigua</caption>
            <thead><tr><th scope="col">Evento</th><th scope="col">Tipo</th><th scope="col">Fecha</th><th scope="col">Cartel</th></tr></thead>
            <tbody>
              {events.map((e) => <tr key={e.id}><th scope="row" style={{ color: "var(--text)" }}><Link href={`/organizador/${e.slug}`}>{e.name}</Link></th><td>{EVENT_KIND_LABEL[e.kind]}</td><td>{fmtDate(e.date)}</td><td className="mut">{plural(e._count.bouts, "combate", "combates")}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
