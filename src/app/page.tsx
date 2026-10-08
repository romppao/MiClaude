import { getUser } from "../lib/accounts/auth";
import { actualizarSiToca } from "../lib/news/refresh";
import InicioVisitante from "./_inicio/Visitante";
import InicioComun from "./_inicio/PortadaComun";

export const dynamic = "force-dynamic";

/**
 * Portada. Sin cuenta: la portada pública. Con cuenta: la misma portada para todas las personas, con la actualidad y sus disciplinas
 * (decisión del fundador, 8 de octubre de 2026). Lo propio de cada tipo de cuenta está en /mi-panel.
 */
export default async function Home() {
  actualizarSiToca();
  const user = await getUser();
  return user ? <InicioComun user={user} /> : <InicioVisitante />;
}
