import { NextResponse } from "next/server";
import { db } from "../../../lib/common/db";
import { getUser } from "../../../lib/accounts/auth";
import { loginPath } from "../../../lib/common/paths";
import { publicFighterName } from "../../../lib/common/names";

export const dynamic = "force-dynamic";

/** Descarga de todos los datos que Ring España guarda de la persona que ha iniciado sesión (derecho de acceso y portabilidad). */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL(loginPath("/mi-cuenta"), request.url));

  const fighter = user.fighter;
  const [bouts, auras, follows, claims, organizer, reports, history, events] = await Promise.all([
    fighter ? db.bout.findMany({ where: { OR: [{ fighterAId: fighter.id }, { fighterBId: fighter.id }] }, include: { event: true, fighterA: true, fighterB: true }, orderBy: { event: { date: "desc" } } }) : Promise.resolve([]),
    db.aura.findMany({ where: { userId: user.id }, include: { fighter: true, bout: { include: { event: true } } }, orderBy: { createdAt: "desc" } }),
    db.follow.findMany({ where: { userId: user.id }, include: { fighter: true } }),
    db.claimRequest.findMany({ where: { userId: user.id }, include: { fighter: true } }),
    db.organizerRequest.findUnique({ where: { userId: user.id } }),
    db.report.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.auditLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 1000 }),
    db.event.findMany({ where: { organizerId: user.id }, orderBy: { date: "desc" } }),
  ]);

  const datos = {
    generadoEl: new Date().toISOString(),
    nota: "Estos son los datos personales que Ring España guarda de tu cuenta. La contraseña no se guarda: solo se conserva una huella cifrada que no se puede convertir en la contraseña.",
    cuenta: { correoElectronico: user.email, nombre: user.name, tipo: user.role, creadaEl: user.createdAt, correoVerificadoEl: user.emailVerifiedAt, avisosPorCorreo: user.notifyEmails },
    fichaDePeleador: fighter && {
      nombre: fighter.firstName, apellidos: fighter.lastName, alias: fighter.alias, fechaDeNacimiento: fighter.birthDate, ciudad: fighter.city, provincia: fighter.province,
      guardia: fighter.stance, alturaCm: fighter.heightCm, envergaduraCm: fighter.reachCm, presentacion: fighter.bio, creadaEl: fighter.createdAt,
      disciplinas: fighter.disciplines.map((d) => ({ disciplina: d.discipline, categoria: d.weightClass, combatesAnterioresDeclarados: { total: d.priorTotal, victorias: d.priorWins, derrotas: d.priorLosses, empates: d.priorDraws } })),
    },
    combatesDeMiFicha: bouts.map((b) => ({ velada: b.event.name, fecha: b.event.date, disciplina: b.event.discipline, rival: publicFighterName(b.fighterAId === fighter?.id ? b.fighterB : b.fighterA), resultado: b.result, formaDeTerminar: b.method, estado: b.verification, enlaceDeEvidencia: b.evidenceUrl, loRegistreYo: b.createdById === user.id })),
    auraQueHeDado: auras.map((a) => ({ peleador: publicFighterName(a.fighter), velada: a.bout.event.name, comentario: a.comment, lovioEnDirecto: a.attended, fecha: a.createdAt })),
    peleadoresQueSigo: follows.map((f) => ({ peleador: publicFighterName(f.fighter), desde: f.createdAt })),
    solicitudesParaReclamarUnaFicha: claims.map((c) => ({ ficha: publicFighterName(c.fighter), estado: c.status, fecha: c.createdAt })),
    solicitudDeOrganizador: organizer && { organizacion: organizer.orgName, estado: organizer.status, fecha: organizer.createdAt },
    velasPublicadasComoOrganizador: events.map((e) => ({ nombre: e.name, fecha: e.date, recinto: e.venue, ciudad: e.city })),
    avisosQueHeEnviado: reports.map((r) => ({ sobre: r.entity, motivo: r.reason, mensaje: r.message, estado: r.status, fecha: r.createdAt })),
    historialDeMisCambios: history.map((h) => ({ sobre: h.entity, accion: h.action, antes: h.before, despues: h.after, fecha: h.createdAt })),
  };
  return new NextResponse(JSON.stringify(datos, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="mis-datos-ring-espana.json"', "Cache-Control": "no-store" },
  });
}
