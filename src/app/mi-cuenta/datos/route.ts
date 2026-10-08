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
  const [bouts, auras, follows, claims, organizer, reports, history, events, achievements, accreditation] = await Promise.all([
    fighter ? db.bout.findMany({ where: { OR: [{ fighterAId: fighter.id }, { fighterBId: fighter.id }] }, include: { event: true, fighterA: true, fighterB: true }, orderBy: { event: { date: "desc" } } }) : Promise.resolve([]),
    db.aura.findMany({ where: { userId: user.id }, include: { fighter: true, bout: { include: { event: true } } }, orderBy: { createdAt: "desc" } }),
    db.follow.findMany({ where: { userId: user.id }, include: { fighter: true } }),
    db.claimRequest.findMany({ where: { userId: user.id }, include: { fighter: true } }),
    db.organizerRequest.findUnique({ where: { userId: user.id } }),
    db.report.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.auditLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 1000 }),
    db.event.findMany({ where: { organizerId: user.id }, orderBy: { date: "desc" } }),
    fighter ? db.fighterAchievement.findMany({ where: { fighterId: fighter.id } }) : Promise.resolve([]),
    db.supportAccreditation.findUnique({ where: { userId: user.id } }),
  ]);
  const [entrenador, highlights] = await Promise.all([
    db.trainer.findUnique({ where: { userId: user.id }, include: { gym: true, classes: true } }),
    fighter ? db.highlight.findMany({ where: { fighterId: fighter.id }, include: { bout: { include: { event: true } } }, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
  ]);

  const datos = {
    generadoEl: new Date().toISOString(),
    nota: "Estos son los datos personales que Ring España guarda de tu cuenta. La contraseña no se guarda: solo se conserva una huella cifrada que no se puede convertir en la contraseña.",
    cuenta: { correoElectronico: user.email, nombre: user.name, tipo: user.role, creadaEl: user.createdAt, correoVerificadoEl: user.emailVerifiedAt, avisosPorCorreo: user.notifyEmails, disciplinasQueMeInteresan: user.interests, eleccionesDelRegistroPendientes: user.onboarding },
    perfilDeEntrenador: entrenador && { nombre: entrenador.name, presentacion: entrenador.bio, disciplinas: entrenador.disciplines, anosEntrenando: entrenador.yearsCoaching, ciudad: entrenador.city, provincia: entrenador.province, gimnasio: entrenador.gym?.name ?? null, creadoEl: entrenador.createdAt,
      clases: entrenador.classes.map((c) => ({ tipo: c.kind, titulo: c.title, disciplina: c.discipline, minutos: c.minutes, precioEuros: c.priceEuros, plazas: c.capacity, horario: c.schedule, publicada: c.active, creadaEl: c.createdAt })) },
    misHighlights: highlights.map((h) => ({ tipo: h.kind, titulo: h.title, enlaceDelVideo: h.videoUrl, foto: h.image ? Buffer.from(h.image).toString("base64") : null, formatoImagen: h.image ? "image/webp" : null, combate: h.bout?.event.name ?? null, destacado: h.pinned, publicadoEl: h.createdAt })),
    perfilesPersonalizados: (await db.profile.findMany({where:{ownerId:user.id}})).map(p => ({ tipo:p.kind, nombre:p.name, presentacion:p.bio, zona:p.city, web:p.website, foto:p.avatar ? Buffer.from(p.avatar).toString("base64") : null, banner:p.banner ? Buffer.from(p.banner).toString("base64") : null, formatoImagen:"image/webp", encuadre:{fotoX:p.avatarX,fotoY:p.avatarY,bannerX:p.bannerX,bannerY:p.bannerY} })),
    fichaDePeleador: fighter && {
      nombre: fighter.firstName, apellidos: fighter.lastName, alias: fighter.alias, fechaDeNacimiento: fighter.birthDate, ciudad: fighter.city, provincia: fighter.province,
      guardia: fighter.stance, recordAmateurPublico: fighter.recordPublic, alturaCm: fighter.heightCm, envergaduraCm: fighter.reachCm, presentacion: fighter.bio, creadaEl: fighter.createdAt,
      disciplinas: fighter.disciplines.map((d) => ({ disciplina: d.discipline, nivel: d.level, categoria: d.weightClass, divisionDeportiva: d.divisionId, cinturon: d.belt, grados: d.beltDegrees, combatesAnterioresDeclarados: { total: d.priorTotal, victorias: d.priorWins, derrotas: d.priorLosses, empates: d.priorDraws } })),
    },
    titulosDeclarados: achievements.map(a=>({ campeonato:a.championship, entidad:a.organization, fecha:a.awardedOn, ambito:a.scope, disciplina:a.discipline, nivel:a.level, division:a.divisionId, peso:a.weightClass, respaldo:a.supportKind, autoridad:a.supportAuthority, fuente:a.evidenceUrl, comprobacion:a.supportNote, revisionSolicitadaEl:a.reviewRequestedAt, retiradoEl:a.withdrawnAt, excluidoEl:a.rejectedAt, motivo:a.rejectionReason })),
    miAcreditacion: accreditation && { tipo:accreditation.kind, nombre:accreditation.name, disciplinas:accreditation.disciplines, activa:accreditation.active, fuente:accreditation.evidenceUrl, comprobacion:accreditation.note },
    combatesDeMiFicha: bouts.map((b) => ({ velada: b.event.name, fecha: b.event.date, disciplina: b.event.discipline, nivel: b.event.level, categoria: b.weightClass, divisionDeportiva: b.divisionId, rival: publicFighterName(b.fighterAId === fighter?.id ? b.fighterB : b.fighterA), resultado: b.result, formaDeTerminar: b.method, estado: b.verification, enlaceDeEvidencia: b.evidenceUrl, loRegistreYo: b.createdById === user.id })),
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
