"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Una única navegación para escritorio y móvil, conservando los permisos del servidor. */
export default function HeaderMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]);
  return <>
    <button ref={trigger} type="button" className="header-menu-toggle secondary" aria-expanded={open} aria-controls="header-menu" onClick={() => setOpen(!open)}>
      <span aria-hidden="true">{open ? "×" : "☰"}</span> {open ? "Cerrar" : "Menú"}
    </button>
    <div id="header-menu" className={`header-menu${open ? " is-open" : ""}`}
      onKeyDown={(event) => { if (event.key === "Escape" && open) { setOpen(false); trigger.current?.focus(); } }}
      onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}>
      {children}
    </div>
  </>;
}
