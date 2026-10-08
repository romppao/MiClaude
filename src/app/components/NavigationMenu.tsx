"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { SeccionMenu } from "../../lib/accounts/menu";

/** Las secciones llegan ya filtradas por tipo de cuenta (src/lib/accounts/menu.ts). */
type Props = {
  secciones: SeccionMenu[];
  logoutForm?: ReactNode;
};

/** El diálogo nativo conserva el foco, admite Escape y mantiene el fondo fuera de la navegación por teclado. */
export default function NavigationMenu({ secciones, logoutForm }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const show = () => {
    dialog.current?.showModal();
    setOpen(true);
  };
  const close = () => {
    dialog.current?.close();
    setOpen(false);
  };
  return (
    <>
      <button
        className="secondary menu-open"
        onClick={show}
        disabled={!mounted}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="navigation-menu"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M3 6h18M3 12h18M3 18h18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        Menú
      </button>
      {mounted &&
        createPortal(
          <dialog
            id="navigation-menu"
            ref={dialog}
            className="menu-dialog"
            aria-labelledby="menu-heading"
            onClose={() => setOpen(false)}
            onKeyDown={(event) => {
              // El foco no sale del menú con Tab ni con Mayús+Tab: da la vuelta dentro (el diálogo nativo deja salir a la barra del navegador).
              if (event.key !== "Tab") return;
              const focos = [...event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
              if (!focos.length) return;
              const [primero, ultimo] = [focos[0], focos[focos.length - 1]];
              if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo.focus(); }
              else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero.focus(); }
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <div className="menu-panel">
              <div className="menu-heading">
                <strong id="menu-heading">Explora Ring España</strong>
                <button
                  className="secondary"
                  onClick={close}
                  aria-label="Cerrar menú"
                >
                  Cerrar ×
                </button>
              </div>
              <nav
                className="menu-navigation"
                onSubmit={close}
                aria-label="Menú de tu cuenta"
                onClick={(event) => {
                  if (
                    event.target instanceof Element &&
                    event.target.closest("a")
                  )
                    close();
                }}
              >
                {secciones.map((sec, i) => (
                  <section key={sec.titulo}>
                    <h2>{sec.titulo}</h2>
                    <ul>
                      {sec.enlaces.map((e) => (
                        <li key={e.texto}>
                          <Link href={e.href}>{e.texto}</Link>
                        </li>
                      ))}
                    </ul>
                    {i === secciones.length - 1 && logoutForm}
                  </section>
                ))}
              </nav>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
