import { db } from "../common/db";
import { contarTareas, type Contador } from "./moderacion-tareas";

/**
 * Cuánto trabajo hay de cada tipo (lectura de solo contar, sin cargar filas). Los mismos criterios que las colas de la bandeja
 * (`/moderacion`): si una cola cuenta algo, «Hoy» lo cuenta igual.
 */
export async function contadoresDeModeracion(): Promise<Contador[]> {
  const porVerificar = { verification: { in: ["SELF_REPORTED", "CONFIRMED"] as ("SELF_REPORTED" | "CONFIRMED")[] } };
  const [denuncias, veladas, senales, revision, fallos, fichas, organizaciones, reclamacionesGimnasio, gimnasios, verificar, noticias] = await Promise.all([
    db.report.count({ where: { status: "OPEN" } }),
    db.event.count({ where: { status: "PENDING_AUTHORIZATION", organizerId: { not: null } } }),
    db.bout.count({ where: { ...porVerificar, flags: { isEmpty: false } } }),
    db.bout.count({ where: { verification: "DISPUTED" } }),
    db.appError.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    db.claimRequest.count({ where: { status: "PENDING" } }),
    db.organizerRequest.count({ where: { status: "PENDING" } }),
    db.gymClaimRequest.count({ where: { status: { in: ["PENDING", "CONFLICT"] } } }),
    db.gym.count({ where: { status: "PENDING" } }),
    db.bout.count({ where: { ...porVerificar, flags: { isEmpty: true } } }),
    db.newsSource.count({ where: { active: true, lastError: { not: null } } }),
  ]);
  return contarTareas({
    denuncias, veladas, senales, revision, fallos, fichas, organizaciones, "reclamaciones-gimnasio": reclamacionesGimnasio, gimnasios, verificar, noticias,
  });
}
