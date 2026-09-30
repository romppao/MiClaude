import Link from "next/link";
import { register } from "../actions";
import { LIMITS } from "../../lib/text";

export const metadata = { title: "Crear cuenta" };

export default function Register() {
  return (
    <>
      <h1>Crear cuenta</h1>
      <form className="search" action={register} style={{ flexDirection: "column", maxWidth: 360 }}>
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
      </form>
      <p>¿Ya tienes cuenta? <Link href="/entrar">Entra en tu cuenta</Link>. ¿La contraseña? <Link href="/recuperar">Elige una nueva</Link>.</p>
      <p className="mut">¿Dudas? Consulta <Link href="/ayuda">cómo funciona Ring España</Link>.</p>
    </>
  );
}
