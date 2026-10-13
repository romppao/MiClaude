import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/accounts/permissions";
import { db } from "../../../../lib/common/db";
import { ESTADOS_FALLO, ORIGENES_FALLO, type EstadoFallo } from "../../../../lib/common/fallos";
import { AUDIT_ACTION_LABEL } from "../../../../lib/common/labels";
import { lookup } from "../../../../lib/common/safe";
import { actualizarFallo } from "../../../actions/moderation";

export const metadata = { title: "Detalle de un fallo" };
export const dynamic = "force-dynamic";

const fecha = (d: Date) => d.toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "long", timeStyle: "medium" });
const PAPEL: Record<string, string> = { visitante: "Visitante sin cuenta", usuario: "Aficionado", peleador: "Peleador", entrenador: "Entrenador", entidad: "Promotora, federación o club" };

/** Ficha de un fallo: qué pasó, dónde, cuántas veces, el detalle técnico, su historial y el formulario para cambiar su estado. */
export default async function Fallo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/moderacion/fallos/${encodeURIComponent(id)}`);
  const fallo = await db.appError.findUnique({ where: { id } });
  if (!fallo) notFound();
  const [historial, quien] = await Promise.all([
    db.auditLog.findMany({ where: { entity: "APP_ERROR", entityId: fallo.id }, include: { user: { select: { name: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 100 }),
    fallo.resolvedById ? db.user.findUnique({ where: { id: fallo.resolvedById }, select: { name: true } }) : Promise.resolve(null),
  ]);
  return (
    <>
      <p><Link href="/moderacion/fallos">← Volver a los fallos</Link></p>
      <h1>Detalle de un fallo</h1>
      <p className="lead" style={{ overflowWrap: "anywhere" }}>{fallo.message}</p>
      <dl className="lista lista-datos" style={{ margin: "16px 0" }}>
        <div><dt>Estado</dt><dd>{ESTADOS_FALLO[fallo.status]}</dd></div>
        <div><dt>Dónde ocurrió</dt><dd>{lookup(ORIGENES_FALLO, fallo.origin) ?? fallo.origin}</dd></div>
        {fallo.path && <div><dt>Pantalla o dirección</dt><dd style={{ overflowWrap: "anywhere" }}>{fallo.path}</dd></div>}
        <div><dt>Veces que ha ocurrido</dt><dd>{fallo.count}</dd></div>
        <div><dt>Primera vez</dt><dd>{fecha(fallo.firstSeenAt)}</dd></div>
        <div><dt>Última vez</dt><dd>{fecha(fallo.lastSeenAt)}</dd></div>
        {fallo.role && <div><dt>Quién lo sufrió la última vez</dt><dd>{PAPEL[fallo.role] ?? fallo.role}</dd></div>}
        {fallo.digest && <div><dt>Código del fallo</dt><dd>{fallo.digest} <span className="mut">(es el que ve la persona en la pantalla de error)</span></dd></div>}
        {fallo.resolvedAt && <div><dt>Cerrado</dt><dd>{fecha(fallo.resolvedAt)}{quien && ` por ${quien.name}`}</dd></div>}
      </dl>
      {fallo.stack && (
        <details className="card" style={{ marginBottom: 16 }}>
          <summary>Ver el detalle técnico (para quien programe)</summary>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: "12px 0 0", fontSize: 14 }}>{fallo.stack}</pre>
        </details>
      )}

      <section className="card" aria-labelledby="titulo-estado">
        <h2 id="titulo-estado" style={{ marginTop: 0 }}>Estado y nota</h2>
        <form action={actualizarFallo} style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          <input type="hidden" name="falloId" value={fallo.id} />
          <input type="hidden" name="back" value={`/moderacion/fallos/${fallo.id}`} />
          <label className="field"><span>Estado</span>
            <select name="estado" defaultValue={fallo.status}>
              {(Object.keys(ESTADOS_FALLO) as EstadoFallo[]).map((s) => <option key={s} value={s}>{ESTADOS_FALLO[s]}</option>)}
            </select>
          </label>
          <label className="field"><span>Causa y solución</span>
            <textarea name="nota" rows={5} maxLength={2000} defaultValue={fallo.note ?? ""} />
            <span className="hint">Obligatoria para «Resuelto» y «Descartado»: qué lo provocó, qué se ha hecho y, si hay, el enlace al cambio en GitHub. Si vuelve a ocurrir, se reabrirá solo.</span>
          </label>
          <button>Guardar el estado del fallo</button>
        </form>
      </section>

      <section aria-labelledby="titulo-historial" style={{ marginTop: 24 }}>
        <h2 id="titulo-historial">Historial de este fallo</h2>
        {historial.length === 0 ? <p className="mut">Nadie lo ha revisado todavía.</p> : (
          <ul className="lista" style={{ listStyle: "none", padding: 0 }}>
            {historial.map((h) => {
              const despues = (h.after ?? {}) as { status?: string; nota?: string | null };
              return (
                <li key={h.id} style={{ padding: "12px 16px" }}>
                  <strong>{fecha(h.createdAt)}</strong> · {h.user?.name ?? "Automático"}: {lookup(AUDIT_ACTION_LABEL, h.action) ?? h.action}
                  {despues.status && <> → {lookup(ESTADOS_FALLO, despues.status) ?? despues.status}</>}
                  {despues.nota && <div className="mut" style={{ whiteSpace: "pre-wrap" }}>{despues.nota}</div>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
