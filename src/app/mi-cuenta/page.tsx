import Link from "next/link";
import { requireUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { REPORT_REASONS } from "../../lib/community/reports";
import { lookup } from "../../lib/common/safe";
import { changePassword, updateAccount } from "../actions/accounts";
import { LIMITS } from "../../lib/common/text";

export const metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";

export default async function Account() {
  const user = await requireUser();
  const avisos = await db.report.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });
  const tieneFicha = !!user.fighter || user.role === "FIGHTER";
  const sobre = { BOUT: "un combate", FIGHTER: "una ficha", AURA: "un comentario" } as const;
  const estado = { OPEN: "En revisión", RESOLVED: "Cerrado: ya está corregido", DISMISSED: "Cerrado: no se ha encontrado ningún error" } as const;
  return (
    <>
      <h1>Mi cuenta</h1>
      <p className="mut">Aquí controlas tus datos, tu contraseña y los avisos que recibes.</p>

      <h2>Accesos directos</h2>
      <ul>
        {tieneFicha && <li><Link href="/mi-ficha">Mi ficha de peleador</Link>: tus combates, tu récord y los datos de tu ficha.</li>}
        {!tieneFicha && <li><Link href="/mi-ficha">Crear o reclamar mi ficha de peleador</Link></li>}
        <li><Link href="/siguiendo">Peleadores que sigo</Link>: sus próximos combates.</li>
        {(user.role === "ORGANIZER" || user.role === "ADMIN") ? <li><Link href="/organizador">Mis veladas</Link>: crear veladas y montar carteles.</li> : <li><Link href="/organizador">Organizar veladas</Link>: pedir acceso de organizador.</li>}
        {user.role === "ADMIN" && <li><Link href="/moderacion">Moderación</Link></li>}
      </ul>

      <h2>Mis datos</h2>
      <form className="search" action={updateAccount} style={{ flexDirection: "column", maxWidth: 420 }}>
        <label className="field"><span>Correo electrónico</span><input value={user.email} readOnly aria-readonly="true" /><span className="hint">{user.emailVerifiedAt ? "Verificado. " : ""}Para cambiar de correo electrónico, crea una cuenta nueva con el correo que quieras usar.</span></label>
        <label className="field"><span>Nombre</span><input name="name" defaultValue={user.name} required maxLength={LIMITS.name} autoComplete="name" /><span className="hint">Otras personas verán tu nombre de pila y la inicial del primer apellido junto a tus auras y tus avisos.</span></label>
        <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" name="notifyEmails" defaultChecked={user.notifyEmails} style={{ width: 24, height: 24 }} />
          <span>Quiero recibir avisos por correo electrónico cuando un peleador que sigo tenga un nuevo combate.</span>
        </label>
        <button>Guardar cambios</button>
      </form>

      <h2>Cambiar mi contraseña</h2>
      <form className="search" action={changePassword} style={{ flexDirection: "column", maxWidth: 420 }}>
        <label className="field"><span>Contraseña actual</span><input name="current" type="password" autoComplete="current-password" required maxLength={LIMITS.password} /></label>
        <label className="field"><span>Contraseña nueva</span><input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={LIMITS.password} /><span className="hint">Mínimo 8 caracteres. Al cambiarla, cerraremos las sesiones abiertas en otros dispositivos.</span></label>
        <label className="field"><span>Repite la contraseña nueva</span><input name="repeat" type="password" autoComplete="new-password" required minLength={8} maxLength={LIMITS.password} /></label>
        <button>Cambiar mi contraseña</button>
      </form>

      <h2>Avisos de error que he enviado</h2>
      {avisos.length === 0 ? <p className="mut">Todavía no has enviado ningún aviso. Si ves un dato incorrecto en una ficha o en un combate, pulsa «¿Hay un error? Avísanos» y un moderador lo revisará.</p> : (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Avisos de error que has enviado, del más reciente al más antiguo</caption>
            <thead><tr><th scope="col">Fecha</th><th scope="col">Sobre</th><th scope="col">Motivo</th><th scope="col">Estado y respuesta</th></tr></thead>
            <tbody>
              {avisos.map((r) => (
                <tr key={r.id}>
                  <td>{r.createdAt.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</td>
                  <td>{lookup(sobre, r.entity) ?? "un dato"}</td>
                  <td>{lookup(REPORT_REASONS, r.reason) ?? "Otro motivo"}</td>
                  <td><strong>{lookup(estado, r.status)}</strong>{r.resolutionNote ? <div className="mut">Respuesta del moderador: {r.resolutionNote}</div> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Mis datos personales</h2>
      <p>Puedes descargar una copia de todo lo que Ring España guarda de ti, en un fichero que se abre con cualquier editor de texto.</p>
      <form action="/mi-cuenta/datos"><button className="secondary">Descargar una copia de mis datos</button></form>
      <p className="mut" style={{ marginTop: 12 }}>Consulta cómo tratamos tus datos en la <Link href="/privacidad">política de privacidad</Link>.</p>

      <h2>Eliminar mi cuenta</h2>
      <p>Si ya no quieres estar en Ring España, puedes eliminar tu cuenta y tus datos personales. Antes te explicamos qué se borra y qué se conserva.</p>
      <form action="/mi-cuenta/eliminar"><button className="secondary">Quiero eliminar mi cuenta</button></form>
    </>
  );
}
