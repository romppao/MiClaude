import Link from "next/link";
import type { Metadata } from "next";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, DISCIPLINE_SLUG, disciplineFromSlug } from "../../lib/common/disciplines";
import { ultimasNoticias } from "../../lib/news/feed";
import { actualizarSiToca } from "../../lib/news/refresh";
import { FUENTES_EXPLICADAS, ListaNoticias, SinNoticias } from "../components/Noticias";

export const metadata: Metadata = { title: "Noticias" };
export const dynamic = "force-dynamic";

/** Todas las noticias, con un filtro por disciplina. Sin filtro por defecto: todas las disciplinas con el mismo trato. */
export default async function Noticias({ searchParams }: { searchParams: Promise<{ disciplina?: string }> }) {
  actualizarSiToca();
  const { disciplina: slug = "" } = await searchParams;
  const disciplina = disciplineFromSlug(slug) ?? undefined;
  const noticias = await ultimasNoticias({ disciplina, max: 40 });
  return (
    <div className="pantalla" style={{ gap: 20 }}>
      <div><h1>Noticias{disciplina ? ` de ${DISCIPLINE_LABEL[disciplina]}` : ""}</h1><p className="lead" style={{ fontSize: 16 }}>{FUENTES_EXPLICADAS}</p></div>
      <nav className="filtros-disciplina" aria-label="Filtrar por disciplina">
        <Link href="/noticias" aria-current={!disciplina ? "page" : undefined}>Todas</Link>
        {DISCIPLINE_ORDER.map((d) => <Link key={d} href={`/noticias?disciplina=${DISCIPLINE_SLUG[d]}`} aria-current={d === disciplina ? "page" : undefined}>{DISCIPLINE_LABEL[d]}</Link>)}
      </nav>
      {noticias.length ? <ListaNoticias noticias={noticias} /> : <SinNoticias disciplina={disciplina && DISCIPLINE_LABEL[disciplina]} />}
    </div>
  );
}
