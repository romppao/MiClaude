import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import FlashNotice from "./FlashNotice";
import { getUser } from "../lib/auth";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: { default: "Ring España", template: "%s · Ring España" },
  description: "La base de datos del boxeo español: peleadores profesionales y amateur, récords, veladas, gimnasios y entrenadores.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="es">
      <body>
        <a href="#contenido" className="skip">Saltar al contenido</a>
        <header className="top">
          <div className="in">
            <Link href="/" className="logo">RING <b>ESPAÑA</b></Link>
            <nav>
              <Link href="/peleadores">Peleadores</Link>
              <Link href="/ranking">Ránking</Link>
              <Link href="/veladas">Veladas</Link>
              <Link href="/gimnasios">Gimnasios</Link>
              <Link href="/entrenadores">Entrenadores</Link>
            </nav>
            <Link href="/ayuda" style={{ fontWeight: 700 }}>¿Cómo funciona?</Link>
            {user ? (
              <>
                {!user.emailVerifiedAt && <Link href="/verificar" className="L">Verifica tu correo electrónico</Link>}
                <Link href="/siguiendo">Mis peleadores</Link>
                <Link href="/mi-ficha">{user.fighter ? "Mi ficha" : user.name}</Link>
                {user.role === "ADMIN" && <Link href="/moderacion">Moderación</Link>}
                <form action={logout}><button style={{ background: "transparent" }}>Salir</button></form>
              </>
            ) : (
              <><Link href="/entrar">Entrar</Link><Link href="/registro">Registrarse</Link></>
            )}
            <form action="/buscar"><input name="q" placeholder="Buscar…" aria-label="Buscar" /></form>
          </div>
        </header>
        <main id="contenido"><Suspense fallback={null}><FlashNotice /></Suspense>{children}</main>
        <footer className="foot">
          <Link href="/ayuda">¿Cómo funciona?</Link>
          <Link href="/organizador">Para organizadores de veladas</Link>
          <Link href="/registro">Crear una cuenta</Link>
        </footer>
      </body>
    </html>
  );
}
