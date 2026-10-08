import { getUser } from "../lib/accounts/auth";
import InicioVisitante from "./_inicio/Visitante";
import InicioAficionado from "./_inicio/Aficionado";
import InicioPeleador from "./_inicio/Peleador";
import InicioEntrenador from "./_inicio/Entrenador";
import InicioEntidad from "./_inicio/Entidad";

export const dynamic = "force-dynamic";

/**
 * Inicio por tipo de cuenta (diseño v3): cada persona ve lo suyo. Visitante: la portada pública. Aficionado (y moderación, y una entidad
 * pendiente de aprobar): sus peleadores. Peleador: su ficha y su próximo combate. Entrenador: sus clases. Entidad aprobada: su panel de veladas.
 */
export default async function Home() {
  const user = await getUser();
  if (!user) return <InicioVisitante />;
  if (user.role === "ORGANIZER") return <InicioEntidad user={user} />;
  if (user.role === "FIGHTER" || user.fighter) return <InicioPeleador user={user} />;
  if (user.role === "TRAINER") return <InicioEntrenador user={user} />;
  return <InicioAficionado user={user} />;
}
