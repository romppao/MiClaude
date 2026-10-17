import { getUser } from "../lib/accounts/auth";
import { actualizarSiToca } from "../lib/news/refresh";
import InicioVisitante from "./_inicio/Visitante";
import InicioComun from "./_inicio/PortadaComun";
import { APP_URL } from "../lib/common/mail";
import { demoActiva } from "../lib/common/demo";

export const dynamic = "force-dynamic";

/**
 * Portada. Sin cuenta: la portada pública. Con cuenta: la misma portada para todas las personas, con la actualidad y sus disciplinas
 * (decisión del fundador, 8 de octubre de 2026). Lo propio de cada tipo de cuenta está en /mi-panel.
 */
export default async function Home({ searchParams }: { searchParams: Promise<{ provincia?: string }> }) {
  actualizarSiToca();
  const user = await getUser();
  const { provincia } = await searchParams;
  // Datos estructurados (17-10-2026): el nombre del sitio y su buscador, para que Google los muestre. La demo no se anuncia a los buscadores.
  const datos = demoActiva() ? null : JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lona",
    url: APP_URL,
    inLanguage: "es-ES",
    potentialAction: { "@type": "SearchAction", target: `${APP_URL}/buscar?q={search_term_string}`, "query-input": "required name=search_term_string" },
  }).replace(/</g, "\\u003c");
  return <>
    {datos && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: datos }} />}
    {user ? <InicioComun user={user} provincia={provincia} /> : <InicioVisitante provincia={provincia} />}
  </>;
}
