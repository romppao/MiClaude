import Link from "next/link";
import { requireAdmin } from "../../../lib/accounts/permissions";
import { esCreador } from "../../../lib/accounts/creador";
import { agrupar, siguienteTarea, totalPendiente } from "../../../lib/community/moderacion-tareas";
import { contadoresDeModeracion } from "../../../lib/community/moderacion-contadores";
import { VERSION, commitDesplegado } from "../../../lib/common/version";

export const metadata = { title: "Hoy · Moderación" };
export const dynamic = "force-dynamic";

const HOY = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });

/**
 * «Hoy» (17 de octubre de 2026, petición del fundador: «cuando entro como moderador, las pantallas son muy confusas»): lo primero que ve
 * moderación. Cuánto trabajo hay de cada tipo, agrupado, y un botón grande con la siguiente tarea. No lista casos: cada número lleva a su cola
 * (la bandeja, `/moderacion`, o su pantalla propia). Guía: docs/MODERACION.md.
 */
export default async function Hoy() {
  const user = await requireAdmin("/moderacion/hoy");
  const contadores = await contadoresDeModeracion();
  const siguiente = siguienteTarea(contadores);
  const total = totalPendiente(contadores);
  return (
    <>
      <h1>Hoy</h1>
      <p className="lead">
        {HOY.format(new Date()).replace(/^./, (c) => c.toUpperCase())}. {total === 0 ? "No hay nada pendiente." : total === 1 ? "Queda 1 cosa por revisar." : `Quedan ${total} cosas por revisar.`}
      </p>

      {siguiente ? (
        <Link href={siguiente.href} className="siguiente-tarea">
          <span>
            <small>Siguiente tarea</small>
            <strong>{siguiente.texto}</strong>
            <span className="ayuda">{siguiente.ayuda}</span>
          </span>
          <span className="cifra" aria-label={`${siguiente.n} pendientes`}>{siguiente.n}</span>
        </Link>
      ) : (
        <p className="notice notice-ok" role="status">Todo al día. Cuando llegue algo nuevo, aparecerá aquí.</p>
      )}

      {/* Solo ocupan sitio las tareas con trabajo; lo que está al día se resume en una línea por grupo (menos scroll). */}
      {agrupar(contadores).map(({ grupo, tareas }) => {
        const conTrabajo = tareas.filter((t) => t.n > 0);
        const alDia = tareas.filter((t) => t.n === 0);
        return (
          <section key={grupo} aria-labelledby={`hoy-${grupo}`} style={{ margin: "24px 0" }}>
            <h2 id={`hoy-${grupo}`}>{grupo}</h2>
            {conTrabajo.length > 0 && (
              <div className="resumen-moderacion hoy-tareas">
                {conTrabajo.map((t) => (
                  <Link key={t.clave} href={t.href} className="dato con-pendientes" aria-label={`${t.texto}: ${t.n}`}>
                    <span className="clave">{t.texto}</span>
                    <strong>{t.n}</strong>
                  </Link>
                ))}
              </div>
            )}
            {alDia.length > 0 && <p className="al-dia-lista"><strong>Al día:</strong> {alDia.map((t) => t.texto).join(", ")}.</p>}
          </section>
        );
      })}

      <section aria-labelledby="hoy-herramientas" style={{ margin: "24px 0" }}>
        <h2 id="hoy-herramientas">Herramientas</h2>
        <ul className="lista herramientas-moderacion">
          <li>
            <Link href="/moderacion">Bandeja completa</Link>
            <span className="mut">Todas las colas, con sus decisiones.</span>
          </li>
          <li>
            <Link href="/moderacion/veladas">Autorizar veladas pasadas</Link>
            <span className="mut">Revisar y decidir sobre eventos con fecha anterior a hoy.</span>
          </li>
          <li>
            <Link href="/moderacion/fallos">Fallos de la aplicación</Link>
            <span className="mut">Lo que ha fallado, cuántas veces y qué se hizo.</span>
          </li>
          <li>
            <Link href="/moderacion/noticias">Fuentes de noticias</Link>
            <span className="mut">Qué fuentes funcionan, añadir y ocultar titulares.</span>
          </li>
          <li>
            <Link href="/moderacion/historial">Ver el historial de cambios</Link>
            <span className="mut">Todo lo que se ha cambiado, quién y cuándo.</span>
          </li>
          <li>
            <Link href="/respaldar">Respaldar resultados y títulos</Link>
            <span className="mut">Comprobar un resultado o un título con una prueba.</span>
          </li>
          <li>
            <Link href="/moderacion/acceso-anticipado">Acceso anticipado</Link>
            <span className="mut">Quién puede crear cuenta mientras Lona no está abierta a todo el mundo.</span>
          </li>
          <li>
            <Link href="/moderacion/acreditaciones">Gestionar acreditaciones</Link>
            <span className="mut">Quién puede respaldar resultados (entrenadores, federaciones).</span>
          </li>
          {esCreador(user) && (
            <li>
              <Link href="/moderacion/usuarios">Administración: cuentas y moderadores</Link>
              <span className="mut">Solo la cuenta del creador.</span>
            </li>
          )}
        </ul>
        <p className="mut">
          Versión de la aplicación: <strong>{VERSION}</strong>
          {commitDesplegado() ? ` (commit ${commitDesplegado()})` : ""}.
        </p>
      </section>
    </>
  );
}
