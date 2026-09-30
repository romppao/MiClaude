import Link from "next/link";
import { login } from "../actions";

export const metadata = { title: "Entrar" };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <>
      <h1>Entrar</h1>
      {error && <p className="L">Email o contraseña incorrectos.</p>}
      <form className="search" action={login} style={{ flexDirection: "column", maxWidth: 360 }}>
        {next && <input type="hidden" name="next" value={next} />}
        <label className="field"><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required /></label>
        <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="current-password" required /></label>
        <button>Entrar</button>
      </form>
      <p className="mut">¿Sin cuenta? <Link href="/registro">Crea tu cuenta</Link></p>
    </>
  );
}
