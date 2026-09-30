import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Ring España", template: "%s · Ring España" },
  description: "La base de datos del boxeo español: boxeadores profesionales y amateur, récords, veladas, gimnasios y entrenadores.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="top">
          <div className="in">
            <Link href="/" className="logo">RING <b>ESPAÑA</b></Link>
            <nav>
              <Link href="/boxeadores">Boxeadores</Link>
              <Link href="/veladas">Veladas</Link>
              <Link href="/gimnasios">Gimnasios</Link>
              <Link href="/entrenadores">Entrenadores</Link>
            </nav>
            <form action="/buscar"><input name="q" placeholder="Buscar…" aria-label="Buscar" /></form>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
