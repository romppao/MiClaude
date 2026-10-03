import Link from "next/link";
import { requireAdmin } from "../../../lib/accounts/permissions";
import { db } from "../../../lib/common/db";
import Paginacion from "../../components/Paginacion";
import { pageNumber, pageWindow } from "../../../lib/common/pagination";
import { oneParam } from "../../../lib/common/safe";
import { SUPPORT_LABEL } from "../../../lib/aura/trajectory";
import {
  DISCIPLINE_ORDER,
  DISCIPLINE_LABEL,
} from "../../../lib/common/disciplines";
import { setSupportAccreditation } from "../../actions/trajectory";
export const metadata = { title: "Acreditaciones para respaldar" };
export const dynamic = "force-dynamic";
export default async function Accreditations({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("/moderacion/acreditaciones");
  const raw = await searchParams;
  const q = oneParam(raw.q)?.trim().slice(0, 160) ?? "";
  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { user: { email: { contains: q, mode: "insensitive" as const } } }] } : {};
  const total = await db.supportAccreditation.count({ where });
  const page = pageWindow(total, pageNumber(raw.pagina), 50);
  const params = { q: q || undefined, pagina: page.current > 1 ? String(page.current) : undefined };
  const query = new URLSearchParams(Object.entries(params).filter((v): v is [string,string] => !!v[1])).toString();
  const back = `/moderacion/acreditaciones${query ? `?${query}` : ""}#acreditaciones`;
  const values = await db.supportAccreditation.findMany({
    where,
    include: { user: { select: { email: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: page.take, skip: page.skip,
  });
  return (
    <>
      <h1>Acreditaciones para respaldar</h1>
      <p>
        <Link href="/moderacion">Volver a moderación</Link> ·{" "}
        <Link href="/respaldar">Respaldar títulos y resultados</Link>
      </p>
      <p>
        Comprueba la identidad y las disciplinas de quien representa al
        entrenador, organizador o federación. Tener un perfil visual no concede
        estos permisos. Retirar una acreditación elimina sus bonificaciones; la
        trayectoria declarada se conserva.
      </p>
      <h2>Conceder acreditación</h2>
      <form action={setSupportAccreditation} className="search">
        <label className="field">
          <span>Correo electrónico de una cuenta ya confirmada</span>
          <input name="email" type="email" required maxLength={254} />
        </label>
        <label className="field">
          <span>Tipo de entidad</span>
          <select name="supportKind">
            {["TRAINER", "ORGANIZER", "FEDERATION"].map((k) => (
              <option value={k} key={k}>
                {SUPPORT_LABEL[k as "TRAINER"]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Nombre acreditado</span>
          <input name="authority" required maxLength={160} />
        </label>
        <fieldset>
          <legend>Disciplinas comprobadas</legend>
          {DISCIPLINE_ORDER.map((d) => (
            <label key={d}>
              <input type="checkbox" name="disciplines" value={d} />
              {DISCIPLINE_LABEL[d]}
            </label>
          ))}
        </fieldset>
        <label className="field">
          <span>Fuente que acredita la identidad y representación</span>
          <input type="url" name="evidenceUrl" required maxLength={1000} />
        </label>
        <label className="field">
          <span>Comprobación realizada</span>
          <input name="note" required maxLength={500} />
        </label>
        <button>Conceder acreditación</button>
      </form>
      <h2 id="acreditaciones">Acreditaciones existentes ({total})</h2>
      <form className="search" role="search" aria-label="Buscar acreditaciones">
        <label className="field"><span>Nombre acreditado o correo electrónico</span><input name="q" defaultValue={q} maxLength={160} /></label>
        <button>Buscar acreditaciones</button>
        {q && <Link href="/moderacion/acreditaciones#acreditaciones">Quitar búsqueda</Link>}
      </form>
      <Paginacion ruta="/moderacion/acreditaciones" params={params} ancla="acreditaciones" actual={page.current} paginas={page.pages} desde={page.from} hasta={page.to} total={page.total} unidad={["acreditación", "acreditaciones"]} />
      {!values.length && <p>No hay acreditaciones con esta búsqueda.</p>}
      {values.map((a) => (
        <div className="card" key={a.id}>
          <strong>{a.name}</strong> · {SUPPORT_LABEL[a.kind]} ·{" "}
          {a.active && a.userId ? "Activa" : "Retirada"}
          <p>
            {a.user?.email ?? "Cuenta eliminada"} ·{" "}
            {a.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(", ")}
          </p>
          {a.user && (
            <form action={setSupportAccreditation}>
              <input type="hidden" name="email" value={a.user.email} />
              <input type="hidden" name="back" value={back} />
              <input
                type="hidden"
                name="version"
                value={a.updatedAt.toISOString()}
              />
              {a.active ? (
                <button name="decision" value="revoke" className="secondary">
                  Retirar acreditación
                </button>
              ) : (
                <>
                  <input type="hidden" name="supportKind" value={a.kind} />
                  <input type="hidden" name="authority" value={a.name} />
                  {a.disciplines.map((d) => (
                    <input key={d} type="hidden" name="disciplines" value={d} />
                  ))}
                  <label className="field">
                    <span>Fuente para reactivar la acreditación</span>
                    <input
                      type="url"
                      name="evidenceUrl"
                      required
                      maxLength={1000}
                    />
                  </label>
                  <label className="field">
                    <span>Comprobación para reactivarla</span>
                    <input name="note" required maxLength={500} />
                  </label>
                  <button>Reactivar acreditación comprobada</button>
                </>
              )}
            </form>
          )}
        </div>
      ))}
    </>
  );
}
