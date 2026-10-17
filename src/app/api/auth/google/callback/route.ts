import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "../../../../../lib/common/db";
import { APP_URL } from "../../../../../lib/common/mail";
import { audit } from "../../../../../lib/common/audit";
import { registrarFallo } from "../../../../../lib/common/fallos";
import { createSession, destroyOtherSessions } from "../../../../../lib/accounts/auth";
import { hashPassword } from "../../../../../lib/accounts/password";
import { esCreador } from "../../../../../lib/accounts/creador";
import { puedeCrearCuenta } from "../../../../../lib/accounts/acceso-anticipado";
import { PASO_TRAS_DATOS, ROL_INICIAL, landingFor } from "../../../../../lib/accounts/landing";
import { COOKIE_GOOGLE, canjearCodigo, configGoogle, decidirCuenta, leerViaje, validarIdToken } from "../../../../../lib/accounts/google";

export const dynamic = "force-dynamic";

const ir = (ruta: string) => NextResponse.redirect(new URL(ruta, APP_URL), 303);
const conMensaje = (ruta: string, clave: "aviso" | "problema", codigo: string) => ir(`${ruta}${ruta.includes("?") ? "&" : "?"}${clave}=${codigo}`);

/**
 * Vuelta de Google: comprueba el viaje (state), canjea el código, valida la identidad y entra, vincula o crea la cuenta
 * (decidirCuenta, en lib/accounts/google.ts). La cuenta del creador pasa siempre por el segundo paso.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const jar = await cookies();
  const viaje = leerViaje(jar.get(COOKIE_GOOGLE)?.value);
  jar.delete({ name: COOKIE_GOOGLE, path: "/api/auth/google" }); // un solo uso
  const cfg = configGoogle();
  if (!cfg) return conMensaje("/entrar", "problema", "google_no_disponible");
  if (q.get("error")) return conMensaje("/entrar", "problema", "google_cancelado"); // la persona canceló o Google lo denegó
  const code = q.get("code");
  if (!viaje || !code || q.get("state") !== viaje.state) return conMensaje("/entrar", "problema", "google_caducado");

  let identidad;
  try {
    const v = validarIdToken(await canjearCodigo(cfg, code, viaje.verifier), { clientId: cfg.clientId, nonce: viaje.nonce });
    if (!v.ok) {
      if (v.motivo === "correo_sin_confirmar") return conMensaje("/entrar", "problema", "google_correo");
      throw new Error(`id_token de Google no válido (${v.motivo})`);
    }
    identidad = v.identidad;
  } catch (error) {
    await registrarFallo({ origen: "RUTA", error, contexto: "no se pudo completar «Continuar con Google»", ruta: "/api/auth/google/callback" });
    return conMensaje("/entrar", "problema", "google_error");
  }

  const [porSub, porCorreo] = await Promise.all([
    db.user.findUnique({ where: { googleSub: identidad.sub }, select: { id: true } }),
    db.user.findUnique({ where: { email: identidad.email }, select: { id: true, googleSub: true, emailVerifiedAt: true } }),
  ]);
  const decision = decidirCuenta(porSub, porCorreo);
  let userId: string;
  let destino: string | null = null; // null: a donde iba o a su inicio
  let aviso: string | null = null;

  if (decision.accion === "entrar") {
    userId = decision.userId;
  } else if (decision.accion === "vincular") {
    userId = decision.userId;
    // Una cuenta con otra cuenta de Google ya vinculada no se cambia en silencio.
    if (porCorreo?.googleSub && porCorreo.googleSub !== identidad.sub) return conMensaje("/entrar", "problema", "google_otra_cuenta");
    await db.user.update({
      where: { id: userId },
      data: {
        googleSub: identidad.sub,
        emailVerifiedAt: porCorreo?.emailVerifiedAt ?? new Date(),
        // Secuestro previo: si el correo no estaba confirmado, la contraseña la pudo poner otra persona. Deja de valer.
        ...(decision.protegerCuenta ? { passwordHash: await hashPassword(randomBytes(32).toString("hex")) } : {}),
      },
    });
    if (decision.protegerCuenta) await db.session.deleteMany({ where: { userId } });
    await audit({ userId, entity: "USER", entityId: userId, action: "CUENTA_GOOGLE_VINCULADA", after: { contrasenaInvalidada: decision.protegerCuenta } });
    aviso = "google_vinculada";
  } else {
    // Acceso anticipado (docs/ACCESO-ANTICIPADO.md): encendido, solo crean cuenta los correos invitados.
    if (!(await puedeCrearCuenta(identidad.email))) return conMensaje("/registro", "problema", "acceso_anticipado");
    try {
      const creada = await db.user.create({
        data: {
          email: identidad.email, name: identidad.nombre, role: ROL_INICIAL[viaje.tipo], googleSub: identidad.sub, emailVerifiedAt: new Date(),
          passwordHash: await hashPassword(randomBytes(32).toString("hex")), // nadie la conoce: si quiere una, la elige con «¿Has olvidado tu contraseña?»
        },
      });
      userId = creada.id;
    } catch (error) {
      // Dos vueltas simultáneas (doble clic): la segunda encuentra la cuenta ya creada.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return conMensaje("/entrar", "problema", "google_reintentar");
      throw error;
    }
    await audit({ userId, entity: "USER", entityId: userId, action: "CUENTA_GOOGLE_CREADA", after: { tipo: viaje.tipo } });
    destino = PASO_TRAS_DATOS[viaje.tipo];
    aviso = "cuenta_creada_google";
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (esCreador(user)) {
    // Igual que al entrar con contraseña: siempre moderador, y sin el segundo paso no está dentro.
    if (user.role !== "ADMIN") {
      await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      await audit({ userId: user.id, entity: "USER", entityId: user.id, action: "CREADOR_PERMISOS", before: { role: user.role }, after: { role: "ADMIN" } });
    }
    await createSession(user.id);
    return ir(`/entrar/segundo-paso${viaje.next ? `?next=${encodeURIComponent(viaje.next)}` : ""}`);
  }
  await createSession(user.id);
  if (decision.accion === "vincular") await destroyOtherSessions(user.id).catch(() => {}); // por si quedaba alguna (ya se cerraron si se protegió)
  const final = destino ?? (viaje.next || landingFor(user.role));
  return aviso ? conMensaje(final, "aviso", aviso) : ir(final);
}
