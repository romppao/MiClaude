import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import FlashNotice from "./components/FlashNotice";
import RecordarCampos from "./components/RecordarCampos";
import EvitarDobleEnvio from "./components/EvitarDobleEnvio";
import MobileNav from "./components/MobileNav";
import NavigationMenu from "./components/NavigationMenu";
import { db } from "../lib/common/db";
import { getUser } from "../lib/accounts/auth";
import { logout } from "./actions/accounts";
import { APP_URL } from "../lib/common/mail";
import { demoActiva } from "../lib/common/demo";
import { esCreador } from "../lib/accounts/creador";
import { papelDe, puedeOrganizar, type Papel } from "../lib/accounts/landing";
import { menuDe } from "../lib/accounts/menu";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "Ring España", template: "%s · Ring España" },
  description: "La comunidad de deportes de contacto de toda España: peleadores, récords, veladas, gimnasios y entrenadores de boxeo, jiu-jitsu, K-1, kickboxing, MMA y Muay Thai, amateur y profesional.",
};

export const viewport: Viewport = { themeColor: "#0A0A0C", colorScheme: "dark" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const [accreditation, managedProfileCount, trainer] = await Promise.all([
    user && user.role !== "ADMIN" ? db.supportAccreditation.findUnique({ where: { userId: user.id } }) : Promise.resolve(null),
    user ? db.profile.count({ where: { ownerId: user.id, kind: { in: ["gimnasio", "entrenador", "federacion"] } } }) : Promise.resolve(0),
    user?.role === "TRAINER" ? db.trainer.findUnique({ where: { userId: user.id }, select: { slug: true, gym: { select: { slug: true } } } }) : Promise.resolve(null),
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
    <html lang="es">
      <body>
        <a href="#contenido" className="skip">Saltar al contenido</a>
        <header className="top">
          <div className="in">
            <Link href="/" className="logo"><svg className="brand-mark" viewBox="0 0 64 48" aria-hidden="true"><ellipse cx="24" cy="24" rx="18" ry="12" transform="rotate(-35 24 24)" fill="none" stroke="currentColor" strokeWidth="7"/><ellipse cx="42" cy="24" rx="18" ry="12" transform="rotate(-35 42 24)" fill="none" stroke="currentColor" strokeWidth="7"/></svg>RING <b>ESPAÑA</b></Link>
            <nav aria-label="Principal">
              <Link href="/peleadores">Peleadores</Link>
              <Link href="/ranking">Ránking</Link>
              <Link href="/veladas">Veladas</Link>
              <Link href="/gimnasios">Gimnasios</Link>
              <Link href="/entrenadores">Entrenadores</Link>
            </nav>
            <NavigationMenu secciones={secciones} logoutForm={user ? <form action={logout}><button className="secondary">Salir</button></form> : undefined} />
            <div className="cuenta">
              <Link href="/ayuda">¿Cómo funciona?</Link>
              {user ? (
                <>
                  {user.role === "ADMIN" && <Link href="/moderacion">Moderación</Link>}
                  <Link href="/mi-panel">Mi panel</Link>
                  {papel === "entidad" && <Link href="/organizador">Mis veladas</Link>}
                  {papel === "entrenador" && <Link href="/mis-clases">Mis clases</Link>}
                  {papel === "peleador" && <Link href="/mi-ficha">Mi ficha</Link>}
                  <Link href="/mi-cuenta">Mi cuenta</Link>
                  <form action={logout}><button className="secondary">Salir</button></form>
                </>
              ) : (
                <><Link href="/entrar">Entrar</Link><Link href="/registro" className="btn">Registrarse</Link></>
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
        <main id="contenido"><Suspense fallback={null}><FlashNotice /><RecordarCampos /></Suspense><EvitarDobleEnvio />{children}</main>
        <footer className="foot">
          <Link href="/ayuda">¿Cómo funciona?</Link>
          {(!user || puedeOrganizar(user.role)) && <Link href="/organizador">Organizar una velada</Link>}
          {user ? <Link href="/mi-cuenta">Mi cuenta</Link> : <Link href="/registro">Crear una cuenta</Link>}
          <Link href="/federaciones">Federaciones</Link><Link href="/promotores">Promotores</Link>
          <Link href="/privacidad">Privacidad</Link>
          {process.env.CONTACT_EMAIL && <a href={`mailto:${process.env.CONTACT_EMAIL}`}>Contacto</a>}
        </footer>
        <MobileNav papel={papel} />
      </body>
    </html>
  );
}
