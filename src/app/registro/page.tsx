import Link from "next/link";
import { register } from "../actions/accounts";
import { LIMITS } from "../../lib/common/text";
import { internalPath } from "../../lib/common/paths";
import { oneParam } from "../../lib/common/safe";

export const metadata = { title: "Crear cuenta" };

export default async function Register({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = internalPath(oneParam((await searchParams).next) ?? "", "");
  return (
    <>
      <h1>Crear cuenta</h1>
      {next && <p className="notice notice-info" role="note">Crea tu cuenta para continuar. Cuando confirmes tu correo electrónico podrás volver a la página donde estabas.</p>}
      <form className="search" action={register} style={{ flexDirection: "column", maxWidth: 360 }}>
        {next && <input type="hidden" name="next" value={next} />}
        <label className="field"><span>Nombre</span><input name="name" autoComplete="name" required maxLength={LIMITS.name} /></label>
        <label className="field"><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required maxLength={LIMITS.email} /><span className="hint">Te enviaremos un enlace para confirmarlo.</span></label>
        <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={LIMITS.password} /><span className="hint">Mínimo 8 caracteres.</span></label>
        <label className="field"><span>¿Qué quieres hacer en Ring España?</span>
          <select name="role" defaultValue="FAN">
            <option value="FAN">Dar aura a peleadores y consultar veladas</option>
            <option value="FIGHTER">Tener mi ficha de peleador y registrar mi récord</option>
          </select>
        </label>
        <button>Crear mi cuenta</button>
        <span className="hint">Al crear tu cuenta aceptas que tratemos tus datos como explicamos en la <Link href="/privacidad">política de privacidad</Link>.</span>
      </form>
      <p>¿Ya tienes cuenta? <Link href={`/entrar${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Entra en tu cuenta</Link>. ¿La contraseña? <Link href="/recuperar">Elige una nueva</Link>.</p>
      <p className="mut">¿Dudas? Consulta <Link href="/ayuda">cómo funciona Ring España</Link>.</p>
    </>
  );
}
