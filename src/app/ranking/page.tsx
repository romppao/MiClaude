import Link from "next/link";
import { auraRanking, NO_CATEGORY } from "../../lib/aura/ranking";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, isDiscipline } from "../../lib/common/disciplines";
import { PROVINCES } from "../../lib/common/labels";

export const metadata = { title: "Ránking de aura" };
export const dynamic = "force-dynamic";

export default async function Ranking({ searchParams }: { searchParams: Promise<{ disciplina?: string; provincia?: string; periodo?: string }> }) {
  const { disciplina, provincia, periodo } = await searchParams;
  const discipline = disciplina && isDiscipline(disciplina) ? disciplina : "BOXEO"; // el boxeo va en cabeza
  const province = provincia === undefined ? "Madrid" : provincia === "all" ? undefined : provincia;
  const recientes = periodo === "90";
  const groups = await auraRanking({ discipline, province, sinceDays: recientes ? 90 : undefined });
  return (
    <>
      <h1>Ránking de aura</h1>
      <p className="mut">El aura es el reconocimiento del público. Cada persona puede dar aura a un peleador una vez por cada combate que ha visto. Aquí se ordenan los peleadores de cada categoría según el aura que han recibido.</p>
      <form className="search">
        <label className="field"><span>Disciplina</span>
          <select name="disciplina" defaultValue={discipline}>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select>
        </label>
        <label className="field"><span>Zona</span>
          <select name="provincia" defaultValue={province ?? "all"}><option value="all">Toda España</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
        </label>
        <label className="field"><span>Periodo</span>
          <select name="periodo" defaultValue={recientes ? "90" : "todo"}><option value="todo">Todo el tiempo</option><option value="90">Últimos 90 días</option></select>
        </label>
        <button>Ver ránking</button>
      </form>
      {groups.map((g) => (
        <section key={g.weightClass ?? "sin"}>
          <h2>{DISCIPLINE_LABEL[discipline]} · {g.weightClass ?? NO_CATEGORY}</h2>
          <table>
            <thead><tr><th>Puesto</th><th>Peleador</th><th>Aura</th></tr></thead>
            <tbody>
              {g.entries.map((r) => (
                <tr key={r.fighterId}>
                  <td>{r.position}</td>
                  <td><Link href={`/peleadores/${r.slug}`}>{r.name}</Link></td>
                  <td><strong>{r.aura}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {groups.length === 0 && <p className="mut">Todavía nadie ha recibido aura en esta disciplina y zona. Puedes darla desde la ficha de un peleador, en el combate que hayas visto.</p>}
    </>
  );
}
