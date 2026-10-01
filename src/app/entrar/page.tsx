import Link from "next/link";
import { login } from "../actions/accounts";
import { LIMITS } from "../../lib/common/text";

export const metadata = { title: "Entrar" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1>Entrar en tu cuenta</h1>
      <form className="search" action={login} style={{ flexDirection: "column", maxWidth: 360 }}>
        {next && <input type="hidden" name="next" value={next} />}
        <label className="field"><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required maxLength={LIMITS.email} /></label>
        <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="current-password" required maxLength={LIMITS.password} /></label>
        <button>Entrar en mi cuenta</button>
      </form>
      <p><Link href="/recuperar">¿Has olvidado tu contraseña? Elige una nueva</Link></p>
      <p className="mut">¿Todavía no tienes cuenta? <Link href="/registro">Crea tu cuenta</Link></p>
    </>
  );
}
