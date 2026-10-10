import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/accounts/auth";
import { readOnboarding } from "../../../lib/accounts/onboarding";
import { PROVINCES } from "../../../lib/common/labels";
import { saveFighterIntent } from "../../actions/accounts";
import PasosRegistro from "../../components/PasosRegistro";
import SelectorCategoria from "../../components/SelectorCategoria";

export const metadata = { title: "Crea tu ficha" };
export const dynamic = "force-dynamic";

/**
 * Registro del peleador, último paso: disciplina, nivel, categoría (del catálogo oficial de `disciplines.ts` y `competition.ts`) y provincia.
 * La ficha pública exige confirmar antes el correo: aquí se guarda lo elegido y «Mi ficha» lo trae rellenado.
 */
export default async function FichaRegistro() {
  const user = await requireUser("/registro/ficha");
  if (user.fighter) redirect("/mi-ficha");
  const previo = readOnboarding(user.onboarding);
  const p = previo?.kind === "peleador" ? previo : null;
  return (
    <div className="pantalla pantalla-formulario">
      <PasosRegistro tipo="peleador" paso={2} atras="/mi-cuenta" etiquetaAtras="Ir a mi cuenta" />
      <div>
        <h1>Crea tu ficha</h1>
        <p className="lead">Con tu disciplina, tu categoría y tu provincia. Podrás añadir más disciplinas después.</p>
      </div>
      <form action={saveFighterIntent} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SelectorCategoria modo="ficha" chips defaults={{ discipline: p?.discipline ?? "", level: p?.level ?? "AMATEUR", divisionId: p?.divisionId, weightClass: p?.weightClass }} />
        <label className="field"><span>Provincia</span><select name="province" defaultValue={p?.province ?? ""} required><option value="">Elige una provincia</option>{PROVINCES.map((x) => <option key={x}>{x}</option>)}</select></label>
        <p className="mut" style={{ margin: 0 }}>Cuando confirmes tu correo electrónico revisarás estos datos en «Mi ficha», con tu nombre y tu gimnasio, y la ficha se publicará.</p>
        <button className="btn-grande">Guardar mi ficha</button>
      </form>
      <p style={{ margin: 0, textAlign: "center" }}><Link href={user.emailVerifiedAt ? "/mi-ficha" : "/verificar"}>Lo haré después</Link></p>
    </div>
  );
}
