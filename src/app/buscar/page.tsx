import Link from "next/link";
import { db } from "../../lib/common/db";
import { flatParams } from "../../lib/common/safe";
import { searchIds } from "../../lib/common/search";
import { publicFighterName } from "../../lib/common/names";
import { fmtDate } from "../../lib/common/labels";
import { LIMITS } from "../../lib/common/text";

export const metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

const POR_GRUPO = 10;

/** Resultados de un grupo: hasta 10 y, si hay más, un enlace al listado completo con la misma búsqueda. */
function Grupo({ titulo, total, verTodos, children }: { titulo: string; total: number; verTodos: string; children: React.ReactNode }) {
  return (
    <section aria-label={titulo}>
      <h2>{titulo} ({total})</h2>
      {total === 0 ? <p className="mut">Ningún resultado en {titulo.toLowerCase()}.</p> : <ul>{children}</ul>}
      {total > POR_GRUPO && <p><Link href={verTodos}>Ver los {total} resultados de {titulo.toLowerCase()}</Link></p>}
    </section>
  );
}

export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = (flatParams(await searchParams).q ?? "").trim().slice(0, LIMITS.name);
  const [fighterIds, gymIds, trainerIds, eventIds] = q
    ? await Promise.all([searchIds("fighter", q), searchIds("gym", q), searchIds("trainer", q), searchIds("event", q)])
    : [null, null, null, null];
  const [fighters, gyms, trainers, events] = q
    ? await Promise.all([
        db.fighter.findMany({ where: { id: { in: (fighterIds ?? []).slice(0, POR_GRUPO) } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
        db.gym.findMany({ where: { id: { in: (gymIds ?? []).slice(0, POR_GRUPO) } }, orderBy: { name: "asc" } }),
        db.trainer.findMany({ where: { id: { in: (trainerIds ?? []).slice(0, POR_GRUPO) } }, orderBy: { name: "asc" } }),
        db.event.findMany({ where: { id: { in: (eventIds ?? []).slice(0, POR_GRUPO) } }, orderBy: { date: "desc" } }),
      ])
    : [[], [], [], []];
  const enlace = (ruta: string) => `${ruta}?q=${encodeURIComponent(q)}`;
  const nada = q && [fighterIds, gymIds, trainerIds, eventIds].every((r) => (r ?? []).length === 0);
  return (
    <>
      <h1>Buscar</h1>
      <form className="search" role="search" aria-label="Buscar en Ring España">
        <label className="field" style={{ flex: 1 }}>
          <span>Busca peleadores, gimnasios, entrenadores o veladas</span>
          <input name="q" defaultValue={q} maxLength={LIMITS.name} placeholder="Por ejemplo: Ana Ruiz, Vallecas o Madrid" />
          <span className="hint">Escribe una o varias palabras. No hace falta poner tildes.</span>
        </label>
        <button>Buscar</button>
      </form>
      {!q && <p className="mut">Escribe una palabra en el cuadro de búsqueda de esta página y pulsa «Buscar».</p>}
      {nada && <p>No hemos encontrado nada para «{q}». Prueba con menos palabras, o con solo el nombre o solo el apellido.</p>}
      {q && !nada && (
        <>
          <Grupo titulo="Peleadores" total={(fighterIds ?? []).length} verTodos={enlace("/peleadores")}>{fighters.map((b) => <li key={b.id}><Link href={`/peleadores/${b.slug}`}>{publicFighterName(b)}{b.alias ? ` “${b.alias}”` : ""}</Link></li>)}</Grupo>
          <Grupo titulo="Gimnasios" total={(gymIds ?? []).length} verTodos={enlace("/gimnasios")}>{gyms.map((g) => <li key={g.id}><Link href={`/gimnasios/${g.slug}`}>{g.name}</Link> <span className="mut">— {g.city}</span></li>)}</Grupo>
          <Grupo titulo="Entrenadores" total={(trainerIds ?? []).length} verTodos={enlace("/entrenadores")}>{trainers.map((t) => <li key={t.id}><Link href={`/entrenadores/${t.slug}`}>{t.name}</Link></li>)}</Grupo>
          <Grupo titulo="Veladas" total={(eventIds ?? []).length} verTodos={`${enlace("/veladas")}&past=todas`}>{events.map((e) => <li key={e.id}><Link href={`/veladas/${e.slug}`}>{e.name}</Link> <span className="mut">— {e.city}, {fmtDate(e.date)}</span></li>)}</Grupo>
        </>
      )}
    </>
  );
}
