"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/", label: "Inicio", icon: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z" },
  { href: "/peleadores", label: "Peleadores", icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3" },
  { href: "/veladas", label: "Veladas", icon: "M4 5h16v16H4ZM8 2v6m8-6v6M4 11h16" },
  { href: "/gimnasios", label: "Gimnasios", icon: "M2 9v6m3-9v12m3-7h8m0-5v12m3-9v6" },
];

export default function MobileNav() {
  const pathname = usePathname() ?? "";
  return <nav className="mobile-nav" aria-label="Navegación móvil">
    {sections.map(({ href, label, icon }) => <Link key={href} href={href} aria-current={(href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")) ? "page" : undefined}>
      <svg aria-hidden="true" className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg><span>{label}</span>
    </Link>)}
  </nav>;
}
