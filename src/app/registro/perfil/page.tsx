import Link from "next/link";
import { requireUser } from "../../../lib/accounts/auth";
import { readOnboarding } from "../../../lib/accounts/onboarding";
import { db } from "../../../lib/common/db";
import { PROVINCES } from "../../../lib/common/labels";
import { LIMITS } from "../../../lib/common/text";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../../lib/common/disciplines";
import { TRAINER_YEARS_MAX } from "../../../lib/trainers/classes";
import { saveTrainerIntent } from "../../actions/accounts";
import PasosRegistro from "../../components/PasosRegistro";

export const metadata = { title: "Tu perfil de entrenador" };
export const dynamic = "force-dynamic";

/** Registro del entrenador, tercer paso: disciplinas que enseña, gimnasio, años entrenando y provincia. */
export default async function PerfilEntrenadorRegistro() {
  const user = await requireUser("/registro/perfil");
  const previo = readOnboarding(user.onboarding);
  const p = previo?.kind === "entrenador" ? previo : null;
  const gimnasios = await db.gym.findMany({ select: { name: true }, orderBy: { name: "asc" }, take: 200 });
  return (
    <div className="pantalla pantalla-formulario">
      <PasosRegistro tipo="entrenador" paso={2} atras="/mi-cuenta" etiquetaAtras="Ir a mi cuenta" />
      <div>
        <h1>Tu perfil de entrenador</h1>
        <p className="lead">Así te encontrarán peleadores y aficionados que buscan clases.</p>
      </div>
      <form action={saveTrainerIntent} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="leyenda">Disciplinas que enseñas</legend>
          <div className="chips">{DISCIPLINE_ORDER.map((d) => <label key={d} className="chip"><input type="checkbox" name="disciplina" value={d} defaultChecked={p?.disciplines.includes(d)} />{DISCIPLINE_LABEL[d]}</label>)}</div>
        </fieldset>
        <label className="field"><span>Dónde entrenas (opcional)</span><input name="gym" list="gimnasios-conocidos" defaultValue={p?.gym ?? ""} maxLength={LIMITS.gym} placeholder="Nombre del gimnasio o club" /><span className="hint">Si ya está en Ring España, elígelo de la lista.</span></label>
        <datalist id="gimnasios-conocidos">{gimnasios.map((g) => <option key={g.name} value={g.name} />)}</datalist>
        <label className="field"><span>Años entrenando (opcional)</span><input name="years" type="number" inputMode="numeric" min={0} max={TRAINER_YEARS_MAX} defaultValue={p?.years ?? ""} /></label>
        <label className="field"><span>Provincia</span><select name="province" defaultValue={p?.province ?? ""} required><option value="">Elige una provincia</option>{PROVINCES.map((x) => <option key={x}>{x}</option>)}</select></label>
        <button className="btn-grande">Siguiente</button>
      </form>
      <p style={{ margin: 0, textAlign: "center" }}><Link href={user.emailVerifiedAt ? "/" : "/verificar"}>Lo haré después</Link></p>
    </div>
  );
}
