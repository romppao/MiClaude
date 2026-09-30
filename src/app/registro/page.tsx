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
        <input name="name" placeholder="Nombre" required />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Contraseña (mín. 8)" required minLength={8} />
        <select name="role" defaultValue="FAN">
          <option value="FAN">Soy aficionado (quiero valorar boxeadores)</option>
          <option value="BOXER">Soy boxeador amateur (quiero mi ficha y récord)</option>
        </select>
        <button>Crear cuenta</button>
      </form>
    </>
  );
}
