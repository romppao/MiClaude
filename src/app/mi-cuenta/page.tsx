import Link from "next/link";
import Pestanas from "../components/Pestanas";
import { papelDe, puedeOrganizar } from "../../lib/accounts/landing";
import { requireUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { REPORT_REASONS } from "../../lib/community/reports";
import { lookup } from "../../lib/common/safe";
import { changePassword, updateAccount } from "../actions/accounts";
import { LIMITS } from "../../lib/common/text";
import { DEMO_PAPELES, demoActiva } from "../../lib/common/demo";
import { demoCambiarPapel } from "../actions/demo";

export const metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";

export default async function Account() {
  const user = await requireUser("/mi-cuenta");
  const avisos = await db.report.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });
  const accreditation = await db.supportAccreditation.findUnique({where:{userId:user.id}});
  const papel = papelDe(user);
  const sobre = { BOUT: "un combate", FIGHTER: "una ficha", AURA: "un comentario", MEDIA: "un vídeo o una foto" } as const;
  const estado = { OPEN: "En revisión", RESOLVED: "Cerrado: ya está corregido", DISMISSED: "Cerrado: no se ha encontrado ningún error" } as const;
  const managedProfiles = await db.profile.findMany({ where: { ownerId: user.id, kind: { in: ["gimnasio", "entrenador", "federacion"] } }, select: { id: true, kind: true, entityId: true, name: true } });
  return (
    <>

      <h1>Mi cuenta</h1>
      <p className="mut">Aquí controlas tus datos, tu contraseña y los avisos que recibes.</p>

      {demoActiva() && (
        <section aria-labelledby="demo-papel" className="notice" style={{ marginTop: 16 }}>
          <h2 id="demo-papel" style={{ marginTop: 0 }}>Versión de demostración: probar como otra persona</h2>
          <p>Ahora usas la aplicación como <strong>{DEMO_PAPELES[user.role]}</strong>. Elige un papel para ver qué puede hacer cada tipo de persona; puedes cambiar las veces que quieras.</p>
          <form action={demoCambiarPapel} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Object.entries(DEMO_PAPELES) as [keyof typeof DEMO_PAPELES, string][]).map(([clave, nombre]) => (
              <button key={clave} name="papel" value={clave} className={clave === user.role ? undefined : "secondary"} aria-pressed={clave === user.role}>{clave === user.role ? `✓ ${nombre}` : `Probar como ${nombre.toLowerCase()}`}</button>
            ))}
          </form>
          <p className="mut">Aficionado: ve y sigue peleadores y da aura. Peleador: crea su ficha y registra combates. Entrenador: publica sus clases y organiza veladas e interclubs. Organizador: publica veladas. Moderador: revisa avisos y aprueba solicitudes.</p>
        </section>
      )}

      {/* Agrupada en pestañas que se deslizan (revisión del 8 de octubre de 2026: la página era muy larga en el móvil). */}
      <Pestanas etiqueta="Secciones de mi cuenta" pestanas={[
        { id: "pestana-datos", titulo: "Mis datos", contenido: <>
          <h2>Mis datos</h2>
          <form className="search" action={updateAccount} style={{ flexDirection: "column", alignItems: "stretch", maxWidth: 420 }}>
            <label className="field"><span>Correo electrónico</span><input value={user.email} readOnly aria-readonly="true" /><span className="hint">{user.emailVerifiedAt ? "Verificado. " : ""}Para cambiar de correo electrónico, crea una cuenta nueva con el correo que quieras usar.</span></label>
            <label className="field"><span>Nombre</span><input name="name" defaultValue={user.name} required maxLength={LIMITS.name} autoComplete="name" /><span className="hint">Otras personas verán tu nombre de pila y la inicial del primer apellido junto a tus auras y tus avisos.</span></label>
            <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" name="notifyEmails" defaultChecked={user.notifyEmails} style={{ width: 24, height: 24 }} />
              <span>Quiero recibir avisos por correo electrónico cuando un peleador que sigo tenga un nuevo combate.</span>
            </label>
            <button>Guardar cambios</button>
          </form>
        </> },
        { id: "pestana-clave", titulo: "Contraseña", contenido: <>
          <h2>Cambiar mi contraseña</h2>
          <form className="search" action={changePassword} style={{ flexDirection: "column", alignItems: "stretch", maxWidth: 420 }}>
            <label className="field"><span>Contraseña actual</span><input name="current" type="password" autoComplete="current-password" required maxLength={LIMITS.password} /></label>
            <label className="field"><span>Contraseña nueva</span><input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={LIMITS.password} /><span className="hint">Mínimo 8 caracteres. Al cambiarla, cerraremos las sesiones abiertas en otros dispositivos.</span></label>
            <label className="field"><span>Repite la contraseña nueva</span><input name="repeat" type="password" autoComplete="new-password" required minLength={8} maxLength={LIMITS.password} /></label>
            <button>Cambiar mi contraseña</button>
          </form>
        </> },
        { id: "pestana-accesos", titulo: "Accesos", contenido: <>
          {user.role === "ORGANIZER" && <p><Link className="btn" href={`/promotores/${user.id}`}>Mi perfil de promotor</Link></p>}
          {managedProfiles.length > 0 && <section id="perfiles"><h2>Perfiles que gestionas</h2>{managedProfiles.map(p => <p key={p.id}><Link href={`/perfiles/${p.kind}/${p.entityId}/editar`}>Personalizar {p.name ?? p.kind}</Link></p>)}</section>}
          <h2>Accesos directos</h2>
          <ul>
            <li><Link href="/mi-panel">Mi panel</Link>: lo tuyo de un vistazo.</li>
            {papel === "peleador" && <li><Link href="/mi-ficha">Mi ficha de peleador</Link>: tus combates, tu récord y los datos de tu ficha.</li>}
            {papel === "entrenador" && <li><Link href="/mis-clases">Mis clases</Link>: tu perfil de entrenador y tus clases.</li>}
            {puedeOrganizar(user.role) && <li><Link href="/organizador">{papel === "entrenador" ? "Mis veladas e interclubs" : "Mis veladas"}</Link>: crear eventos y montar carteles.</li>}
            {papel === "usuario" && <li><Link href="/compartir">Subir vídeos o fotos de una velada</Link>: para que los peleadores tengan las imágenes de sus combates.</li>}
            <li><Link href="/siguiendo">Peleadores que sigo</Link>: sus próximos combates.</li>
            {user.role === "ADMIN" && <li><Link href="/moderacion">Moderación</Link></li>}
          </ul>
          {papel === "usuario" && user.role !== "ADMIN" && (
            <section aria-labelledby="otro-tipo">
              <h2 id="otro-tipo">¿Compites u organizas eventos?</h2>
              <ul>
                <li><Link href="/mi-ficha">Crear o reclamar mi ficha de peleador</Link></li>
                <li><Link href="/organizador">Pedir acceso para organizar veladas</Link> (promotoras, clubes y federaciones).</li>
              </ul>
            </section>
          )}

          {user.fighter&&<p><Link href="/mi-ficha/trayectoria">Mis títulos y mi aura</Link></p>}
          {(user.role==="ADMIN"||accreditation?.active)&&<p><Link href="/respaldar">Respaldar resultados y títulos</Link></p>}
        </> },
        { id: "pestana-avisos", titulo: "Mis avisos", contenido: <>
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
        </> },
        { id: "pestana-privacidad", titulo: "Privacidad", contenido: <>
          <h2>Mis datos personales</h2>
          <p>Puedes descargar una copia de todo lo que Ring España guarda de ti, en un fichero que se abre con cualquier editor de texto.</p>
          <form action="/mi-cuenta/datos"><button className="secondary">Descargar una copia de mis datos</button></form>
          <p className="mut" style={{ marginTop: 12 }}>Consulta cómo tratamos tus datos en la <Link href="/privacidad">política de privacidad</Link>.</p>

          <h2>Eliminar mi cuenta</h2>
          <p>Si ya no quieres estar en Ring España, puedes eliminar tu cuenta y tus datos personales. Antes te explicamos qué se borra y qué se conserva.</p>
          <form action="/mi-cuenta/eliminar"><button className="secondary">Quiero eliminar mi cuenta</button></form>
        </> },
      ]} />
    </>
  );
}
