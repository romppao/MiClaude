"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  signedIn: boolean;
  hasFighter: boolean;
  hasManagedProfiles: boolean;
  admin: boolean;
  canSupport: boolean;
  logoutForm?: ReactNode;
};

/** El diálogo nativo conserva el foco, admite Escape y mantiene el fondo fuera de la navegación por teclado. */
export default function NavigationMenu({
  signedIn,
  hasFighter,
  hasManagedProfiles,
  admin,
  canSupport,
  logoutForm,
}: Props) {
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
                aria-label="Menú por actividades"
                onClick={(event) => {
                  if (
                    event.target instanceof Element &&
                    event.target.closest("a")
                  )
                    close();
                }}
              >
                <section>
                  <h2>Para deportistas</h2>
                  <ul>
                    <li>
                      <Link href="/peleadores">Peleadores</Link>
                    </li>
                    <li>
                      <Link href="/veladas">Veladas y resultados</Link>
                    </li>
                    <li>
                      <Link href="/ranking">Ránking de aura</Link>
                    </li>
                    <li>
                      <Link href="/mi-ficha">
                        {hasFighter
                          ? "Mi ficha y trayectoria"
                          : "Crear o reclamar mi ficha"}
                      </Link>
                    </li>
                  </ul>
                </section>
                <section>
                  <h2>Para clubes y entrenadores</h2>
                  <ul>
                    <li>
                      <Link href="/gimnasios">Encontrar gimnasio</Link>
                    </li>
                    <li>
                      <Link href="/entrenadores">Encontrar entrenador</Link>
                    </li>
                    <li>
                      <Link href="/federaciones">Federaciones</Link>
                    </li>
                    {hasManagedProfiles && (
                      <li>
                        <Link href="/mi-cuenta">Gestionar mis perfiles</Link>
                      </li>
                    )}
                  </ul>
                </section>
                <section>
                  <h2>Para promotores</h2>
                  <ul>
                    <li>
                      <Link href="/promotores">Promotores de veladas</Link>
                    </li>
                    <li>
                      <Link href="/organizador">
                        Publicar o gestionar una velada
                      </Link>
                    </li>
                  </ul>
                </section>
                <section>
                  <h2>Tu cuenta y ayuda</h2>
                  <ul>
                    <li>
                      <Link href="/ayuda">¿Cómo funciona?</Link>
                    </li>
                    {signedIn ? (
                      <>
                        <li>
                          <Link href="/mi-cuenta">Mi cuenta</Link>
                        </li>
                        <li>
                          <Link href="/siguiendo">Peleadores que sigo</Link>
                        </li>
                        {canSupport && (
                          <li>
                            <Link href="/respaldar">
                              Respaldar resultados y títulos
                            </Link>
                          </li>
                        )}
                        {admin && (
                          <li>
                            <Link href="/moderacion">Moderación</Link>
                          </li>
                        )}
                      </>
                    ) : (
                      <>
                        <li>
                          <Link href="/entrar">Entrar</Link>
                        </li>
                        <li>
                          <Link href="/registro">Crear una cuenta</Link>
                        </li>
                      </>
                    )}
                  </ul>
                  {logoutForm}
                </section>
              </nav>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
