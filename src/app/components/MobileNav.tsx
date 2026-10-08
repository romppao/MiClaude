"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Papel } from "../../lib/accounts/landing";

/** Barra inferior por tipo de cuenta (diseño v3: cuatro pestañas). La portada es común; lo propio de cada cuenta está en «Mi panel». */

const ICONO = {
  inicio: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z",
  panel: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  peleadores: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3",
  veladas: "M4 5h16v16H4ZM8 2v6m8-6v6M4 11h16",
  gimnasios: "M2 9v6m3-9v12m3-7h8m0-5v12m3-9v6",
  siguiendo: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
  miFicha: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M18 2H6v7a6 6 0 0 0 12 0V2Z",
  orgVeladas: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM9 16l2 2 4-4",
  clases: "M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5",
};

type Pestana = { href: string; label: string; icon: string; tambien?: string[] };
const INICIO: Pestana = { href: "/", label: "Inicio", icon: ICONO.inicio };
const PELEADORES: Pestana = { href: "/peleadores", label: "Peleadores", icon: ICONO.peleadores, tambien: ["/ranking"] };
const VELADAS: Pestana = { href: "/veladas", label: "Veladas", icon: ICONO.veladas };

const PANEL: Pestana = { href: "/mi-panel", label: "Mi panel", icon: ICONO.panel, tambien: ["/siguiendo", "/compartir"] };
const MIS_VELADAS: Pestana = { href: "/organizador", label: "Mis veladas", icon: ICONO.orgVeladas };

const PESTANAS: Record<Papel, Pestana[]> = {
  visitante: [INICIO, PELEADORES, VELADAS, { href: "/gimnasios", label: "Gimnasios", icon: ICONO.gimnasios }],
  usuario: [INICIO, PELEADORES, VELADAS, PANEL],
  peleador: [INICIO, VELADAS, PANEL, { href: "/mi-ficha", label: "Mi ficha", icon: ICONO.miFicha }],
  entrenador: [INICIO, PANEL, { href: "/mis-clases", label: "Mis clases", icon: ICONO.clases }, MIS_VELADAS],
  entidad: [INICIO, PANEL, MIS_VELADAS, VELADAS],
};

const SIN_BARRA = ["/bienvenida", "/entrar", "/registro"];

const dentro = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

export default function MobileNav({ papel = "visitante" }: { papel?: Papel }) {
  const pathname = usePathname() ?? "";
  // Como en el diseño v3, la bienvenida, el acceso y el registro van sin barra inferior: la persona se centra en terminar ese paso.
  if (SIN_BARRA.some((r) => dentro(pathname, r))) return null;
  return <nav className="mobile-nav" aria-label="Navegación móvil">
    {PESTANAS[papel].map(({ href, label, icon, tambien }) => <Link key={href} href={href} aria-current={[href, ...(tambien ?? [])].some((h) => dentro(pathname, h)) ? "page" : undefined}>
      <svg aria-hidden="true" className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg><span>{label}</span>
    </Link>)}
  </nav>;
}
