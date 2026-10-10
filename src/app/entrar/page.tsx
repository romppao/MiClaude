import Link from "next/link";
import { login } from "../actions/accounts";
import { LIMITS } from "../../lib/common/text";
import { internalPath } from "../../lib/common/paths";
import { oneParam } from "../../lib/common/safe";
import Icono from "../components/Icono";

export const metadata = { title: "Entrar" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; problema?: string }> }) {
  const sp = await searchParams;
  const next = internalPath(oneParam(sp.next) ?? "", "");
  const registro = `/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <div className="pantalla pantalla-formulario">
      <div className="cabecera-pantalla">
        <Link href="/bienvenida" className="boton-icono" aria-label="Volver a la bienvenida"><Icono nombre="atras" tam={22} /></Link>
        <span className="titulo" aria-hidden="true">Entrar</span>
        <span style={{ width: 44 }} />
      </div>
      <div>
        <h1>Entrar en tu cuenta</h1>
        <p className="lead">Entra en tu cuenta para seguir donde lo dejaste.</p>
      </div>
      {/* Quien llega desde «Entra para dar aura» (o similar) debe saber por qué está aquí y a dónde volverá. El aviso de «sin sesión» ya lo explica. */}
      {next && !sp.problema && <p className="notice notice-info" role="note">Entra en tu cuenta para continuar. Al terminar volverás a la página donde estabas.</p>}
      <form action={login} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {next && <input type="hidden" name="next" value={next} />}
        <label className="field"><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required maxLength={LIMITS.email} placeholder="tu@correo.es" /></label>
        <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="current-password" required maxLength={LIMITS.password} placeholder="Mínimo 8 caracteres" /></label>
        <button className="btn-grande" style={{ marginTop: 8 }}>Entrar en mi cuenta</button>
      </form>
      <p style={{ margin: 0 }}><Link href="/recuperar">¿Has olvidado tu contraseña? Elige una nueva</Link></p>
      <div className="tarjeta" style={{ alignItems: "flex-start" }}>
        <h2 style={{ fontSize: 20 }}>¿Todavía no tienes cuenta?</h2>
        <p className="acciones" style={{ margin: 0 }}><Link className="btn secondary" href={registro}>Crear mi cuenta</Link></p>
      </div>
    </div>
  );
}
