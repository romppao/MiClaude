"use client";
import { useEffect, useState } from "react";

const dos = (n: number) => String(n).padStart(2, "0");

/** Cuenta atrás hasta un combate (días, horas, minutos y segundos). Sin JavaScript se ve la que había al cargar la página. */
export default function CuentaAtras({ hasta, inicio }: { hasta: string; inicio: number }) {
  const [ahora, setAhora] = useState(inicio);
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, Date.parse(hasta) - ahora);
  const partes: [string, string][] = [[String(Math.floor(ms / 864e5)), "días"], [dos(Math.floor(ms / 36e5) % 24), "horas"], [dos(Math.floor(ms / 6e4) % 60), "min"], [dos(Math.floor(ms / 1e3) % 60), "seg"]];
  return (
    <div className="cuenta-atras" role="timer" aria-label={`Faltan ${partes[0][0]} días y ${Number(partes[1][0])} horas`}>
      {partes.map(([v, u]) => <div key={u} aria-hidden="true"><b>{v}</b><span>{u}</span></div>)}
    </div>
  );
}
