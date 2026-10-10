import { redirect } from "next/navigation";
import { db } from "../../../lib/common/db";
import { getUser, getUserPendingSecondFactor } from "../../../lib/accounts/auth";
import { esCreador } from "../../../lib/accounts/creador";
import { claveLegible, enlaceApp, nuevaClave } from "../../../lib/accounts/totp";
import { internalPath } from "../../../lib/common/paths";
import { oneParam } from "../../../lib/common/safe";
import { activarSegundoPaso, comprobarSegundoPaso } from "../../actions/creador";
import { logout } from "../../actions/accounts";
import CodigosEmergencia from "../../components/CodigosEmergencia";

export const metadata = { title: "Segundo paso para entrar" };
export const dynamic = "force-dynamic";

/**
 * Segundo paso al entrar con la cuenta del creador (lib/accounts/creador.ts). La primera vez se activa la aplicación de códigos y se
 * entregan los códigos de emergencia; después se pide un código de la aplicación o uno de emergencia.
 */
export default async function SegundoPaso({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = internalPath(oneParam((await searchParams).next) ?? "", "");
  const destino = next || "/moderacion/usuarios";
  if (await getUser()) redirect(destino);
  const user = await getUserPendingSecondFactor();
  if (!user || !esCreador(user)) redirect("/entrar?problema=segundo_paso_caducado");

  const salir = <form action={logout}><button className="secondary">Cancelar y salir</button></form>;

  if (!user.totpConfirmedAt) {
    // La clave se crea al enseñarla y se guarda sin activar: se activa al escribir el primer código bueno.
    const clave = user.totpSecret ?? (await db.user.update({ where: { id: user.id }, data: { totpSecret: nuevaClave() } })).totpSecret!;
    return (
      <div className="pantalla pantalla-formulario" style={{ gap: 18 }}>
        <div>
          <h1>Protege la cuenta del creador</h1>
          <p className="lead">Esta cuenta puede cambiarlo todo, así que además de la contraseña pedirá un código cada vez que entres. Se prepara una sola vez y tarda dos minutos.</p>
        </div>
        <ol className="lista-pasos" style={{ display: "flex", flexDirection: "column", gap: 14, paddingLeft: 22, margin: 0 }}>
          <li>Instala en tu móvil una <strong>aplicación de códigos</strong> gratuita: Google Authenticator, Microsoft Authenticator o la de tu gestor de contraseñas.</li>
          <li>
            Añade la cuenta. Si estás en el móvil, pulsa <a href={enlaceApp(clave, user.email)}>Añadir Ring España a mi aplicación de códigos</a>. Si no, elige en la aplicación «Introducir una clave de configuración» y escribe esta clave:
            <p className="clave-app" aria-label={`Clave: ${clave.split("").join(" ")}`}>{claveLegible(clave)}</p>
          </li>
          <li>Escribe aquí el código de 6 cifras que te muestra la aplicación. Después te daremos <strong>diez códigos de emergencia</strong> para entrar cuando no tengas el móvil a mano.</li>
        </ol>
        <CodigosEmergencia accion={activarSegundoPaso} boton="Activar y ver mis códigos de emergencia" continuar={destino} />
        {salir}
      </div>
    );
  }

  return (
    <div className="pantalla pantalla-formulario" style={{ gap: 18 }}>
      <div>
        <h1>Segundo paso para entrar</h1>
        <p className="lead">Escribe el código de 6 cifras de tu aplicación de códigos. Si no tienes el móvil a mano, escribe uno de tus códigos de emergencia (cada uno sirve una vez).</p>
      </div>
      <form action={comprobarSegundoPaso} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {next && <input type="hidden" name="next" value={next} />}
        <label className="field"><span>Código</span><input name="codigo" autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} maxLength={12} required aria-describedby="ayuda-codigo" /></label>
        <p id="ayuda-codigo" className="mut" style={{ margin: 0 }}>Seis cifras (por ejemplo, 123456) o un código de emergencia (por ejemplo, ABCD-EFGH). Te quedan {user.recoveryCodes.length} códigos de emergencia.</p>
        <button className="btn-grande">Entrar en la cuenta del creador</button>
      </form>
      <p className="mut" style={{ margin: 0 }}>¿Sin móvil y sin códigos de emergencia? Por seguridad no hay otra forma de entrar con esta cuenta desde aquí. Se puede volver a preparar el segundo paso desde el servidor: los pasos están en la guía «Cuenta del creador» de la documentación del proyecto.</p>
      {salir}
    </div>
  );
}
