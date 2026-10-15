import Link from "next/link";
import { db } from "../../lib/common/db";
import { calendarDayStart } from "../../lib/common/dates";
import { fmtDate, PROVINCES } from "../../lib/common/labels";

/** Actividad local. Las clases son ofertas para solicitar, sin atribuirles fechas confirmadas que no guarda el modelo. */
export default async function CercaDeTi({ province, semana = false }: { province: string; semana?: boolean }) {
  const inicio = calendarDayStart();
  const [veladas, clases] = await Promise.all([
    db.event.findMany({ where: { province, status: "SCHEDULED", date: { gte: inicio, ...(semana ? { lt: new Date(inicio.getTime() + 7 * 864e5) } : {}) } }, orderBy: [{ date: "asc" }, { id: "asc" }], take: 6 }),
    db.trainingClass.findMany({ where: { active: true, trainer: { province, userId: { not: null } } }, include: { trainer: { select: { name: true } } }, orderBy: [{ title: "asc" }, { id: "asc" }], take: 6 }),
  ]);
  return <section className="tarjeta" aria-label={semana ? "Esta semana" : "Cerca de ti"}>
    <h2>{semana ? `Esta semana en ${province}` : `Cerca de ti · ${province}`}</h2>
    {semana && <form method="get"><label className="field"><span>Provincia</span><select name="provincia" defaultValue={province}>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label><button>Ver esta provincia</button></form>}
    {veladas.map((v) => <Link className="fila" key={v.id} href={`/veladas/${v.slug}`}>{v.name} · {fmtDate(v.date)}</Link>)}
    {!veladas.length && <p>No hay veladas programadas en este periodo.</p>}
    <h3>Clases para solicitar{semana ? " esta semana" : ""}</h3>
    <p className="meta" style={{ fontSize: 16 }}>Acuerda el día y la hora con el entrenador al solicitar la clase.</p>
    {clases.map((c) => <Link className="fila" key={c.id} href={`/clases/${c.id}/solicitar`}>{c.title} · {c.trainer.name}</Link>)}
    <Link className="btn secondary" href={`/clases?provincia=${encodeURIComponent(province)}`}>Ver clases en {province}</Link>
  </section>;
}
