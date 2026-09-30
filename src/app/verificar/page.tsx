import Link from "next/link";
import { getUser } from "../../lib/auth";
import { resendVerification, verifyEmail } from "../actions";

export const metadata = { title: "Verificar email" };
export const dynamic = "force-dynamic";

export default async function Verify({ searchParams }: { searchParams: Promise<{ token?: string; ok?: string; sent?: string; error?: string }> }) {
  const { token, ok, sent, error } = await searchParams;
  const user = await getUser();

  // El enlace del correo solo muestra un botón: verificar exige un POST, así los escáneres de enlaces no consumen el token.
  if (token) {
    return (
      <>
        <h1>Confirmar email</h1>
        <form action={verifyEmail}><input type="hidden" name="token" value={token} /><button>Confirmar mi email</button></form>
      </>
    );
  }
  return (
    <>
      <h1>Verificación de email</h1>
      {ok && <p className="W">Email verificado. Ya puedes dar aura, registrar combates y reclamar tu ficha.</p>}
      {error && <p className="L">El enlace no es válido o ha caducado. Pide uno nuevo.</p>}
      {sent && <p className="W">Te hemos enviado un nuevo enlace.</p>}
      {!user ? <p><Link href="/entrar">Entra</Link> para continuar.</p>
        : user.emailVerifiedAt ? <p className="mut">Tu email ({user.email}) está verificado. <Link href="/">Ir al inicio</Link></p>
        : (
          <>
            <p>Hemos enviado un enlace de confirmación a <strong>{user.email}</strong>. Necesitas verificarlo para dar aura, registrar combates o reclamar una ficha.</p>
            <form action={resendVerification}><button>Reenviar enlace</button></form>
          </>
        )}
    </>
  );
}
