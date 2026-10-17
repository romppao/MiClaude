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

      {agrupar(contadores).map(({ grupo, tareas }) => (
        <section key={grupo} aria-labelledby={`hoy-${grupo}`} style={{ margin: "24px 0" }}>
          <h2 id={`hoy-${grupo}`}>{grupo}</h2>
          <div className="resumen-moderacion hoy-tareas">
            {tareas.map((t) => (
              <Link key={t.clave} href={t.href} className={t.n > 0 ? "dato con-pendientes" : "dato al-dia"} aria-label={`${t.texto}: ${t.n > 0 ? t.n : "al día"}`}>
                <span className="clave">{t.texto}</span>
                {t.n > 0 ? <strong>{t.n}</strong> : <span className="al-dia-texto">Al día</span>}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="hoy-herramientas" style={{ margin: "24px 0" }}>
        <h2 id="hoy-herramientas">Herramientas</h2>
        <ul className="lista herramientas-moderacion">
          <li>
            <Link href="/moderacion">Bandeja completa</Link>
            <span className="mut">Todas las colas, con sus decisiones.</span>
          </li>
          <li>
            <Link href="/moderacion/historial">Historial de cambios</Link>
            <span className="mut">Todo lo que se ha cambiado, quién y cuándo.</span>
          </li>
          <li>
            <Link href="/respaldar">Respaldar resultados y títulos</Link>
            <span className="mut">Comprobar un resultado o un título con una prueba.</span>
          </li>
          <li>
            <Link href="/moderacion/acreditaciones">Acreditaciones</Link>
            <span className="mut">Quién puede respaldar resultados (entrenadores, federaciones).</span>
          </li>
          {esCreador(user) && (
            <li>
              <Link href="/moderacion/usuarios">Cuentas y moderadores</Link>
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
