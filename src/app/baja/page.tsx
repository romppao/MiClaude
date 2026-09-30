import Link from "next/link";
import { unsubscribeEmails } from "../actions";

export const metadata = { title: "Dejar de recibir avisos", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Enlace de baja de los correos de aviso. Como la verificación, solo enseña un botón: el cambio se hace con un POST. */
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <>
        <h1>Avisos por correo electrónico</h1>
        <p>Puedes activar o desactivar los avisos cuando quieras desde <Link href="/mi-cuenta">Mi cuenta</Link>.</p>
      </>
    );
  }
  return (
    <>
      <h1>Dejar de recibir avisos por correo</h1>
      <p>Pulsa el botón y no te enviaremos más avisos de nuevos combates de los peleadores que sigues. Seguirás viéndolos en «Mis peleadores».</p>
      <form action={unsubscribeEmails}><input type="hidden" name="token" value={token} /><button>Dejar de recibir avisos</button></form>
    </>
  );
}
