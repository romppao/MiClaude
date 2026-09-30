import Link from "next/link";
import { login } from "../actions";

export const metadata = { title: "Entrar" };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <h1>Entrar</h1>
      {error && <p className="L">Email o contraseña incorrectos.</p>}
      <form className="search" action={login} style={{ flexDirection: "column", maxWidth: 360 }}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Contraseña" required />
        <button>Entrar</button>
      </form>
      <p className="mut">¿Sin cuenta? <Link href="/registro">Regístrate</Link></p>
    </>
  );
}
