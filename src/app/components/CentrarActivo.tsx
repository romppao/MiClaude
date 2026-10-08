"use client";

import { useEffect } from "react";

/**
 * En una fila que se desliza (el selector de deporte de las portadas), lleva a la vista la opción marcada como actual: si no, en un
 * móvil estrecho la portada de Muay Thai abriría con su ficha fuera de la pantalla. Solo mueve la fila, no la página.
 */
export default function CentrarActivo({ fila }: { fila: string }) {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(`nav[aria-label="${fila}"]`);
    const activo = nav?.querySelector<HTMLElement>("a[aria-current=page]");
    if (nav && activo) nav.scrollLeft = activo.offsetLeft - nav.offsetLeft - (nav.clientWidth - activo.offsetWidth) / 2;
  }, [fila]);
  return null;
}
