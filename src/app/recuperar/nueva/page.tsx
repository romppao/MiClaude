import { resetPassword } from "../../actions";
import { isResetTokenUsable } from "../../../lib/auth";
import { LIMITS } from "../../../lib/text";

export const metadata = { title: "Elegir una contraseña nueva", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewPassword({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  // El enlace del correo solo enseña el formulario; el cambio se hace al pulsar el botón (POST), así los escáneres de enlaces no lo gastan.
  if (!token || !(await isResetTokenUsable(token))) {
    return (
      <>
        <h1>El enlace ya no sirve</h1>
        <p>Este enlace no es válido, ya se ha usado o ha caducado (duran 1 hora). No pasa nada: puedes pedir uno nuevo.</p>
        <form action="/recuperar"><button>Pedir un enlace nuevo</button></form>
      </>
    );
  }
  return (
    <>
      <h1>Elige tu contraseña nueva</h1>
      <form className="search" action={resetPassword} style={{ flexDirection: "column", maxWidth: 360 }}>
        <input type="hidden" name="token" value={token} />
        <label className="field"><span>Contraseña nueva</span><input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={LIMITS.password} /><span className="hint">Mínimo 8 caracteres.</span></label>
        <label className="field"><span>Repite la contraseña nueva</span><input name="repeat" type="password" autoComplete="new-password" required minLength={8} maxLength={LIMITS.password} /></label>
        <button>Guardar mi contraseña nueva</button>
      </form>
      <p className="mut">Al guardarla, cerraremos las sesiones abiertas en otros dispositivos.</p>
    </>
  );
}
