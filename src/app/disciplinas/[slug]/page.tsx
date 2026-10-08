import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DISCIPLINE_LABEL, disciplineFromSlug } from "../../../lib/common/disciplines";
import { COLOR_DISCIPLINA, tinteDe } from "../../../lib/common/apariencia";
import { actualizarSiToca } from "../../../lib/news/refresh";
import Portada from "../../_inicio/Portada";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = disciplineFromSlug((await params).slug);
  return { title: d ? DISCIPLINE_LABEL[d] : "Disciplina no encontrada" };
}

/**
 * Portada de una disciplina (petición del fundador, 8 de octubre de 2026): «otra pantalla como la inicial, pero exclusivamente de esa
 * disciplina». Es la misma portada que la común (`_inicio/Portada`) filtrada: su actualidad, sus veladas, su aura y dónde entrenar.
 */
export default async function Disciplina({ params }: { params: Promise<{ slug: string }> }) {
  actualizarSiToca();
  const d = disciplineFromSlug((await params).slug);
  if (!d) notFound();
  const nombre = DISCIPLINE_LABEL[d];
  return (
    <Portada
      disciplina={d}
      cabecera={
        <section className="tarjeta-foto" style={{ minHeight: 150, padding: 22, gap: 8, "--tinte": tinteDe(d) } as CSSProperties} aria-labelledby="titulo-disciplina">
          <span className="raya" aria-hidden="true" style={{ display: "block", width: 46, height: 6, borderRadius: 3, background: COLOR_DISCIPLINA[d] }} />
          <h1 id="titulo-disciplina" style={{ margin: 0 }}>{nombre}</h1>
          <p className="meta" style={{ margin: 0, color: "rgba(255,255,255,.85)" }}>Noticias, veladas, peleadores y dónde entrenar, solo de {nombre}.</p>
        </section>
      }
    />
  );
}
