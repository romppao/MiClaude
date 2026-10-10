/** Reserva la superficie de lectura sin ocultar navegación ni controles ya disponibles. */
export default function Loading(){return <div className="pantalla" role="status" aria-label="Cargando contenido"><p className="sr-only">Cargando contenido…</p><div className="loading-line"/><div className="loading-card"/><div className="loading-line"/></div>}
