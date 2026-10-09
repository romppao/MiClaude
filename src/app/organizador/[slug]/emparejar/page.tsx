import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getUser } from "../../../../lib/accounts/auth";
import { loginPath } from "../../../../lib/common/paths";
import { db } from "../../../../lib/common/db";
import { EVENT_KIND_LABEL, fmtDate } from "../../../../lib/common/labels";
import { DISCIPLINE_LABEL, categoryLabel } from "../../../../lib/common/disciplines";
import { claveCategoria } from "../../../../lib/events/registrations";
import { solicitudesDeEvento, type SolicitudConDatos } from "../../../../lib/events/registrations-data";
import { PARECIDO_LABEL, comparaEdad, porcentajeVictorias, sugerirRivales } from "../../../../lib/events/pairing";
import { divisionById, divisionEligible } from "../../../../lib/common/competition";
import { addCartelBout } from "../../../actions/events";

export const metadata: Metadata = { title: "Ayuda para emparejar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const kilos = (n: number) => `${String(n).replace(".", ",")} kg`;

/** El nivel de un peleador en una línea: récord, combates, porcentaje de victorias, aura, edad y peso. */
function Nivel({ p }: { p: SolicitudConDatos }) {
  const pct = porcentajeVictorias(p);
  return (
    <dl className="datos-solicitud">
      <div><dt>Récord:</dt><dd>{p.victorias}-{p.derrotas}-{p.empates}</dd></div>
      <div><dt>Combates:</dt><dd>{p.combates}</dd></div>
      <div><dt>Victorias:</dt><dd>{pct === null ? "sin combates" : `${Math.round(pct * 100)} %`}</dd></div>
      <div><dt>Aura:</dt><dd>{p.aura}</dd></div>
      <div><dt>Edad:</dt><dd>{p.edad ?? "sin indicar"}</dd></div>
      <div><dt>Peso:</dt><dd>{p.weightKg ? kilos(p.weightKg) : "sin indicar"}</dd></div>
    </dl>
  );
}

/**
 * Ayuda para emparejar a los aceptados (decisión del fundador, 9 de octubre de 2026: «no es automático, claro. Siempre con ayuda […] que
 * se vea el nivel o el nivel de popularidad de la aplicación, el número de combates»).
 *
 * Agrupa a los aceptados por categoría; para cada uno que aún no está en el cartel propone los rivales más parecidos de su categoría
 * (`lib/events/pairing.ts`), explica en qué se diferencian, y el organizador añade el combate con un botón si le convence.
 */
export default async function Emparejar({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, user] = await Promise.all([params, getUser()]);
  const ruta = `/organizador/${slug}/emparejar`;
  if (!user) redirect(loginPath(ruta));
  const event = await db.event.findUnique({ where: { slug }, include: { bouts: { select: { fighterAId: true, fighterBId: true } } } });
  if (!event) notFound();
  if (event.organizerId !== user.id && user.role !== "ADMIN") redirect("/organizador?problema=sin_permiso");

  const aceptados = (await solicitudesDeEvento(event)).filter((r) => r.status === "ACCEPTED").sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const enCartel = new Set(event.bouts.flatMap((b) => [b.fighterAId, b.fighterBId]));
  const grupos = new Map<string, SolicitudConDatos[]>();
  for (const r of aceptados) { const k = claveCategoria(r.divisionId, r.weightClass); grupos.set(k, [...(grupos.get(k) ?? []), r]); }
  const libres = aceptados.filter((r) => !enCartel.has(r.fighterId)).length;

  return (
    <div className="pantalla" style={{ gap: 14 }}>
      <p style={{ margin: 0 }}><Link href={`/organizador/${event.slug}`}>← Volver a «{event.name}»</Link></p>
      <div>
        <h1>Ayuda para emparejar</h1>
        <p className="lead" style={{ fontSize: 16, margin: 0 }}>{event.name} · {EVENT_KIND_LABEL[event.kind]} de {DISCIPLINE_LABEL[event.discipline]} · {fmtDate(event.date)}</p>
        <p className="meta" style={{ margin: "6px 0 0" }}>Para cada peleador aceptado te proponemos los rivales más parecidos de su misma categoría, según sus combates, su porcentaje de victorias, su peso y su aura. La edad no se compara cuando el combate tiene categoría de edad: basta con que los dos encajen en ella (en élite, la edad da igual). Es solo una ayuda: tú decides y añades el combate al cartel.</p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link className="btn secondary" href={`/organizador/${event.slug}/inscripciones?estado=aceptadas`}>Ver las solicitudes aceptadas</Link>
        <Link className="btn secondary" href={`/organizador/${event.slug}#anadir-combate`}>Emparejar a mano</Link>
      </div>
      {aceptados.length === 0 ? (
        <p className="mut" style={{ margin: 0 }}>Todavía no has aceptado a ningún peleador. Acepta solicitudes en <Link href={`/organizador/${event.slug}/inscripciones`}>«Solicitudes para participar»</Link> y vuelve aquí para emparejarlos.</p>
      ) : <p className="meta" style={{ margin: 0 }}>{aceptados.length === 1 ? "1 aceptado" : `${aceptados.length} aceptados`} · {libres === 1 ? "1 sin combate en el cartel" : `${libres} sin combate en el cartel`}</p>}

      {[...grupos.entries()].map(([clave, miembros]) => {
        const [div, peso] = clave.split("|");
        const nombreCat = categoryLabel(event.discipline, event.level, div || null, peso || null);
        // Con categoría de edad, cada uno debe encajar en ella el día del evento (si no, el cartel no admitiría el combate).
        const encaja = (m: SolicitudConDatos) => !div || divisionEligible(div, m.nacimiento, event.date);
        const disponibles = miembros.filter((m) => !enCartel.has(m.fighterId) && encaja(m));
        const op = { edad: comparaEdad(div) };
        const elite = divisionById(div)?.ageGroup === "Élite";
        return (
          <section key={clave} aria-label={`Categoría ${nombreCat}`} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: "8px 0 0" }}>{nombreCat} <span className="meta">({miembros.length})</span></h2>
            {div && <p className="meta" style={{ margin: 0 }}>{elite ? "Élite: la edad no cuenta para emparejar." : "La edad no se compara: todos los de esta categoría pueden enfrentarse entre sí si encajan en su edad."}</p>}
            {miembros.map((yo) => {
              const sugerencias = enCartel.has(yo.fighterId) || !encaja(yo) ? [] : sugerirRivales({ ...yo, id: yo.fighterId }, disponibles.map((d) => ({ ...d, id: d.fighterId })), 3, op);
              return (
                <article key={yo.id} className="tarjeta" aria-label={yo.nombre}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <strong><Link href={`/peleadores/${yo.slug}`}>{yo.nombre}</Link></strong>
                    {enCartel.has(yo.fighterId) && <span className="pildora pildora-acc">Ya en el cartel</span>}
                  </div>
                  <div className="meta">{[yo.gimnasio, yo.provincia].filter(Boolean).join(" · ") || "Sin gimnasio ni provincia indicados"}</div>
                  <Nivel p={yo} />
                  {!encaja(yo) && <p className="notice notice-bad" style={{ margin: 0 }}><span aria-hidden="true">⚠ </span>Por su fecha de nacimiento no encaja en la edad de esta categoría el día del evento. Revisa su solicitud o empareja a mano en otra categoría.</p>}
                  {!enCartel.has(yo.fighterId) && encaja(yo) && (sugerencias.length === 0 ? (
                    <p className="mut" style={{ margin: 0 }}>No hay otro aceptado libre en su categoría. Acepta a más peleadores de esta categoría o empareja a mano.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                      <strong style={{ font: "700 16px var(--font)" }}>Rivales más parecidos</strong>
                      {sugerencias.map((s) => (
                        <div key={s.rival.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: 10, border: "1px solid var(--line)", borderRadius: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                            <Link href={`/peleadores/${s.rival.slug}`}>{s.rival.nombre}</Link>
                            <span className={`pildora ${s.parecido === "muy" ? "pildora-acc" : s.parecido === "bastante" ? "pildora-violeta" : ""}`}>{PARECIDO_LABEL[s.parecido]}</span>
                          </div>
                          <Nivel p={s.rival} />
                          {s.avisos.length > 0 && <ul className="meta" style={{ margin: 0, paddingLeft: 20 }}>{s.avisos.map((a) => <li key={a}>{a}</li>)}</ul>}
                          <form action={addCartelBout}>
                            <input type="hidden" name="eventId" value={event.id} />
                            <input type="hidden" name="back" value={ruta} />
                            <input type="hidden" name="fighterA" value={yo.fighterId} />
                            <input type="hidden" name="fighterB" value={s.rival.fighterId} />
                            <input type="hidden" name="divisionId" value={div} />
                            <input type="hidden" name="weightClass" value={peso} />
                            <button aria-label={`Añadir al cartel: ${yo.nombre} contra ${s.rival.nombre}`}>Añadir este combate al cartel</button>
                          </form>
                        </div>
                      ))}
                    </div>
                  ))}
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
