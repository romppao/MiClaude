import Link from "next/link";
import { auraRanking, NO_CATEGORY } from "../../lib/aura/ranking";
import { divisionLabel } from "../../lib/common/competition";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, isDiscipline, isLevel, LEVEL_ORDER, levelName, weightClassLabel } from "../../lib/common/disciplines";
import { PROVINCES } from "../../lib/common/labels";

export const metadata = { title: "Ránking de aura" };
export const dynamic = "force-dynamic";

export default async function Ranking({ searchParams }: { searchParams: Promise<{ disciplina?: string; nivel?: string; provincia?: string; periodo?: string }> }) {
  const { disciplina, nivel, provincia, periodo } = await searchParams;
  const discipline = disciplina && isDiscipline(disciplina) ? disciplina : undefined;
  const level = nivel && isLevel(nivel) ? nivel : undefined; // sin nivel: se enseñan los dos, cada uno con sus categorías
  const province = provincia && PROVINCES.includes(provincia) ? provincia : undefined;
  const recientes = periodo === "90";
  const groups = await auraRanking({ discipline, level, province, sinceDays: recientes ? 90 : undefined });
  return (
    <>
      <h1>Ránking de aura</h1>
      <p className="mut">El aura combina trayectoria, respaldo opcional y reconocimiento de la comunidad. No es una clasificación deportiva oficial. Puedes consultar el récord y el respaldo de los resultados en la ficha de cada peleador.</p>
      <details>
        <summary>¿Cómo se calcula el ránking?</summary>
        <ul>
          <li>Cada reconocimiento de la comunidad vale un punto. Se añade el título con mayor aporte de la categoría y los respaldos comprobados. La confirmación del rival es opcional; una revisión decidida por moderación o una cancelación excluye el combate.</li>
          <li>Se agrupa por el nivel, la división de edad y categoría y el peso guardados en cada combate o título. Cambiar la ficha no traslada el aura histórica. Las divisiones sin confirmar quedan separadas. Solo aparecen fichas públicas con aura; los títulos sin respaldo se indican como declarados.</li>
          <li>La zona corresponde a la provincia de la ficha del peleador.</li>
          <li>«Últimos 90 días» limita los reconocimientos de la comunidad al periodo; la trayectoria y sus respaldos se mantienen.</li>
          <li>Con los mismos puntos se comparte puesto: 1, 1, 3. Los nombres empatados se muestran en orden alfabético.</li>
          <li>El total no se divide por el número de combates: más actividad o público puede dar lugar a más aura.</li>
        </ul>
        <p><Link href="/ayuda#aura">Escala de puntos y respaldos</Link>.</p>
      </details>
      <form className="search">
        <label className="field"><span>Disciplina</span>
          <select name="disciplina" defaultValue={discipline ?? ""}><option value="">Todas las disciplinas</option>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select>
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
        <section key={`${g.discipline}-${g.level}-${g.divisionId ?? "sin-division"}-${g.weightClass ?? "sin"}`}>
          <h2>{DISCIPLINE_LABEL[g.discipline]} · {levelName(g.level)} · {divisionLabel(g.divisionId)} · {g.weightClass ? weightClassLabel(g.discipline, g.level, g.weightClass, g.divisionId) : NO_CATEGORY}</h2>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Ránking de aura">
<table>
            <thead><tr><th>Puesto</th><th>Peleador</th><th>Aura</th><th>Trayectoria</th><th>Respaldo</th><th>Comunidad</th></tr></thead>
            <tbody>
              {g.entries.map((r) => (
                <tr key={r.fighterId}>
                  <td>{r.position}</td>
                  <td><Link href={`/peleadores/${r.slug}`}>{r.name}</Link></td>
                  <td><strong>{r.aura}</strong></td><td>{r.trajectory??0}{r.declared&&<span className="mut"> · declarada</span>}</td><td>{r.backing??0}</td><td>{r.community??r.aura}</td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        </section>
      ))}
      {groups.length === 0 && <p className="mut">No hay aura con esta disciplina, nivel, zona y periodo. Puedes <Link href={discipline ? `/ranking?disciplina=${discipline}&provincia=all` : "/ranking"}>ampliar la consulta a toda España y a todo el tiempo</Link> o <Link href={discipline ? `/peleadores?disciplina=${discipline}` : "/peleadores"}>buscar un peleador</Link> para reconocer su actuación en un combate que hayas visto.</p>}
    </>
  );
}
