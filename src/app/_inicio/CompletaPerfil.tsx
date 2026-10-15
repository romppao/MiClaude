import Link from "next/link";

/** Progreso calculado con datos existentes; cada carencia enlaza al formulario que la resuelve. */
export default function CompletaPerfil({ campos }: { campos: { texto: string; completo: boolean; href: string }[] }) {
  const faltan = campos.filter((c) => !c.completo);
  if (!faltan.length) return null;
  const porcentaje = Math.round(100 * (campos.length - faltan.length) / campos.length);
  return <section className="tarjeta" aria-label="Completa tu perfil">
    <h2>Completa tu perfil</h2>
    <label>Perfil completado: {porcentaje} %<progress value={porcentaje} max={100} style={{ width: "100%" }} /></label>
    <ul>{faltan.map((c) => <li key={c.texto}><Link href={c.href}>{c.texto}</Link></li>)}</ul>
  </section>;
}
