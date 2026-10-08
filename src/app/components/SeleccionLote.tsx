"use client";
import { useEffect, useState } from "react";

/**
 * «Marcar todas» y el recuento de marcadas para responder a varias solicitudes a la vez. Las casillas de cada tarjeta pertenecen al
 * formulario `formulario` con el atributo `form` (las tarjetas tienen su propio formulario y no se pueden anidar). Sin JavaScript, las
 * casillas siguen funcionando una a una.
 */
export default function SeleccionLote({ formulario }: { formulario: string }) {
  const [marcadas, setMarcadas] = useState(0);
  const [total, setTotal] = useState(0);
  const casillas = () => Array.from(document.querySelectorAll<HTMLInputElement>(`input[type=checkbox][form="${formulario}"][name=ids]`));
  useEffect(() => {
    const contar = () => { const c = casillas(); setTotal(c.length); setMarcadas(c.filter((x) => x.checked).length); };
    contar();
    document.addEventListener("change", contar);
    return () => document.removeEventListener("change", contar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formulario]);
  if (total === 0) return null;
  const todas = marcadas === total;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <label className="marcar">
        <input type="checkbox" checked={todas} onChange={() => { for (const c of casillas()) c.checked = !todas; setMarcadas(todas ? 0 : total); }} />
        <span>{todas ? "Desmarcar todas" : `Marcar todas las de esta lista (${total})`}</span>
      </label>
      <span className="meta" role="status" aria-live="polite">{marcadas === 1 ? "1 marcada" : `${marcadas} marcadas`}</span>
    </div>
  );
}
