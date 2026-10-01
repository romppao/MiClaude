import Link from "next/link";
import { requestPasswordReset } from "../actions/accounts";
import { LIMITS } from "../../lib/common/text";

export const metadata = { title: "¿Has olvidado tu contraseña?" };

export default function Recover() {
  return (
    <>
      <h1>¿Has olvidado tu contraseña?</h1>
      <p>Escribe el correo electrónico con el que creaste tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.</p>
      <form className="search" action={requestPasswordReset} style={{ flexDirection: "column", alignItems: "stretch", maxWidth: 360 }}>
        <label className="field"><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required maxLength={LIMITS.email} /></label>
        <button>Enviar el enlace a mi correo electrónico</button>
      </form>
      <p className="mut">¿Ya la recuerdas? <Link href="/entrar">Entra en tu cuenta</Link>.</p>
    </>
  );
}
