import Link from "next/link";
import { eventPreparation } from "../../lib/events/preparation";

/**
 * Preparación y público agregado; no muestra identidades de asistentes o seguidores. En la propia pantalla de la velada (`aqui`) los botones
 * llevan solo al apartado (#datos): con la ruta completa parecían un enlace a la misma pantalla que no hace nada.
 */
export default function PreparacionVelada({ event, asistentes, seguidores, aqui = false }: { event: Parameters<typeof eventPreparation>[0]; asistentes: number; seguidores: number; aqui?: boolean }) {
  return <section className="tarjeta" aria-label="Preparación de la velada">
    <h3>Preparación de la velada</h3>
    {eventPreparation(event).map((p) => <div className="fila" key={p.texto}><span className="cuerpo">{p.texto}</span>{p.completo ? <span className="pildora">Hecho</span> : <Link className="btn secondary" href={aqui ? p.href.slice(p.href.indexOf("#")) : p.href}>Completar</Link>}</div>)}
    <p className="meta" style={{ fontSize: 16 }}>{asistentes} van a ir · {seguidores} seguidores de los peleadores del cartel</p>
  </section>;
}
