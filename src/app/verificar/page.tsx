import { getUser, readReturnPath, VERIFY_HOURS } from "../../lib/accounts/auth";
import { resendVerification, verifyEmail } from "../actions/accounts";
import { demoConfirmarCorreo } from "../actions/demo";
import { demoActiva } from "../../lib/common/demo";

export const metadata = { title: "Verificar correo electrónico" };
export const dynamic = "force-dynamic";

/** Botón que lleva a otra pantalla (un formulario GET: se ve y se usa igual que los demás botones). */
const Ir = ({ a, children, secundario }: { a: string; children: React.ReactNode; secundario?: boolean }) => (
  <form action={a} style={{ display: "inline-block", marginRight: 8 }}><button className={secundario ? "secondary" : undefined}>{children}</button></form>
);

export default async function Verify({ searchParams }: { searchParams: Promise<{ token?: string; aviso?: string }> }) {
  const { token, aviso } = await searchParams;
  const user = await getUser();
  const volver = await readReturnPath(); // a dónde quería ir quien se registró desde «Entra para…» (solo en el mismo navegador)

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
    // Quien confirma el enlace en otro aparato (por ejemplo, el móvil) llega sin sesión: se le dice que está confirmado y se le invita a entrar.
    const confirmado = aviso === "correo_verificado";
    const entrar = `/entrar${volver ? `?next=${encodeURIComponent(volver)}` : ""}`;
    return (
      <>
        <h1>{confirmado ? "Tu correo electrónico está confirmado" : "Verificación del correo electrónico"}</h1>
        <p>{confirmado ? "Ya está todo listo. Entra en tu cuenta para empezar a usar Ring España." : "Para confirmar tu correo electrónico o pedir un enlace nuevo, primero entra en tu cuenta."}</p>
        <Ir a={entrar}>Entrar en mi cuenta</Ir>
      </>
    );
  }

  if (user.emailVerifiedAt) {
    return (
      <>
        <h1>Tu correo electrónico está verificado</h1>
        <p>El correo <strong>{user.email}</strong> ya está confirmado. Ya puedes dar aura, registrar combates y reclamar tu ficha.</p>
        {volver && <Ir a={volver}>Volver a lo que estabas haciendo</Ir>}
        {user.role === "FIGHTER" || user.fighter ? <Ir a="/mi-ficha" secundario={!!volver}>Ir a mi ficha de peleador</Ir> : <Ir a="/peleadores" secundario={!!volver}>Ver los peleadores</Ir>}
        <Ir a="/" secundario>Ir al inicio</Ir>
      </>
    );
  }

  return (
    <>
      <h1>Confirma tu correo electrónico</h1>
      <p>Hemos enviado un enlace de confirmación a <strong>{user.email}</strong>. Ábrelo desde tu correo y pulsa el botón que verás. El enlace caduca en {VERIFY_HOURS} horas.</p>
      <p className="mut">Sin confirmarlo no puedes dar aura, registrar combates ni reclamar una ficha. Si no lo encuentras, mira en la carpeta de correo no deseado o pide uno nuevo.</p>
      {demoActiva() && (
        <div className="notice" style={{ marginBottom: 16 }}>
          <p style={{ marginTop: 0 }}><strong>Versión de demostración:</strong> aquí no se envían correos de verdad. Pulsa el botón para dar por confirmado tu correo y seguir probando.</p>
          <form action={demoConfirmarCorreo}><button>Confirmar mi correo ahora (solo demostración)</button></form>
        </div>
      )}
      <form action={resendVerification}><button className={demoActiva() ? "secondary" : undefined}>Reenviar el enlace a {user.email}</button></form>
    </>
  );
}
