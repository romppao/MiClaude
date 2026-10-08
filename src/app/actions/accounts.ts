// Cuentas: registro, acceso, recuperación de contraseña, verificación del correo electrónico y «Mi cuenta».
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { consumeVerificationToken, createSession, destroyOtherSessions, destroySession, getUser, isResetTokenUsable, rememberReturnPath, requireUser, resetPasswordWithToken, sendPasswordResetEmail, sendVerificationEmail, unsubscribeWithToken } from "../../lib/accounts/auth";
import { dummyHash, hashPassword, needsRehash, verifyPassword } from "../../lib/accounts/password";
import { HORA, MINUTO, allow, clearHits, clientIp, reservar } from "../../lib/accounts/ratelimit";
import { maybePurge } from "../../lib/accounts/retention";
import { sendMail } from "../../lib/common/mail";
import { audit } from "../../lib/common/audit";
import { internalPath } from "../../lib/common/paths";
import { anonymizeFighter, scrubFighterHistory } from "../../lib/fighters/anonymize";
import { LIMITS, isEmail, oneLine } from "../../lib/common/text";
import { almacenDeVideos } from "../../lib/media/storage";
import { ROL_INICIAL, landingFor, parseTipoDeCuenta, parseTipoDeEntidad, type TipoDeCuenta, type TipoDeEntidad } from "../../lib/accounts/landing";
import { readOnboarding, type FighterIntent, type TrainerIntent } from "../../lib/accounts/onboarding";
import { DISCIPLINE_ORDER, parseCompetitionChoice } from "../../lib/common/disciplines";
import { parseClass, parseYears, pickDisciplines } from "../../lib/trainers/classes";
import { safeHttpUrl } from "../../lib/common/url";
import { checkLengths, go, guard, readProvince, Rechazo, str } from "./shared";

const MIN_PASSWORD = 8;

/** Comprueba la contraseña elegida (registro y cambio); si no vale, vuelve a `back` con el motivo. */
function checkNewPassword(password: string, back: string) {
  if (password.length < MIN_PASSWORD) go(back, { problema: "registro_password" });
  if (password.length > LIMITS.password) go(back, { problema: "contrasena_larga" });
}

/** Siguiente paso del registro tras crear la cuenta: cada tipo tiene el suyo (diseño v3); la entidad ya ha terminado. */
const PASO_TRAS_DATOS: Record<TipoDeCuenta, string> = { usuario: "/registro/intereses", peleador: "/registro/ficha", entrenador: "/registro/perfil", entidad: "/verificar" };

/**
 * Alta de cuenta (paso «datos» del registro) para los cuatro tipos: aficionado («usuario»), peleador, entrenador y entidad
 * (promotora, federación o club, con su solicitud). La cuenta se crea aquí; el paso siguiente es opcional y se puede dejar para después.
 */
export async function register(f: FormData) {
  const next = internalPath(str(f, "next"), "");
  const tipo = parseTipoDeCuenta(str(f, "tipo"), str(f, "role")); // un formulario antiguo con «role» sigue funcionando
  const back = `/registro?tipo=${tipo}${next ? `&next=${encodeURIComponent(next)}` : ""}`;
  const email = str(f, "email").toLowerCase();
  const name = oneLine(str(f, "name"));
  const password = String(f.get("password") ?? "");
  const role = ROL_INICIAL[tipo]; // la entidad empieza como persona normal: el permiso de organizadora lo concede un moderador
  const ip = await clientIp();
  if (ip && !(await allow(`registro:ip:${ip}`, 10, HORA))) go(back, { problema: "demasiados_intentos" });
  if (!name || name.length > LIMITS.name || !isEmail(email)) go(back, { problema: "registro_datos" });
  checkNewPassword(password, back);
  // Entidad: sus datos se comprueban ANTES de crear nada, para no dejar una cuenta sin su solicitud.
  let entidad: { orgName: string; kind: TipoDeEntidad; website: string | null; message: string } | null = null;
  if (tipo === "entidad") {
    checkLengths(f, back, { orgName: LIMITS.orgName, message: LIMITS.message, website: LIMITS.url });
    const orgName = oneLine(str(f, "orgName"));
    const kind = parseTipoDeEntidad(str(f, "entityKind"));
    const website = str(f, "website") ? safeHttpUrl(str(f, "website")) : null;
    const message = str(f, "message");
    if (!orgName) go(back, { problema: "nombre_organizacion" });
    if (!kind) go(back, { problema: "entidad_tipo" });
    if (str(f, "website") && !website) go(back, { problema: "enlace_invalido" });
    if (!message) go(back, { problema: "organizador_sin_datos" });
    entidad = { orgName, kind, website, message };
  }
  const siguiente = PASO_TRAS_DATOS[tipo];
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    // Un doble clic en «Crear mi cuenta» envía dos veces: la segunda ve la cuenta que acaba de crear la primera. Quien ya tiene esa sesión sigue adelante.
    if ((await getUser())?.email === email) go(siguiente);
    go(back, { problema: "registro_email_existe" });
  }
  await maybePurge();
  const passwordHash = await hashPassword(password);
  // La cuenta y, en su caso, la solicitud de la entidad se crean juntas: o se guardan las dos o ninguna.
  const user = await guard(back, () => db.$transaction(async (tx) => {
    const creada = await tx.user.create({ data: { email, name, role, passwordHash } });
    if (entidad) await tx.organizerRequest.create({ data: { userId: creada.id, ...entidad } });
    return creada;
  }), "registro_email_existe");
  const enviado = await sendVerificationEmail(user);
  await createSession(user.id);
  if (next) await rememberReturnPath(next); // al confirmar el correo se le ofrecerá volver a lo que estaba haciendo
  if (!enviado) go("/verificar", { problema: "correo_no_enviado" });
  go(siguiente, entidad ? { aviso: "registro_entidad" } : { aviso: "cuenta_creada" });
}

/** Registro del aficionado, último paso: disciplinas que le interesan y peleadores que quiere seguir (todo opcional). */
export async function saveInterests(f: FormData) {
  const user = await requireUser("/registro/intereses");
  const disciplinas = DISCIPLINE_ORDER.filter((d) => f.getAll("disciplina").includes(d));
  const ids = [...new Set(f.getAll("seguir").map(String))].filter((id) => id.length <= 40).slice(0, 30);
  // Solo fichas públicas y nunca la propia (igual que «Seguir» en la ficha).
  const fichas = ids.length ? await db.fighter.findMany({ where: { id: { in: ids }, listed: true, hiddenAt: null, NOT: { userId: user.id } }, select: { id: true } }) : [];
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { interests: disciplinas } }),
    db.follow.createMany({ data: fichas.map((x) => ({ userId: user.id, fighterId: x.id })), skipDuplicates: true }),
  ]);
  revalidatePath("/", "layout");
  go(user.emailVerifiedAt ? "/" : "/verificar", { aviso: fichas.length ? "intereses_y_seguidos" : "intereses_guardados" });
}

/**
 * Registro del peleador, último paso: disciplina, nivel, división, categoría y provincia. La ficha pública exige el correo confirmado,
 * así que aquí solo se guarda lo elegido; «Mi ficha» lo trae ya rellenado y la persona solo tiene que revisarlo y crearla.
 */
export async function saveFighterIntent(f: FormData) {
  const user = await requireUser("/registro/ficha");
  const back = "/registro/ficha";
  if (user.fighter) go("/mi-ficha");
  const choice = parseCompetitionChoice(str(f, "discipline"), str(f, "level"), str(f, "weightClass"), str(f, "divisionId"));
  if (!choice) go(back, { problema: "disciplina_no_valida" });
  const province = readProvince(f, "province", back);
  const intento: FighterIntent = { kind: "peleador", discipline: choice.discipline, level: choice.level, divisionId: choice.divisionId, weightClass: choice.weightClass, province };
  await db.user.update({ where: { id: user.id }, data: { onboarding: intento } });
  go(user.emailVerifiedAt ? "/mi-ficha" : "/verificar", { aviso: "registro_ficha_guardada" });
}

/** Registro del entrenador, tercer paso: disciplinas que enseña, dónde entrena, años de experiencia y provincia. */
export async function saveTrainerIntent(f: FormData) {
  const user = await requireUser("/registro/perfil");
  const back = "/registro/perfil";
  checkLengths(f, back, { gym: LIMITS.gym });
  const disciplines = pickDisciplines(f.getAll("disciplina").map(String), DISCIPLINE_ORDER);
  if (disciplines.length === 0) go(back, { problema: "entrenador_disciplinas" });
  const years = parseYears(str(f, "years"));
  if (years === undefined) go(back, { problema: "entrenador_anos" });
  const province = readProvince(f, "province", back);
  const previo = readOnboarding(user.onboarding);
  const intento: TrainerIntent = { kind: "entrenador", disciplines, gym: oneLine(str(f, "gym")), years, province, clase: previo?.kind === "entrenador" ? previo.clase : null };
  await db.user.update({ where: { id: user.id }, data: { onboarding: intento } });
  go("/registro/clase");
}

/** Registro del entrenador, último paso: su primera clase (opcional). Se publica junto con el perfil, tras confirmar el correo. */
export async function saveTrainerClassIntent(f: FormData) {
  const user = await requireUser("/registro/clase");
  const back = "/registro/clase";
  const previo = readOnboarding(user.onboarding);
  if (previo?.kind !== "entrenador") go("/registro/perfil", { problema: "entrenador_perfil_primero" });
  const borrador = { kind: str(f, "kind"), title: str(f, "title"), minutes: str(f, "minutes"), price: str(f, "price"), capacity: str(f, "capacity"), schedule: str(f, "schedule") };
  const clase = parseClass(borrador);
  if (!clase.ok) go(back, { problema: clase.problema });
  await db.user.update({ where: { id: user.id }, data: { onboarding: { ...previo, clase: borrador } } });
  go(user.emailVerifiedAt ? "/" : "/verificar", { aviso: "registro_clase_guardada" });
}

// Límites del inicio de sesión: intentos fallidos en 15 minutos por correo y por dirección IP (si el proxy la facilita).
const LOGIN_MAX_POR_CORREO = 8;

const LOGIN_MAX_POR_IP = 40;

export async function login(f: FormData) {
  const email = str(f, "email").toLowerCase().slice(0, LIMITS.email);
  const password = String(f.get("password") ?? "");
  const next = internalPath(str(f, "next"), "");
  const back = `/entrar${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const ip = await clientIp();
  const claves: [string, number][] = [[`acceso:correo:${email}`, LOGIN_MAX_POR_CORREO], ...(ip ? [[`acceso:ip:${ip}`, LOGIN_MAX_POR_IP] as [string, number]] : [])];
  await maybePurge(); // la limpieza de datos caducados no depende de que alguien se registre (como mucho una vez cada 30 minutos)
  // El intento se reserva ANTES de calcular el hash (si se anotara al terminar, peticiones simultáneas se saltarían el límite).
  const reservas = await Promise.all(claves.map(([clave, max]) => reservar(clave, max, 15 * MINUTO)));
  if (reservas.some((r) => !r.permitido)) go(back, { problema: "demasiados_intentos" });

  const user = await db.user.findUnique({ where: { email } });
  // Con un correo que no existe se verifica igualmente contra un hash de mentira: así tarda lo mismo y no se puede averiguar qué correos hay registrados.
  const ok = await verifyPassword(password.length <= LIMITS.password ? password : "", user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok) go(back, { problema: "login_incorrecto" }); // la reserva se queda como intento fallido
  await Promise.all(reservas.map((r) => r.devolver()));
  await clearHits(`acceso:correo:${email}`);
  if (needsRehash(user.passwordHash)) await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  await createSession(user.id);
  go(next || landingFor(user.role));
}

export async function logout() {
  await destroySession();
  go("/", { aviso: "sesion_cerrada" });
}

/**
 * Petición de una contraseña nueva. La respuesta es siempre la misma exista o no la cuenta (no se puede averiguar
 * qué correos están registrados), y el envío se hace después de responder para que tampoco lo delate el tiempo.
 */
export async function requestPasswordReset(f: FormData) {
  const back = "/recuperar";
  const email = str(f, "email").toLowerCase();
  if (!isEmail(email)) go(back, { problema: "correo_no_valido" });
  const ip = await clientIp();
  if (!(await allow(`recuperar:correo:${email}`, 3, HORA)) || (ip && !(await allow(`recuperar:ip:${ip}`, 10, HORA)))) go(back, { problema: "demasiados_intentos" });
  after(async () => {
    try {
      const user = await db.user.findUnique({ where: { email } });
      if (user) await sendPasswordResetEmail(user);
    } catch (e) {
      console.error(`[recuperar] no se pudo enviar el enlace: ${e instanceof Error ? e.message : String(e)}`);
    }
  });
  go(back, { aviso: "recuperar_enviado" });
}

export async function resetPassword(f: FormData) {
  const token = str(f, "token");
  const back = `/recuperar/nueva?token=${encodeURIComponent(token)}`;
  const password = String(f.get("password") ?? "");
  if (password !== String(f.get("repeat") ?? "")) go(back, { problema: "contrasenas_distintas" });
  checkNewPassword(password, back);
  // El hash cuesta 64 MiB y unos 100–200 ms y la acción es pública: primero se limita la frecuencia y se comprueba que el enlace sirve, y solo entonces se calcula.
  const ip = await clientIp();
  if (ip && !(await allow(`restablecer:ip:${ip}`, 20, HORA))) go(back, { problema: "demasiados_intentos" });
  if (!(await isResetTokenUsable(token))) go("/recuperar", { problema: "token_invalido" });
  const user = await resetPasswordWithToken(token, await hashPassword(password));
  if (!user) go("/recuperar", { problema: "token_invalido" }); // alguien gastó el enlace justo antes
  await sendMail(user.email, "Tu contraseña de Ring España se ha cambiado", `Hola ${oneLine(user.name)},\n\nTu contraseña se ha cambiado y se han cerrado las sesiones abiertas en otros dispositivos.\n\nSi no has sido tú, pide una contraseña nueva cuanto antes desde la página de acceso.\n`);
  await createSession(user.id);
  go("/", { aviso: "contrasena_cambiada" });
}

/**
 * Comprueba la contraseña actual antes de una operación delicada (cambiar la contraseña, eliminar la cuenta). Cuenta como un
 * intento de acceso: si se falla varias veces seguidas, se bloquea durante unos minutos (evita adivinarla desde una sesión abierta).
 */
async function confirmOwnPassword(user: { email: string; passwordHash: string }, password: string, back: string) {
  const clave = `acceso:correo:${user.email}`;
  const reserva = await reservar(clave, LOGIN_MAX_POR_CORREO, 15 * MINUTO); // antes de calcular el hash: ver login
  if (!reserva.permitido) go(back, { problema: "demasiados_intentos" });
  if (password.length > LIMITS.password || !(await verifyPassword(password, user.passwordHash))) go(back, { problema: "contrasena_actual_incorrecta" });
  await reserva.devolver();
  await clearHits(clave);
}

export async function updateAccount(f: FormData) {
  const user = await requireUser();
  const back = "/mi-cuenta";
  const name = oneLine(str(f, "name"));
  if (!name || name.length > LIMITS.name) go(back, { problema: "registro_datos" });
  const notifyEmails = f.get("notifyEmails") === "on";
  await db.user.update({ where: { id: user.id }, data: { name, notifyEmails } });
  await audit({ userId: user.id, entity: "USER", entityId: user.id, action: "ACCOUNT_UPDATED", before: { name: user.name, notifyEmails: user.notifyEmails }, after: { name, notifyEmails } });
  revalidatePath("/", "layout");
  go(back, { aviso: "cuenta_guardada" });
}

export async function changePassword(f: FormData) {
  const user = await requireUser();
  const back = "/mi-cuenta";
  const password = String(f.get("password") ?? "");
  if (password !== String(f.get("repeat") ?? "")) go(back, { problema: "contrasenas_distintas" });
  checkNewPassword(password, back);
  await confirmOwnPassword(user, String(f.get("current") ?? ""), back);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  await destroyOtherSessions(user.id);
  await sendMail(user.email, "Tu contraseña de Ring España se ha cambiado", `Hola ${oneLine(user.name)},\n\nTu contraseña se ha cambiado y se han cerrado las sesiones abiertas en otros dispositivos.\n\nSi no has sido tú, pide una contraseña nueva cuanto antes desde la página de acceso.\n`);
  go(back, { aviso: "contrasena_guardada" });
}

/** Baja de los avisos por correo desde el enlace del propio mensaje (no hace falta iniciar sesión). */
export async function unsubscribeEmails(f: FormData) {
  const ok = await unsubscribeWithToken(str(f, "token"));
  go("/baja", ok ? { aviso: "avisos_desactivados" } : { problema: "baja_invalida" });
}

/**
 * Elimina la cuenta y sus datos personales: sesiones, auras dadas, seguimientos, solicitudes y avisos enviados.
 * La ficha de peleador se borra si no tiene combates; si los tiene, se anonimiza (los combates forman parte del récord de sus rivales).
 * Las veladas publicadas se conservan, sin organizador. Queda un apunte en el historial sin datos personales.
 */
export async function deleteAccount(f: FormData) {
  const user = await requireUser();
  const back = "/mi-cuenta/eliminar";
  if (f.get("confirm") !== "on") go(back, { problema: "eliminar_sin_confirmar" });
  await confirmOwnPassword(user, String(f.get("current") ?? ""), back);
  // Vídeos subidos por la persona (a las veladas y a sus highlights): sus filas se borran con la cuenta y los archivos, después.
  const videos = [
    ...(await db.mediaItem.findMany({ where: { uploaderId: user.id, videoKey: { not: null } }, select: { videoKey: true } })),
    ...(await db.highlight.findMany({ where: { fighter: { userId: user.id }, videoKey: { not: null } }, select: { videoKey: true } })),
  ].flatMap((v) => (v.videoKey ? [v.videoKey] : []));
  await guard(back, () => db.$transaction(async (tx) => {
    if (user.role === "ADMIN" && (await tx.user.count({ where: { role: "ADMIN" } })) <= 1) throw new Rechazo("ultimo_moderador");
    const fighter = await tx.fighter.findUnique({ where: { userId: user.id }, include: { _count: { select: { boutsAsA: true, boutsAsB: true } } } });
    let ficha: "borrada" | "anonimizada" | null = null;
    if (fighter) {
      if (fighter._count.boutsAsA + fighter._count.boutsAsB === 0) { await scrubFighterHistory(tx, fighter.id); await tx.fighter.delete({ where: { id: fighter.id } }); ficha = "borrada"; }
      else { await anonymizeFighter(tx, fighter.id); ficha = "anonimizada"; }
    }
    // Perfil de entrenador (diseño v3): es suyo y lleva su nombre, así que se borra con sus clases; sus peleadores dejan de tenerlo como entrenador.
    const entrenador = await tx.trainer.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (entrenador) {
      await tx.fighter.updateMany({ where: { trainerId: entrenador.id }, data: { trainerId: null } });
      await tx.profile.deleteMany({ where: { kind: "entrenador", entityId: entrenador.id } });
      await tx.trainer.delete({ where: { id: entrenador.id } });
      await tx.auditLog.updateMany({ where: { entity: { in: ["TRAINER", "CLASS"] }, userId: user.id }, data: { before: Prisma.DbNull, after: Prisma.DbNull } });
    }
    // El historial guardaba su nombre real «antes» y «después» de cada cambio: se vacían esos datos (queda constancia de qué pasó y cuándo).
    await tx.auditLog.updateMany({ where: { entity: "USER", entityId: user.id }, data: { before: Prisma.DbNull, after: Prisma.DbNull } });
    const accreditation = await tx.supportAccreditation.findUnique({ where: { userId: user.id } });
    if (accreditation) {
      await tx.supportAccreditation.update({ where: { id: accreditation.id }, data: { active: false, name: "Acreditación retirada", evidenceUrl: "", note: "" } });
      await tx.auditLog.updateMany({ where: { entity: "ACCREDITATION", entityId: accreditation.id }, data: { before: Prisma.DbNull, after: Prisma.DbNull } });
      await tx.fighterAchievement.updateMany({ where: { supportAccreditationId: accreditation.id }, data: { supportAuthority: null, supportNote: null } });
      await tx.bout.updateMany({ where: { supportAccreditationId: accreditation.id }, data: { supportAuthority: null, supportNote: null } });
    }
    // Las comprobaciones nuevas también podían guardar el nombre o notas privadas de quien respaldó.
    await tx.auditLog.updateMany({
      where: { userId: user.id, OR: [{ entity: { in: ["ACHIEVEMENT", "ACCREDITATION"] } }, { entity: "BOUT", action: "ENDORSED" }] },
      data: { before: Prisma.DbNull, after: Prisma.DbNull },
    });
    await audit({ userId: null, entity: "USER", entityId: user.id, action: "ACCOUNT_DELETED", after: { role: user.role, ficha } }, tx);
    await tx.user.delete({ where: { id: user.id } });
  }));
  const almacen = almacenDeVideos();
  if (almacen) await Promise.all(videos.map((v) => almacen.borrar(v).catch(() => undefined)));
  await destroySession();
  go("/", { aviso: "cuenta_eliminada" });
}

export async function verifyEmail(f: FormData) {
  const ok = await consumeVerificationToken(str(f, "token"));
  go("/verificar", ok ? { aviso: "correo_verificado" } : { problema: "token_invalido" });
}

export async function resendVerification() {
  const user = await requireUser();
  if (user.emailVerifiedAt) go("/verificar");
  if (!(await allow(`reenvio:usuario:${user.id}`, 3, HORA))) go("/verificar", { problema: "demasiados_intentos" });
  go("/verificar", (await sendVerificationEmail(user)) ? { aviso: "correo_reenviado" } : { problema: "correo_no_enviado" });
}
