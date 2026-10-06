"use client";

import { useState, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { TEMAS_POR_DEPORTE, type ClaveDeporte } from "../../lib/common/temas";

const DEPORTES = Object.keys(TEMAS_POR_DEPORTE) as ClaveDeporte[];

type Props = {
  deporteActivo: ClaveDeporte;
  accion: (formData: FormData) => Promise<void>;
};

/** Selector temporal de T-015: radios reales y botón de envío para que funcione también sin JavaScript. */
export default function SelectorDeporte({ deporteActivo, accion }: Props) {
  const [seleccion, setSeleccion] = useState(deporteActivo);
  const pathname = usePathname() || "/";

  const conFlechas = (event: KeyboardEvent<HTMLDivElement>) => {
    const actual = DEPORTES.indexOf(seleccion);
    if (actual < 0 || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const paso = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    const siguiente = DEPORTES[(actual + paso + DEPORTES.length) % DEPORTES.length];
    setSeleccion(siguiente);
    event.currentTarget.querySelector<HTMLInputElement>(`input[value="${siguiente}"]`)?.focus();
  };

  return (
    <form action={accion} className="selector-deporte">
      <input type="hidden" name="back" value={pathname} />
      {/* Región desplazable accesible (se puede recorrer con el teclado) que contiene el grupo de opciones. */}
      <div role="region" aria-label="Deportes disponibles" tabIndex={0} className="selector-deporte-opciones">
        <div role="radiogroup" aria-label="Deporte activo" onKeyDown={conFlechas} className="selector-deporte-grupo">
          {DEPORTES.map((clave) => (
            <label key={clave} className="selector-deporte-opcion">
              <input type="radio" name="deporte" value={clave} checked={seleccion === clave} onChange={() => setSeleccion(clave)} />
              <span>{TEMAS_POR_DEPORTE[clave].nombre}</span>
            </label>
          ))}
        </div>
      </div>
      <button type="submit" className="secondary">Aplicar deporte</button>
    </form>
  );
}
