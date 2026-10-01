import Link from "next/link";
import { login } from "../actions/accounts";
import { LIMITS } from "../../lib/common/text";
import { internalPath } from "../../lib/common/paths";
import { oneParam } from "../../lib/common/safe";

export const metadata = { title: "Entrar" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; problema?: string }> }) {
  const sp = await searchParams;
  const next = internalPath(oneParam(sp.next) ?? "", "");
  const registro = `/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <>
      <h1>Entrar en tu cuenta</h1>
      {/* Quien llega desde «Entra para dar aura» (o similar) debe saber por qué está aquí y a dónde volverá. El aviso de «sin sesión» ya lo explica. */}
      {next && !sp.problema && <p className="notice notice-info" role="note">Entra en tu cuenta para continuar. Al terminar volverás a la página donde estabas.</p>}
      <form className="search" action={login} style={{ flexDirection: "column", maxWidth: 360 }}>
        {next && <input type="hidden" name="next" value={next} />}
        <label className="field"><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required maxLength={LIMITS.email} /></label>
        <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="current-password" required maxLength={LIMITS.password} /></label>
        <button>Entrar en mi cuenta</button>
      </form>
      <p><Link href="/recuperar">¿Has olvidado tu contraseña? Elige una nueva</Link></p>
      <h2>¿Todavía no tienes cuenta?</h2>
      <p className="acciones"><Link className="btn secondary" href={registro}>Crear mi cuenta</Link></p>
    </>
  );
}
