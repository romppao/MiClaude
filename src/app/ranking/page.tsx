import Link from "next/link";
import { auraRanking, NO_CATEGORY } from "../../lib/aura/ranking";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, isDiscipline, isLevel, LEVEL_ORDER, levelName, weightClassLabel } from "../../lib/common/disciplines";
import { PROVINCES } from "../../lib/common/labels";

export const metadata = { title: "Ránking de aura" };
export const dynamic = "force-dynamic";

export default async function Ranking({ searchParams }: { searchParams: Promise<{ disciplina?: string; nivel?: string; provincia?: string; periodo?: string }> }) {
  const { disciplina, nivel, provincia, periodo } = await searchParams;
  const discipline = disciplina && isDiscipline(disciplina) ? disciplina : "BOXEO"; // el boxeo va en cabeza
  const level = nivel && isLevel(nivel) ? nivel : undefined; // sin nivel: se enseñan los dos, cada uno con sus categorías
  const province = provincia === undefined ? "Madrid" : provincia === "all" ? undefined : provincia;
  const recientes = periodo === "90";
  const groups = await auraRanking({ discipline, level, province, sinceDays: recientes ? 90 : undefined });
  return (
    <>
      <h1>Ránking de aura</h1>
      <p className="mut">El aura es el reconocimiento del público a una actuación. Este ránking mide el aura recibida, no las victorias ni una clasificación deportiva oficial. Puedes consultar el récord y el respaldo de los resultados en la ficha de cada peleador.</p>
      <details>
        <summary>¿Cómo se calcula el ránking?</summary>
        <ul>
          <li>Cada aura vale un punto. Se suman las recibidas en combates de la disciplina elegida; no se cuentan las de combates en revisión ni de veladas canceladas.</li>
          <li>Se agrupa por el nivel y la categoría actuales de la ficha, separando profesional y amateur. Solo aparecen fichas públicas con aura.</li>
          <li>La zona corresponde a la provincia de la ficha del peleador.</li>
          <li>«Últimos 90 días» cuenta el aura dada en ese periodo, aunque el combate sea anterior.</li>
          <li>Con los mismos puntos se comparte puesto: 1, 1, 3. Los nombres empatados se muestran en orden alfabético.</li>
          <li>El total no se divide por el número de combates: más actividad o público puede dar lugar a más aura.</li>
        </ul>
        <p><Link href="/ayuda#respaldo">Qué respaldo tienen los resultados</Link>.</p>
      </details>
      <form className="search">
        <label className="field"><span>Disciplina</span>
          <select name="disciplina" defaultValue={discipline}>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select>
        </label>
        <label className="field"><span>Nivel</span>
          <select name="nivel" defaultValue={level ?? ""}><option value="">Profesional y amateur</option>{LEVEL_ORDER.map((n) => <option key={n} value={n}>{levelName(n)}</option>)}</select>
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
        <section key={`${g.level}-${g.weightClass ?? "sin"}`}>
          <h2>{DISCIPLINE_LABEL[discipline]} · {levelName(g.level)} · {g.weightClass ? weightClassLabel(discipline, g.level, g.weightClass) : NO_CATEGORY}</h2>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Ránking de aura">
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
</div>
        </section>
      ))}
      {groups.length === 0 && <p className="mut">No hay aura con esta disciplina, nivel, zona y periodo. Puedes <Link href={`/ranking?disciplina=${discipline}&provincia=all`}>ver esta disciplina en toda España y en todo el tiempo</Link> o <Link href={`/peleadores?disciplina=${discipline}`}>buscar un peleador</Link> para reconocer su actuación en un combate que hayas visto.</p>}
    </>
  );
}
