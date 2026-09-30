import Link from "next/link";
import { getUser } from "../../lib/auth";
import { db } from "../../lib/db";
import { PROVINCES, fmtDate } from "../../lib/labels";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../lib/disciplines";
import { createEvent, requestOrganizer } from "../actions";

export const metadata = { title: "Organizadores" };
export const dynamic = "force-dynamic";

export default async function Organizer({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await getUser();
  const { error, ok } = await searchParams;
  if (!user) return <><h1>Organizadores</h1><p><Link href="/entrar">Entra</Link> o <Link href="/registro">regístrate</Link> para publicar veladas.</p></>;

  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
    const req = await db.organizerRequest.findUnique({ where: { userId: user.id } });
    return (
      <>
        <h1>Publica tus veladas</h1>
        <p className="mut">Los organizadores (promotoras, clubes, federaciones) publican carteles y resultados verificados. Un moderador revisa cada solicitud.</p>
        {ok && <p className="W">Solicitud enviada.</p>}
        {error && <p className="L">Indica el nombre de tu organización.</p>}
        {req?.status === "PENDING" ? <p>Tu solicitud de «{req.orgName}» está pendiente de revisión.</p>
          : !user.emailVerifiedAt ? <p>Primero <Link href="/verificar">verifica tu email</Link>.</p>
          : (
            <form className="search" action={requestOrganizer} style={{ flexDirection: "column", maxWidth: 420 }}>
              {req?.status === "REJECTED" && <p className="L">Tu solicitud anterior fue rechazada. Puedes enviar otra con más información.</p>}
              <input name="orgName" placeholder="Organización / club / promotora" required defaultValue={req?.orgName} />
              <input name="message" placeholder="Cómo podemos comprobarlo (web, redes, licencia…)" />
              <button>Solicitar acceso de organizador</button>
            </form>
          )}
      </>
    );
  }

  const events = await db.event.findMany({ where: user.role === "ADMIN" ? {} : { organizerId: user.id }, orderBy: { date: "desc" }, take: 50, include: { _count: { select: { bouts: true } } } });
  return (
    <>
      <h1>Mis veladas</h1>
      {error && <p className="L">Revisa nombre y fecha.</p>}
      <table><tbody>
        {events.map((e) => <tr key={e.id}><td><Link href={`/organizador/${e.slug}`}>{e.name}</Link></td><td>{fmtDate(e.date)}</td><td className="mut">{e._count.bouts} combates</td></tr>)}
      </tbody></table>
      {events.length === 0 && <p className="mut">Aún no has creado ninguna velada.</p>}
      <h2>Nueva velada</h2>
      <form className="search" action={createEvent}>
        <input name="name" placeholder="Nombre de la velada" required />
        <input name="date" type="date" required />
        <label className="field"><span>Disciplina</span><select name="discipline" defaultValue="BOXEO">{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select></label>
        <select name="level" defaultValue="AMATEUR"><option value="AMATEUR">Amateur</option><option value="PRO">Profesional</option></select>
        <input name="venue" placeholder="Recinto" />
        <input name="city" placeholder="Ciudad" defaultValue="Madrid" />
        <select name="province" defaultValue="Madrid">{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
        <input name="promoter" placeholder="Organiza (opcional)" />
        <input name="ticketUrl" placeholder="Enlace de entradas (https://…)" />
        <button>Crear velada</button>
      </form>
    </>
  );
}
