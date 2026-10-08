import Link from "next/link";
import { requireUser } from "../../../lib/accounts/auth";
import { db } from "../../../lib/common/db";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../../lib/common/disciplines";
import { iniciales } from "../../../lib/common/apariencia";
import { publicFighterName } from "../../../lib/common/names";
import { saveInterests } from "../../actions/accounts";
import PasosRegistro from "../../components/PasosRegistro";
import Foto from "../../components/Foto";

export const metadata = { title: "¿Qué te gusta ver?" };
export const dynamic = "force-dynamic";

/** Registro del aficionado, último paso (opcional): disciplinas que le interesan y peleadores para seguir. */
export default async function Intereses() {
  const user = await requireUser("/registro/intereses");
  // Sugerencias: las fichas públicas con más seguidores (sin prioridad por disciplina ni por provincia), sin la propia.
  const [sugeridos, siguiendo] = await Promise.all([
    db.fighter.findMany({ where: { listed: true, hiddenAt: null, NOT: { userId: user.id } }, include: { disciplines: true }, orderBy: [{ followers: { _count: "desc" } }, { lastName: "asc" }], take: 6 }),
    db.follow.findMany({ where: { userId: user.id }, select: { fighterId: true } }),
  ]);
  const sigue = new Set(siguiendo.map((x) => x.fighterId));
  const despues = user.emailVerifiedAt ? "/" : "/verificar";
  return (
    <div className="pantalla">
      <PasosRegistro tipo="usuario" paso={2} atras="/mi-cuenta" etiquetaAtras="Ir a mi cuenta" />
      <div>
        <h1>¿Qué te gusta ver?</h1>
        <p className="lead">Elige disciplinas y sigue a peleadores: verás sus veladas y resultados en tu inicio.</p>
      </div>
      <form action={saveInterests} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="leyenda">Disciplinas</legend>
          <div className="chips">{DISCIPLINE_ORDER.map((d) => <label key={d} className="chip"><input type="checkbox" name="disciplina" value={d} defaultChecked={user.interests.includes(d)} />{DISCIPLINE_LABEL[d]}</label>)}</div>
        </fieldset>
        {sugeridos.length > 0 && (
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <legend className="kicker" style={{ marginBottom: 8 }}>Peleadores para seguir</legend>
            {sugeridos.map((f) => {
              const nombre = publicFighterName(f);
              return (
                <div key={f.id} className="fila">
                  <span className="avatar" aria-hidden="true">{iniciales(nombre)}<Foto src={`/imagenes/peleador/${f.id}/avatar`} /></span>
                  <span className="cuerpo"><span className="nombre">{nombre}</span><span className="meta">{f.disciplines.map((d) => DISCIPLINE_LABEL[d.discipline]).join(" · ")}{f.city ? ` · ${f.city}` : ""}</span></span>
                  <label className="chip"><input type="checkbox" name="seguir" value={f.id} defaultChecked={sigue.has(f.id)} aria-label={`Seguir a ${nombre}`} />Seguir</label>
                </div>
              );
            })}
          </fieldset>
        )}
        <button className="btn-grande">Terminar</button>
      </form>
      <p style={{ margin: 0, textAlign: "center" }}><Link href={despues}>Lo haré después</Link></p>
    </div>
  );
}
