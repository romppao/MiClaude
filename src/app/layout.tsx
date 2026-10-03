import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import FlashNotice from "./components/FlashNotice";
import RecordarCampos from "./components/RecordarCampos";
import EvitarDobleEnvio from "./components/EvitarDobleEnvio";
import { getUser } from "../lib/accounts/auth";
import { logout } from "./actions/accounts";
import { APP_URL } from "../lib/common/mail";
import { demoActiva } from "../lib/common/demo";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "Ring España", template: "%s · Ring España" },
  description: "La comunidad de deportes de contacto de toda España: peleadores, récords, veladas, gimnasios y entrenadores de boxeo, jiu-jitsu, K-1, kickboxing, MMA y Muay Thai, amateur y profesional.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const tieneFicha = !!user && (!!user.fighter || user.role === "FIGHTER");
  return (
    <html lang="es">
      <body>
        <a href="#contenido" className="skip">Saltar al contenido</a>
        <header className="top">
          <div className="in">
            <Link href="/" className="logo">RING <b>ESPAÑA</b></Link>
            <nav aria-label="Principal">
              <Link href="/peleadores">Peleadores</Link>
              <Link href="/ranking">Ránking</Link>
              <Link href="/veladas">Veladas</Link>
              <Link href="/gimnasios">Gimnasios</Link>
              <Link href="/entrenadores">Entrenadores</Link>
            </nav>
            <div className="cuenta">
              <Link href="/ayuda" style={{ fontWeight: 700 }}>¿Cómo funciona?</Link>
              {user ? (
                <>
                  {user.role === "ADMIN" && <Link href="/moderacion">Moderación</Link>}
                  {user.role === "ORGANIZER" && <Link href="/organizador">Mis veladas</Link>}
                  {tieneFicha && <Link href="/mi-ficha">Mi ficha</Link>}
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
          <Link href="/organizador">Organizar una velada</Link>
          {user ? <Link href="/mi-cuenta">Mi cuenta</Link> : <Link href="/registro">Crear una cuenta</Link>}
          <Link href="/privacidad">Privacidad</Link>
          {process.env.CONTACT_EMAIL && <a href={`mailto:${process.env.CONTACT_EMAIL}`}>Contacto</a>}
        </footer>
      </body>
    </html>
  );
}
