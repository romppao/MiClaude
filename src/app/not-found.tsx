import Link from "next/link";

export const metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <>
      <h1>No hemos encontrado esta página</h1>
      <p>Puede que el enlace esté mal escrito o que la página ya no exista. Puedes volver al inicio o buscar lo que necesitas.</p>
      <p className="acciones">
        <Link href="/" className="btn">Ir al inicio</Link>
        <Link href="/buscar" className="btn secondary">Buscar un peleador, un gimnasio o una velada</Link>
      </p>
    </>
  );
}
