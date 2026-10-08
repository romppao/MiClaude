import type { Metadata } from "next";
import { requireUser } from "../../lib/accounts/auth";
import { papelDe } from "../../lib/accounts/landing";
import InicioAficionado from "../_inicio/Aficionado";
import InicioPeleador from "../_inicio/Peleador";
import InicioEntrenador from "../_inicio/Entrenador";
import InicioEntidad from "../_inicio/Entidad";
import MisSubidas from "../_inicio/MisSubidas";

export const metadata: Metadata = { title: "Mi panel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * «Mi panel»: lo propio de cada tipo de cuenta (diseño v3). Aficionado (y moderación, y una entidad pendiente de aprobar): sus peleadores
 * y sus vídeos y fotos. Peleador: su ficha y su próximo combate. Entrenador: sus clases y sus veladas. Entidad aprobada: su panel de veladas.
 */
export default async function MiPanel() {
  const user = await requireUser("/mi-panel");
  const papel = papelDe(user);
  const panel = papel === "entidad" ? <InicioEntidad user={user} /> : papel === "entrenador" ? <InicioEntrenador user={user} /> : papel === "peleador" ? <InicioPeleador user={user} /> : <InicioAficionado user={user} />;
  // «Mis vídeos y fotos»: siempre en el panel del aficionado; en los demás, solo si han compartido algo.
  return <>{panel}<MisSubidas userId={user.id} siempre={papel === "usuario"} /></>;
}
