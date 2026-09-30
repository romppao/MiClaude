import Link from "next/link";
import { register } from "../actions";

export const metadata = { title: "Crear cuenta" };
const ERR: Record<string, string> = { datos: "Revisa nombre y email.", password: "La contraseña necesita 8 caracteres como mínimo.", email: "Ese email ya tiene cuenta." };

export default async function Register({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <h1>Crear cuenta</h1>
      {error && <p className="L">{ERR[error]}</p>}
      <form className="search" action={register} style={{ flexDirection: "column", maxWidth: 360 }}>
        <label className="field"><span>Nombre</span><input name="name" autoComplete="name" required /></label>
        <label className="field"><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required /></label>
        <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="new-password" required minLength={8} /><span className="hint">Mínimo 8 caracteres.</span></label>
        <label className="field"><span>¿Qué quieres hacer en Ring España?</span>
          <select name="role" defaultValue="FAN">
            <option value="FAN">Valorar a boxeadores y consultar veladas</option>
            <option value="BOXER">Tener mi ficha de boxeador y registrar mi récord</option>
          </select>
        </label>
        <button>Crear mi cuenta</button>
      </form>
      <p className="mut">¿Dudas? Consulta <Link href="/ayuda">cómo funciona Ring España</Link>.</p>
    </>
  );
}
