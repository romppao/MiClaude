import { getUser, VERIFY_HOURS } from "../../lib/auth";
import { resendVerification, verifyEmail } from "../actions";

export const metadata = { title: "Verificar correo electrónico" };
export const dynamic = "force-dynamic";

/** Botón que lleva a otra pantalla (un formulario GET: se ve y se usa igual que los demás botones). */
const Ir = ({ a, children, secundario }: { a: string; children: React.ReactNode; secundario?: boolean }) => (
  <form action={a} style={{ display: "inline-block", marginRight: 8 }}><button className={secundario ? "secondary" : undefined}>{children}</button></form>
);

export default async function Verify({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const user = await getUser();

  // El enlace del correo solo muestra un botón: verificar exige un POST, así los escáneres de enlaces no consumen el token.
  if (token) {
    return (
      <>
        <h1>Confirmar tu correo electrónico</h1>
        <p>Pulsa el botón para confirmar que este correo electrónico es tuyo.</p>
        <form action={verifyEmail}><input type="hidden" name="token" value={token} /><button>Confirmar mi correo electrónico</button></form>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <h1>Verificación del correo electrónico</h1>
        <p>Para confirmar tu correo electrónico o pedir un enlace nuevo, primero entra en tu cuenta.</p>
        <Ir a="/entrar?next=%2Fverificar">Entrar en mi cuenta</Ir>
      </>
    );
  }

  if (user.emailVerifiedAt) {
    return (
      <>
        <h1>Tu correo electrónico está verificado</h1>
        <p>El correo <strong>{user.email}</strong> ya está confirmado. Ya puedes dar aura, registrar combates y reclamar tu ficha.</p>
        {user.role === "FIGHTER" || user.fighter ? <Ir a="/mi-ficha">Ir a mi ficha de peleador</Ir> : <Ir a="/peleadores">Ver los peleadores</Ir>}
        <Ir a="/" secundario>Ir al inicio</Ir>
      </>
    );
  }

  return (
    <>
      <h1>Confirma tu correo electrónico</h1>
      <p>Hemos enviado un enlace de confirmación a <strong>{user.email}</strong>. Ábrelo desde tu correo y pulsa el botón que verás. El enlace caduca en {VERIFY_HOURS} horas.</p>
      <p className="mut">Sin confirmarlo no puedes dar aura, registrar combates ni reclamar una ficha. Si no lo encuentras, mira en la carpeta de correo no deseado o pide uno nuevo.</p>
      <form action={resendVerification}><button>Reenviar el enlace a {user.email}</button></form>
    </>
  );
}
