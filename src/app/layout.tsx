import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import FlashNotice from "./components/FlashNotice";
import RecordarCampos from "./components/RecordarCampos";
import EvitarDobleEnvio from "./components/EvitarDobleEnvio";
import TemaPersistente from "./components/TemaPersistente";
import RefrescoVivo from "./components/RefrescoVivo";
import MobileNav from "./components/MobileNav";
import NavigationMenu from "./components/NavigationMenu";
import Experience from "./components/experience/Experience";
import { notificationCutoff } from "../lib/common/periods";
import { db } from "../lib/common/db";
import { getUser } from "../lib/accounts/auth";
import { logout } from "./actions/accounts";
import { APP_URL } from "../lib/common/mail";
import { demoActiva } from "../lib/common/demo";
import { esCreador } from "../lib/accounts/creador";
import { papelDe, puedeOrganizar, type Papel } from "../lib/accounts/landing";
import { menuDe } from "../lib/accounts/menu";
import Icono from "./components/Icono";

/**
 * La demo (DEMO_MODE=si) pide a los buscadores que no la muestren: si alguien busca «Lona», debe encontrar la versión real, no la de
 * pruebas (petición del fundador, 15 de octubre de 2026). Se calcula en cada petición para leer la variable del servidor en marcha.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(APP_URL),
    title: { default: "Lona", template: "%s · Lona" },
    description: "La comunidad de deportes de contacto de toda España: peleadores, récords, veladas, gimnasios y entrenadores de boxeo, jiu-jitsu, K-1, kickboxing, MMA y Muay Thai, amateur y profesional.",
    ...(demoActiva() ? { robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F4F2EC" }, { media: "(prefers-color-scheme: dark)", color: "#0A0A0C" }],
  colorScheme: "dark light", viewportFit: "cover", interactiveWidget: "resizes-content" };

/** Aplica el tema elegido (components/SelectorTema.tsx) antes de pintar la página, para que no parpadee. Sin elección, manda el sistema. */
const TEMA_INICIAL = `try{var t=localStorage.getItem("lona:tema");if(t==="claro"||t==="oscuro"){document.documentElement.dataset.tema=t;document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",t==="oscuro"?"#0A0A0C":"#F4F2EC")})}}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const [accreditation, managedProfileCount, trainer, unread] = await Promise.all([
    user && user.role !== "ADMIN" ? db.supportAccreditation.findUnique({ where: { userId: user.id } }) : Promise.resolve(null),
    user ? db.profile.count({ where: { ownerId: user.id, kind: { in: ["gimnasio", "entrenador", "federacion"] } } }) : Promise.resolve(0),
    user?.role === "TRAINER" ? db.trainer.findUnique({ where: { userId: user.id }, select: { slug: true, gym: { select: { slug: true } } } }) : Promise.resolve(null),
    user ? db.notification.count({ where: { userId: user.id, readAt: null, createdAt: { gte: notificationCutoff() } } }) : Promise.resolve(0),
  ]);
  // Menú, barra inferior del móvil y enlaces de la cabecera según el tipo de cuenta: cada persona ve solo lo suyo.
  const papel: Papel = papelDe(user);
  const secciones = menuDe(papel, {
    admin: user?.role === "ADMIN",
    creador: esCreador(user),
    canSupport: !!user?.emailVerifiedAt && (user.role === "ADMIN" || !!accreditation?.active),
    perfilesGestionados: managedProfileCount > 0,
    gimnasio: trainer?.gym?.slug ?? null,
    entrenador: trainer?.slug ?? null,
    promotorId: user?.role === "ORGANIZER" ? user.id : null,
  });
  return (
    <html lang="es" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} /></head>
      <body>
        <Experience>
        <a href="#contenido" className="skip">Saltar al contenido</a>
        <header className="top">
          <div className="in">
            <Link href="/" className="logo" aria-label="Lona, ir al inicio">{/* Logotipo oficial (13 de octubre de 2026): «lona» con la «o» en forma de ring. */}<img src="/brand/lona/lona-logo.svg" alt="" className="logo-lona" width={68} height={35} /><img src="/brand/lona/lona-logo-claro.svg" alt="" className="logo-lona-claro" width={68} height={35} /></Link>
            <nav aria-label="Principal">
              <Link href="/peleadores">Peleadores</Link>
              <Link href="/ranking">Ránking</Link>
              <Link href="/veladas">Veladas</Link>
              <Link href="/gimnasios">Gimnasios</Link>
              <Link href="/entrenadores">Entrenadores</Link>
            </nav>
            <NavigationMenu secciones={secciones} logoutForm={user ? <form action={logout}><button className="secondary">Salir</button></form> : undefined} />
            <div className={user ? "cuenta con-sesion" : "cuenta"}>
              <Link href="/ayuda">¿Cómo funciona?</Link>
              {user ? (
                <>
                  {user.role === "ADMIN" && <Link href="/moderacion">Moderación</Link>}
                  <Link href="/avisos" className="siempre" aria-label={`Avisos: ${unread} sin leer`}><Icono nombre="campana" />{unread > 0 && <span className="pildora">{unread > 99 ? "99+" : unread}</span>}</Link>
                  <Link href={papel === "moderador" ? "/moderacion/hoy" : "/mi-panel"} className="siempre mi-panel-cabecera">{papel === "moderador" ? "Hoy" : "Mi panel"}</Link>
                  {papel === "entidad" && <Link href="/organizador" className="siempre">Mis veladas</Link>}
                  {papel === "entrenador" && <Link href="/mis-clases" className="siempre">Mis clases</Link>}
                  {papel === "peleador" && <Link href="/mi-ficha" className="siempre">Mi ficha</Link>}
                  <Link href="/mi-cuenta" className="siempre">Mi cuenta</Link>
                  <form action={logout} className="siempre"><button className="secondary">Salir</button></form>
                </>
              ) : (
                <><Link href="/entrar" className="siempre">Entrar</Link><Link href="/registro" className="btn siempre">Registrarse</Link></>
              )}
            </div>
            <form action="/buscar" role="search" aria-label="Búsqueda rápida" className="buscador">
              <input name="q" aria-label="Buscar peleadores, gimnasios, entrenadores o veladas" placeholder="Buscar…" maxLength={80} />
              <button className="secondary">Buscar</button>
            </form>
          </div>
        </header>
        {demoActiva() && (
          <div className="barra-aviso"><div className="notice" style={{ margin: 0 }}><span aria-hidden="true">ℹ </span>Versión de demostración con datos ficticios: puedes probar con libertad, los datos pueden borrarse. {user ? <>Para probar como otra persona, entra en <Link href="/mi-cuenta">Mi cuenta</Link>.</> : <>Crea una cuenta con cualquier correo para empezar.</>}</div></div>
        )}
        {user && !user.emailVerifiedAt && (
          <div className="barra-aviso"><div className="notice notice-bad" style={{ margin: 0 }}><span aria-hidden="true">⚠ </span>Falta confirmar tu correo electrónico para poder dar aura y registrar combates. <Link href="/verificar">Confirmarlo ahora</Link></div></div>
        )}
        <main id="contenido"><Suspense fallback={null}><FlashNotice /><RecordarCampos /></Suspense><EvitarDobleEnvio /><TemaPersistente /><RefrescoVivo />{children}</main>
        <footer className="foot">
          <Link href="/ayuda">¿Cómo funciona?</Link>
          {(!user || puedeOrganizar(user.role)) && <Link href="/organizador">Organizar una velada</Link>}
          {user ? <Link href="/mi-cuenta">Mi cuenta</Link> : <Link href="/registro">Crear una cuenta</Link>}
          <Link href="/federaciones">Federaciones</Link><Link href="/promotores">Promotores</Link>
          <Link href="/condiciones">Condiciones</Link><Link href="/privacidad">Privacidad</Link><Link href="/cookies">Cookies</Link><Link href="/aviso-legal">Aviso legal</Link><Link href="/avisar">Avisar de un contenido</Link>
          {process.env.CONTACT_EMAIL && <a href={`mailto:${process.env.CONTACT_EMAIL}`}>Contacto</a>}
        </footer>
        <MobileNav papel={papel} />
        </Experience>
      </body>
    </html>
  );
}
