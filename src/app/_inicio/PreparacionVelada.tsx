import Link from "next/link";
import { eventPreparation } from "../../lib/events/preparation";

/** Preparación y público agregado; no muestra identidades de asistentes o seguidores. */
export default function PreparacionVelada({ event, asistentes, seguidores }: { event: Parameters<typeof eventPreparation>[0]; asistentes: number; seguidores: number }) {
  return <section className="tarjeta" aria-label="Preparación de la velada">
    <h3>Preparación de la velada</h3>
    {eventPreparation(event).map((p) => <div className="fila" key={p.texto}><span className="cuerpo">{p.texto}</span>{p.completo ? <span className="pildora">Hecho</span> : <Link href={p.href}>Completar</Link>}</div>)}
    <p className="meta">{asistentes} van a ir · {seguidores} seguidores de los peleadores del cartel</p>
  </section>;
}
