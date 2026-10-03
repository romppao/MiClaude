import Link from "next/link";
import { getUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { PROVINCES, fmtDate } from "../../lib/common/labels";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../lib/common/disciplines";
import { LIMITS, plural } from "../../lib/common/text";
import { createEvent, requestOrganizer } from "../actions/events";

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

  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
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
                <label className="field"><span>Nombre de tu organización, club o promotora</span><input name="orgName" required defaultValue={req?.orgName} maxLength={LIMITS.orgName} /></label>
                <label className="field"><span>¿Cómo podemos comprobarlo?</span><input name="message" required maxLength={LIMITS.message} /><span className="hint">Una web, una red social o una velada anterior. No escribas números de documento.</span></label>
                <button>Solicitar acceso de organizador</button>
              </form>
            </>
          )}
      </>
    );
  }

  const events = await db.event.findMany({ where: user.role === "ADMIN" ? {} : { organizerId: user.id }, orderBy: { date: "desc" }, take: 50, include: { _count: { select: { bouts: true } } } });
  return (
    <>
      <h1>Mis veladas</h1>
      <h2>Crear una velada</h2>
      <form className="search" action={createEvent}>
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Nombre de la velada</span><input name="name" required maxLength={LIMITS.eventName} /></label>
        <label className="field"><span>Fecha</span><input name="date" type="date" required min="1980-01-01" /></label>
        <label className="field"><span>Disciplina</span><select name="discipline" defaultValue="" required><option value="">Elige una disciplina</option>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select></label>
        <label className="field"><span>Nivel</span><select name="level" defaultValue="AMATEUR"><option value="AMATEUR">Amateur</option><option value="PRO">Profesional</option></select></label>
        <label className="field"><span>Recinto (opcional)</span><input name="venue" maxLength={LIMITS.venue} /><span className="hint">Si aún no lo sabes, déjalo vacío: aparecerá «Por confirmar».</span></label>
        <label className="field"><span>Ciudad</span><input name="city" maxLength={LIMITS.city} /></label>
        <label className="field"><span>Provincia</span><select name="province" defaultValue="" required><option value="">Elige una provincia</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label className="field"><span>Organiza (opcional)</span><input name="promoter" maxLength={LIMITS.promoter} /><span className="hint">El nombre que verá el público.</span></label>
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Enlace para comprar entradas (opcional)</span><input name="ticketUrl" type="url" maxLength={LIMITS.url} placeholder="https://…" /><span className="hint">Debe empezar por https://</span></label>
        <button>Crear velada</button>
      </form>
      <h2>Tus veladas</h2>
      {events.length === 0 ? <p className="mut">Aún no has creado ninguna velada. Usa el formulario de arriba para crear la primera.</p> : (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Tus veladas, de la más reciente a la más antigua</caption>
            <thead><tr><th scope="col">Velada</th><th scope="col">Fecha</th><th scope="col">Cartel</th></tr></thead>
            <tbody>
              {events.map((e) => <tr key={e.id}><th scope="row" style={{ color: "var(--text)" }}><Link href={`/organizador/${e.slug}`}>{e.name}</Link></th><td>{fmtDate(e.date)}</td><td className="mut">{plural(e._count.bouts, "combate", "combates")}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
