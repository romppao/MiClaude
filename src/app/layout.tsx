import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { getUser } from "../lib/auth";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: { default: "Ring España", template: "%s · Ring España" },
  description: "La base de datos del boxeo español: boxeadores profesionales y amateur, récords, veladas, gimnasios y entrenadores.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="es">
      <body>
        <header className="top">
          <div className="in">
            <Link href="/" className="logo">RING <b>ESPAÑA</b></Link>
            <nav>
              <Link href="/boxeadores">Boxeadores</Link>
              <Link href="/ranking">Ránking</Link>
              <Link href="/veladas">Veladas</Link>
              <Link href="/gimnasios">Gimnasios</Link>
              <Link href="/entrenadores">Entrenadores</Link>
            </nav>
            {user ? (
              <>
                {!user.emailVerifiedAt && <Link href="/verificar" className="L">Verifica tu email</Link>}
                <Link href="/mi-ficha">{user.boxer ? "Mi ficha" : user.name}</Link>
                <Link href="/organizador">Organizadores</Link>
                {user.role === "ADMIN" && <Link href="/admin">Moderación</Link>}
                <form action={logout}><button style={{ background: "transparent" }}>Salir</button></form>
              </>
            ) : (
              <><Link href="/entrar">Entrar</Link><Link href="/registro">Registrarse</Link></>
            )}
            <form action="/buscar"><input name="q" placeholder="Buscar…" aria-label="Buscar" /></form>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
