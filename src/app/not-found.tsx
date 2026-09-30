import Link from "next/link";

export const metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <>
      <h1>No hemos encontrado esta página</h1>
      <p>Puede que el enlace esté mal escrito o que la página ya no exista. Puedes volver al inicio o buscar lo que necesitas.</p>
      <p style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/"><button>Ir al inicio</button></Link>
        <Link href="/buscar"><button className="secondary">Buscar un peleador, un gimnasio o una velada</button></Link>
      </p>
    </>
  );
}
