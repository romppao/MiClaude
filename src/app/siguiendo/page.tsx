import Link from "next/link";
import { textoResultado } from "../_inicio/comun";
import { requireUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { LEVEL_LABEL, fmtDate } from "../../lib/common/labels";
import { eventDayReached } from "../../lib/common/dates";
import { publicFighterName } from "../../lib/common/names";
import { plural } from "../../lib/common/text";
import { fechaInicioEnRecord } from "../../lib/common/record-time";
import { toggleFollow } from "../actions/community";
import { filtrosSiguiendo } from "../../lib/community/siguiendo";
import { recordHidden } from "../../lib/fighters/privacy";

export const metadata = { title: "Peleadores que sigo" };
export const dynamic = "force-dynamic";

export default async function Following() {
  const user = await requireUser("/siguiendo");
  const ahora = new Date();
  const follows = await db.follow.findMany({ where: { userId: user.id, fighter: { hiddenAt: null } }, include: { fighter: { include: { gym: true } } }, orderBy: { createdAt: "desc" } });
  const ids = follows.map((f) => f.fighterId);
  // Solo veladas públicas: ni canceladas, ni pendientes de autorizar, ni rechazadas. Los resultados, solo los que cuentan en el récord.
  const filtros = filtrosSiguiendo(ids, ahora);
  const incluir = { event: true, fighterA: true, fighterB: true } as const;
  const [proximos, celebrados] = ids.length
    ? await Promise.all([
        db.bout.findMany({ where: filtros.proximos, include: incluir, orderBy: { event: { date: "asc" } } }),
        db.bout.findMany({ where: filtros.resultados, include: incluir, orderBy: [{ event: { date: "desc" } }, { id: "asc" }], take: 30 }),
      ])
    : [[], []];
  // «Próximos» y «celebrados» usan la misma definición de «ya celebrada» que el resto de la aplicación (día de Madrid).
  const upcoming = proximos.filter((b) => !eventDayReached(b.event.date) || !b.result);
  const recent = celebrados.filter((b) => eventDayReached(b.event.date)).slice(0, 10);
  // Igual que en la ficha de la velada: un resultado amateur no revela el récord que alguno de los dos mantiene privado (T-016, C3-01).
  const resultadoOculto = (b: (typeof celebrados)[number]) =>
    recordHidden(b.event.level, b.fighterA.recordPublic, false) ||
    recordHidden(b.event.level, b.fighterB.recordPublic, false);
  const fights = (b: (typeof proximos)[number]) => `${publicFighterName(b.fighterA)} contra ${publicFighterName(b.fighterB)}`;

  return (
    <div className="pantalla inicio-adaptable">
      <h1>Peleadores que sigo</h1>
      {follows.length === 0 ? (
        <>
          <p>Todavía no sigues a ningún peleador. Cuando sigas a alguien, aquí verás sus próximas veladas y sus últimos resultados.</p>
          <p><Link href="/ranking">Ver el ránking</Link> · <Link href="/peleadores">Buscar peleadores</Link></p>
        </>
      ) : (
        <>
          <h2>Próximos combates</h2>
          {upcoming.length === 0 ? <p className="mut">Ninguno de los peleadores que sigues tiene un combate programado por ahora.</p> : (
            <div className="tarjeta" aria-label="Próximos combates de los peleadores que sigues">
              {upcoming.map((b) => <div key={b.id} className="fila"><span className="cuerpo"><strong>{fights(b)}</strong><span>{fmtDate(b.event.date)} · <Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link> · {LEVEL_LABEL[b.event.level]}</span><span className="meta">Programado</span></span></div>)}
            </div>
          )}
          <h2>Últimos resultados</h2>
          {recent.length === 0 ? <p className="mut">Aún no hay resultados recientes.</p> : (
            <div className="tarjeta" aria-label="Combates recientes de los peleadores que sigues">
              {recent.map((b) => <div key={b.id} className="fila"><span className="cuerpo"><strong>{fights(b)}</strong><span>{fmtDate(b.event.date)} · <Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link></span>
                <span>{resultadoOculto(b) ? "Récord amateur privado" : textoResultado(b)}</span>
                <span className="meta">{b.verification === "SELF_REPORTED" ? `Declarado: cuenta a partir del ${fechaInicioEnRecord(b.createdAt).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}` : b.verification === "VERIFIED" ? "Verificado" : "Confirmado por el rival"}</span>
              </span></div>)}
            </div>
          )}
          <h2>Peleadores que sigues ({follows.length})</h2>
          <div className="lista">
            {follows.map((f) => (
              <div key={f.fighterId} className="tarjeta">
                <Link href={`/peleadores/${f.fighter.slug}`}><strong>{publicFighterName(f.fighter)}</strong></Link>
                <div className="mut">{f.fighter.gym?.name ?? f.fighter.city ?? ""}</div>
                <form action={toggleFollow} style={{ marginTop: 8 }}>
                  <input type="hidden" name="fighterId" value={f.fighterId} /><input type="hidden" name="back" value="/siguiendo" />
                  <button className="secondary" aria-label={`Dejar de seguir a ${publicFighterName(f.fighter)}`}>Dejar de seguir</button>
                </form>
              </div>
            ))}
          </div>
          <p className="mut">Sigues a {plural(follows.length, "peleador", "peleadores")}. {user.notifyEmails ? "Recibirás un correo cuando un organizador publique un nuevo combate de alguno de ellos." : <>No recibirás correos con sus novedades porque tienes los avisos desactivados. Puedes activarlos en <Link href="/mi-cuenta">Mi cuenta</Link>.</>}</p>
        </>
      )}
    </div>
  );
}
