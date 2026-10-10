import type { CSSProperties } from "react";
import type { Noticia } from "../../lib/news/feed";
import { TIPO_DE_FUENTE_ETIQUETA } from "../../lib/news/sources";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { tinteDe } from "../../lib/common/apariencia";
import { haceTiempo } from "../../lib/common/dates";
import { MiniaturaNoticia, PortadaNoticia } from "./PortadaNoticia";

/**
 * Noticias de la portada común y de cada disciplina. Cada titular enlaza a la noticia original en su medio (se abre en otra pestaña):
 * Ring España no copia el texto, solo el titular, el medio y la fecha, y siempre dice de dónde viene.
 */
export function ListaNoticias({ noticias, ahora = new Date() }: { noticias: Noticia[]; ahora?: Date }) {
  return (
    <ul className="noticias">
      {noticias.map((n) => {
        const medio = n.publisher ?? n.source.name;
        return (
          <li key={n.id}>
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="noticia" style={{ "--tinte": tinteDe(n.disciplines[0]) } as CSSProperties}>
              <MiniaturaNoticia n={n} />
              <span className="cuerpo">
                <span className="meta">{medio} · <span className="sin-corte">{haceTiempo(n.publishedAt, ahora)}{n.source.kind === "VIDEO" ? " · Vídeo" : ""}</span></span>
                <span className="titular">{n.title}<span className="sr-only"> (se abre en otra pestaña)</span></span>
                {n.disciplines.length > 0 && <span className="meta-acc">{n.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(" · ")}</span>}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** La noticia más reciente, en grande y con su imagen, al principio de la portada (común o de una disciplina). */
export function NoticiaDestacada({ n, ahora = new Date() }: { n: Noticia; ahora?: Date }) {
  const medio = n.publisher ?? n.source.name;
  return (
    <a href={n.url} target="_blank" rel="noopener noreferrer" className="tarjeta-foto noticia-destacada" style={{ "--tinte": tinteDe(n.disciplines[0]) } as CSSProperties}>
      <PortadaNoticia n={n} loading="eager" />
      <span className="abajo">
        <span className="kicker kicker-acc">{n.disciplines.length ? n.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(" · ") : "Deportes de contacto"}</span>
        <span className="titular">{n.title}<span className="sr-only"> (se abre en otra pestaña)</span></span>
        <span className="meta">{medio} · <span className="sin-corte">{haceTiempo(n.publishedAt, ahora)}{n.source.kind === "VIDEO" ? " · Vídeo" : ""}</span></span>
      </span>
    </a>
  );
}

/**
 * Las demás noticias de la portada, en una fila que se desliza a los lados (petición del fundador, 8 de octubre de 2026: menos
 * desplazamiento hacia abajo). La lista completa, una debajo de otra, sigue en «Todas las noticias».
 */
export function FilaNoticias({ noticias, etiqueta, ahora = new Date() }: { noticias: Noticia[]; etiqueta: string; ahora?: Date }) {
  return (
    <div role="region" tabIndex={0} aria-label={`${etiqueta} (desliza para ver más)`}>
    <ul className="desliza fila-noticias">
      {noticias.map((n) => {
        const medio = n.publisher ?? n.source.name;
        return (
          <li key={n.id}>
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="tarjeta-foto noticia-mini" style={{ "--tinte": tinteDe(n.disciplines[0]) } as CSSProperties}>
              <PortadaNoticia n={n} loading="lazy" />
              <span className="abajo">
                {n.disciplines.length > 0 && <span className="kicker kicker-acc">{n.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(" · ")}</span>}
                <span className="titular">{n.title}<span className="sr-only"> (se abre en otra pestaña)</span></span>
                <span className="meta">{medio} · <span className="sin-corte">{haceTiempo(n.publishedAt, ahora)}{n.source.kind === "VIDEO" ? " · Vídeo" : ""}</span></span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
    </div>
  );
}

export function SinNoticias({ disciplina }: { disciplina?: string }) {
  return (
    <div className="tarjeta">
      <p className="mut" style={{ margin: 0 }}>Todavía no hay noticias{disciplina ? ` de ${disciplina}` : ""}. Las reunimos de canales de vídeo, prensa y federaciones, y se actualizan solas cada media hora: vuelve dentro de un rato.</p>
    </div>
  );
}

export const FUENTES_EXPLICADAS = `Titulares de ${Object.values(TIPO_DE_FUENTE_ETIQUETA).map((t) => t.toLowerCase()).join(", ")}. Cada noticia se abre en su medio original.`;
