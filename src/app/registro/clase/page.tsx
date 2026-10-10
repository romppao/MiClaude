import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/accounts/auth";
import { readOnboarding } from "../../../lib/accounts/onboarding";
import { saveTrainerClassIntent } from "../../actions/accounts";
import PasosRegistro from "../../components/PasosRegistro";
import CamposClase from "../../components/CamposClase";

export const metadata = { title: "Tu primera clase" };
export const dynamic = "force-dynamic";

/** Registro del entrenador, último paso (opcional): su primera clase, que se publicará con el perfil al confirmar el correo. */
export default async function ClaseRegistro() {
  const user = await requireUser("/registro/clase");
  const previo = readOnboarding(user.onboarding);
  if (previo?.kind !== "entrenador") redirect("/registro/perfil");
  return (
    <div className="pantalla pantalla-formulario">
      <PasosRegistro tipo="entrenador" paso={3} atras="/registro/perfil" etiquetaAtras="Volver a tu perfil de entrenador" />
      <div>
        <h1>Tu primera clase</h1>
        <p className="lead">Podrás crear más y pausarlas desde «Mis clases».</p>
      </div>
      <form action={saveTrainerClassIntent} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <CamposClase valores={previo.clase ?? undefined} />
        <button className="btn-grande">Terminar</button>
      </form>
      <p style={{ margin: 0, textAlign: "center" }}><Link href={user.emailVerifiedAt ? "/" : "/verificar"}>Lo haré después</Link></p>
    </div>
  );
}
