import Link from "next/link";
import type { Metadata } from "next";
import { db } from "../../../lib/common/db";
import { requireAdmin } from "../../../lib/accounts/permissions";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../../lib/common/disciplines";
import { haceTiempo } from "../../../lib/common/dates";
import { LIMITS } from "../../../lib/common/text";
import { asegurarFuentesIniciales, noticiasActivas } from "../../../lib/news/refresh";
import { TIPO_DE_FUENTE_ETIQUETA } from "../../../lib/news/sources";
import { addNewsSource, refreshNewsNow, toggleNewsItem, toggleNewsSource } from "../../actions/news";

export const metadata: Metadata = { title: "Fuentes de noticias", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Fuentes de la portada común: cuáles funcionan (última lectura correcta y último error), activarlas o desactivarlas, añadir otras
 * (por ejemplo, el canal de noticias de una federación) y ocultar un titular concreto. Solo moderación.
 */
export default async function FuentesDeNoticias() {
  await requireAdmin("/moderacion/noticias");
  await asegurarFuentesIniciales();
  const [fuentes, recientes] = await Promise.all([
    db.newsSource.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], include: { _count: { select: { items: true } } } }),
    db.newsItem.findMany({ orderBy: [{ publishedAt: "desc" }, { id: "asc" }], take: 30, include: { source: { select: { name: true } } } }),
  ]);
  const ahora = new Date();
  return (
    <>
      <p><Link href="/moderacion">← Volver a moderación</Link></p>
      <h1>Fuentes de noticias</h1>
      <p className="mut">Solo se muestran titulares en español, del panorama español y, en cada disciplina, los que hablan solo de ella (guía: docs/NOTICIAS.md). La portada reúne titulares de estas fuentes. Se leen solas cada media hora cuando alguien abre la portada. Antes de publicar la aplicación, comprueba que todas tienen una lectura correcta reciente.</p>
      {!noticiasActivas() && <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>La lectura de noticias está desactivada en este servidor (NEWS_FETCH=no).</div>}
      <form action={refreshNewsNow}><button>Actualizar las noticias ahora</button></form>

      <h2>Fuentes</h2>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Fuentes de noticias y su estado</caption>
          <thead><tr><th scope="col">Fuente</th><th scope="col">Estado</th><th scope="col">Noticias</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            {fuentes.map((f) => (
              <tr key={f.id}>
                <th scope="row" style={{ color: "var(--text)" }}>{f.name}<div className="mut" style={{ fontWeight: 400 }}>{TIPO_DE_FUENTE_ETIQUETA[f.kind]}{f.disciplines.length ? ` · ${f.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(", ")}` : " · Todas las disciplinas"}{f.local ? " · Solo panorama español" : " · Se comprueba que cada titular sea del panorama español"}</div><div className="mut" style={{ fontWeight: 400, wordBreak: "break-all" }}>{f.url}</div></th>
                <td>
                  {!f.active ? "Desactivada"
                    : f.lastError ? <span><span aria-hidden="true">⚠ </span>Falla: {f.lastError}{f.lastOkAt ? ` (última lectura correcta: ${haceTiempo(f.lastOkAt, ahora).toLowerCase()})` : " (nunca se ha leído bien)"}</span>
                    : f.lastOkAt ? <span><span aria-hidden="true">✓ </span>Funciona · {haceTiempo(f.lastOkAt, ahora).toLowerCase()}</span>
                    : "Todavía no se ha leído"}
                </td>
                <td>{f._count.items}</td>
                <td><form action={toggleNewsSource}><input type="hidden" name="sourceId" value={f.id} /><button className="secondary">{f.active ? `Desactivar ${f.name}` : `Activar ${f.name}`}</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="nueva-fuente">Añadir una fuente</h2>
      <p className="mut">Sirve cualquier canal RSS o Atom: el de un medio, una federación o un canal de vídeo (https://www.youtube.com/feeds/videos.xml?channel_id=…).</p>
      <form className="search" action={addNewsSource} style={{ flexDirection: "column", alignItems: "stretch", maxWidth: 560 }}>
        <label className="field"><span>Nombre que verá el público</span><input name="name" required maxLength={LIMITS.orgName} /></label>
        <label className="field"><span>Dirección del canal</span><input name="url" type="url" required maxLength={LIMITS.url} placeholder="https://…" /><span className="hint">Debe empezar por https://</span></label>
        <label className="field"><span>Tipo de fuente</span><select name="kind" defaultValue="PRENSA">{Object.entries(TIPO_DE_FUENTE_ETIQUETA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="leyenda">Disciplinas que cubre (si no marcas ninguna, se deducen de cada titular)</legend>
          <div className="chips">{DISCIPLINE_ORDER.map((d) => <label key={d} className="chip"><input type="checkbox" name="disciplina" value={d} />{DISCIPLINE_LABEL[d]}</label>)}</div>
        </fieldset>
        <label className="chip" style={{ alignSelf: "flex-start" }}><input type="checkbox" name="local" value="si" />Solo publica noticias del panorama español</label>
        <p className="hint" style={{ margin: 0 }}>Márcalo en federaciones, clubes y medios que solo cubren España. Si no, solo se mostrarán los titulares que nombren España, una comunidad, una provincia o a un peleador español.</p>
        <button>Añadir la fuente</button>
      </form>

      <h2>Últimos titulares</h2>
      {recientes.length === 0 ? <p className="mut">Todavía no hay titulares.</p> : (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {recientes.map((n) => (
            <li key={n.id} className="fila" style={{ flexWrap: "wrap" }}>
              <span className="cuerpo"><a href={n.url} target="_blank" rel="noopener noreferrer" className="nombre">{n.title}<span className="sr-only"> (se abre en otra pestaña)</span></a><span className="meta">{n.publisher ?? n.source.name} · {haceTiempo(n.publishedAt, ahora)}{n.hiddenAt ? " · Oculta" : ""}</span></span>
              <form action={toggleNewsItem}><input type="hidden" name="itemId" value={n.id} /><button className="secondary">{n.hiddenAt ? "Volver a mostrar" : "Ocultar"}<span className="sr-only">: {n.title}</span></button></form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
