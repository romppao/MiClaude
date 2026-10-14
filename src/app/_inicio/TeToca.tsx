import Link from "next/link";

/** Pendientes personales: el panel omite el bloque cuando no hay nada que atender. */
export default function TeToca({ pendientes }: { pendientes: { texto: string; href: string; cantidad: number }[] }) {
  const visibles = pendientes.filter((p) => p.cantidad > 0);
  if (!visibles.length) return null;
  return <section className="tarjeta" aria-label="Te toca">
    <h2>Te toca</h2>
    {visibles.map((p) => <Link key={p.href} href={p.href} className="fila"><span className="cuerpo">{p.texto}</span><span className="pildora">{p.cantidad}</span></Link>)}
  </section>;
}
