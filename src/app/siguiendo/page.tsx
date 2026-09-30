import Link from "next/link";
import { requireUser } from "../../lib/auth";
import { db } from "../../lib/db";
import { LEVEL_LABEL, fmtDate } from "../../lib/labels";

export const metadata = { title: "Mis boxeadores" };
export const dynamic = "force-dynamic";

export default async function Following() {
  const user = await requireUser();
  const follows = await db.follow.findMany({ where: { userId: user.id }, include: { boxer: { include: { gym: true } } }, orderBy: { createdAt: "desc" } });
  const ids = follows.map((f) => f.boxerId);
  const bouts = ids.length
    ? await db.bout.findMany({
        where: { verification: { not: "DISPUTED" }, event: { status: { not: "CANCELLED" } }, OR: [{ boxerAId: { in: ids } }, { boxerBId: { in: ids } }] },
        include: { event: true, boxerA: true, boxerB: true }, orderBy: { event: { date: "asc" } },
      })
    : [];
  const now = Date.now();
  const upcoming = bouts.filter((b) => b.event.date.getTime() >= now - 864e5);
  const recent = bouts.filter((b) => b.event.date.getTime() < now - 864e5 && b.result).slice(-10).reverse();
  const fights = (b: (typeof bouts)[number]) => `${b.boxerA.firstName} ${b.boxerA.lastName} vs ${b.boxerB.firstName} ${b.boxerB.lastName}`;

  return (
    <>
      <h1>Mis boxeadores</h1>
      {follows.length === 0 ? (
        <>
          <p>Todavía no sigues a ningún boxeador. Cuando sigas a alguien, aquí verás sus próximas veladas y sus últimos resultados.</p>
          <p><Link href="/ranking">Ver el ránking</Link> · <Link href="/boxeadores">Buscar boxeadores</Link></p>
        </>
      ) : (
        <>
          <h2>Próximos combates</h2>
          {upcoming.length === 0 ? <p className="mut">Ninguno de los boxeadores que sigues tiene un combate programado por ahora.</p> : (
            <table><tbody>
              {upcoming.map((b) => (
                <tr key={b.id}>
                  <td>{fmtDate(b.event.date)}</td>
                  <td>{fights(b)}</td>
                  <td><Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link> <span className={`tag ${b.event.level}`}>{LEVEL_LABEL[b.event.level]}</span></td>
                </tr>
              ))}
            </tbody></table>
          )}
          <h2>Últimos resultados</h2>
          {recent.length === 0 ? <p className="mut">Aún no hay resultados recientes.</p> : (
            <table><tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td>{b.event.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</td>
                  <td>{fights(b)}</td>
                  <td>{b.result === "DRAW" ? "Empate" : b.result === "NO_CONTEST" ? "Sin decisión" : `Gana ${b.result === "A_WIN" ? b.boxerA.firstName + " " + b.boxerA.lastName : b.boxerB.firstName + " " + b.boxerB.lastName}`}</td>
                </tr>
              ))}
            </tbody></table>
          )}
          <h2>Boxeadores que sigues ({follows.length})</h2>
          <div className="grid">
            {follows.map((f) => (
              <Link key={f.boxerId} href={`/boxeadores/${f.boxer.slug}`} className="card">
                <strong>{f.boxer.firstName} {f.boxer.lastName}</strong>
                <div className="mut">{f.boxer.gym?.name ?? f.boxer.city ?? ""}</div>
              </Link>
            ))}
          </div>
          <p className="mut">Recibirás un correo cuando un organizador publique un nuevo combate de alguno de ellos. Para dejar de seguir a alguien, entra en su ficha.</p>
        </>
      )}
    </>
  );
}
