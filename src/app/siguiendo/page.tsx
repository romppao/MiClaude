import Link from "next/link";
import { requireUser } from "../../lib/auth";
import { db } from "../../lib/db";
import { LEVEL_LABEL, METHOD_LABEL, fmtDate } from "../../lib/labels";
import { eventDayReached } from "../../lib/dates";
import { publicFighterName } from "../../lib/names";
import { plural } from "../../lib/text";
import VerificationTag from "../VerificationTag";
import { toggleFollow } from "../actions";

export const metadata = { title: "Mis peleadores" };
export const dynamic = "force-dynamic";

export default async function Following() {
  const user = await requireUser();
  const follows = await db.follow.findMany({ where: { userId: user.id, fighter: { hiddenAt: null } }, include: { fighter: { include: { gym: true } } }, orderBy: { createdAt: "desc" } });
  const ids = follows.map((f) => f.fighterId);
  const bouts = ids.length
    ? await db.bout.findMany({
        where: { verification: { not: "DISPUTED" }, event: { status: { not: "CANCELLED" } }, OR: [{ fighterAId: { in: ids } }, { fighterBId: { in: ids } }] },
        include: { event: true, fighterA: true, fighterB: true }, orderBy: { event: { date: "asc" } },
      })
    : [];
  // «Próximos» y «celebrados» usan la misma definición de «ya celebrada» que el resto de la aplicación (día de Madrid).
  const upcoming = bouts.filter((b) => !eventDayReached(b.event.date) || !b.result);
  const recent = bouts.filter((b) => eventDayReached(b.event.date) && b.result).slice(-10).reverse();
  const fights = (b: (typeof bouts)[number]) => `${publicFighterName(b.fighterA)} contra ${publicFighterName(b.fighterB)}`;

  return (
    <>
      <h1>Mis peleadores</h1>
      {follows.length === 0 ? (
        <>
          <p>Todavía no sigues a ningún peleador. Cuando sigas a alguien, aquí verás sus próximas veladas y sus últimos resultados.</p>
          <p><Link href="/ranking">Ver el ránking</Link> · <Link href="/peleadores">Buscar peleadores</Link></p>
        </>
      ) : (
        <>
          <h2>Próximos combates</h2>
          {upcoming.length === 0 ? <p className="mut">Ninguno de los peleadores que sigues tiene un combate programado por ahora.</p> : (
            <table>
              <caption className="sr-only">Próximos combates de los peleadores que sigues</caption>
              <thead><tr><th scope="col">Fecha</th><th scope="col">Combate</th><th scope="col">Velada</th><th scope="col">Respaldo</th></tr></thead>
              <tbody>
                {upcoming.map((b) => (
                  <tr key={b.id}>
                    <td>{fmtDate(b.event.date)}</td>
                    <td>{fights(b)}</td>
                    <td><Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link> <span className={`tag ${b.event.level}`}>{LEVEL_LABEL[b.event.level]}</span></td>
                    <td><VerificationTag verification={b.verification} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h2>Últimos resultados</h2>
          {recent.length === 0 ? <p className="mut">Aún no hay resultados recientes.</p> : (
            <table>
              <caption className="sr-only">Últimos resultados de los peleadores que sigues</caption>
              <thead><tr><th scope="col">Fecha</th><th scope="col">Combate</th><th scope="col">Resultado</th><th scope="col">Respaldo</th></tr></thead>
              <tbody>
                {recent.map((b) => (
                  <tr key={b.id}>
                    <td>{b.event.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</td>
                    <td>{fights(b)}</td>
                    <td>{b.result === "DRAW" ? "Empate" : b.result === "NO_CONTEST" ? "Sin decisión" : `Gana ${publicFighterName(b.result === "A_WIN" ? b.fighterA : b.fighterB)}`}{b.method && b.result !== "DRAW" && b.result !== "NO_CONTEST" ? ` (${METHOD_LABEL[b.method]})` : ""}</td>
                    <td><VerificationTag verification={b.verification} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h2>Peleadores que sigues ({follows.length})</h2>
          <div className="grid">
            {follows.map((f) => (
              <div key={f.fighterId} className="card">
                <Link href={`/peleadores/${f.fighter.slug}`}><strong>{publicFighterName(f.fighter)}</strong></Link>
                <div className="mut">{f.fighter.gym?.name ?? f.fighter.city ?? ""}</div>
                <form action={toggleFollow} style={{ marginTop: 8 }}>
                  <input type="hidden" name="fighterId" value={f.fighterId} /><input type="hidden" name="back" value="/siguiendo" />
                  <button className="secondary" aria-label={`Dejar de seguir a ${publicFighterName(f.fighter)}`}>Dejar de seguir</button>
                </form>
              </div>
            ))}
          </div>
          <p className="mut">Sigues a {plural(follows.length, "peleador", "peleadores")}. Recibirás un correo cuando un organizador publique un nuevo combate de alguno de ellos.</p>
        </>
      )}
    </>
  );
}
