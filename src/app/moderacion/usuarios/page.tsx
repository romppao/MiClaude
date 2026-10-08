import Link from "next/link";
import type { Metadata } from "next";
import type { Role } from "@prisma/client";
import { db } from "../../../lib/common/db";
import { requireCreador } from "../../../lib/accounts/permissions";
import { fmtDate } from "../../../lib/common/labels";
import { oneParam } from "../../../lib/common/safe";
import { cambiarTipoDeCuenta, cerrarSesionesDe, regenerarCodigos } from "../../actions/creador";
import CodigosEmergencia from "../../components/CodigosEmergencia";

export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const TIPO: Record<Role, string> = { FAN: "Aficionado", FIGHTER: "Peleador", TRAINER: "Entrenador", ORGANIZER: "Club, promotora o federación", ADMIN: "Moderador" };
const ORDEN: Role[] = ["FAN", "FIGHTER", "TRAINER", "ORGANIZER", "ADMIN"];

/**
 * Administración (solo la cuenta del creador, lib/accounts/creador.ts): buscar cualquier cuenta, cambiar su tipo (también nombrar o quitar
 * moderadores) y cerrar sus sesiones; y su propio acceso: códigos de emergencia y últimas entradas. Todo cambio queda en el historial.
 * Lo demás (combates, veladas, fichas, perfiles, noticias, avisos) ya lo puede gestionar desde «Moderación», porque el creador es moderador.
 */
export default async function Administracion({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const yo = await requireCreador();
  const q = (oneParam((await searchParams).q) ?? "").trim().slice(0, 80);
  const [cuentas, porTipo, entradas] = await Promise.all([
    db.user.findMany({
      where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : undefined,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 30,
      select: { id: true, name: true, email: true, role: true, emailVerifiedAt: true, createdAt: true, _count: { select: { sessions: true } } },
    }),
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    db.auditLog.findMany({ where: { entity: "USER", entityId: yo.id, action: "CREADOR_ENTRA" }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const total = porTipo.reduce((n, g) => n + g._count._all, 0);
  return (
    <>
      <p><Link href="/moderacion">← Volver a moderación</Link></p>
      <h1>Administración</h1>
      <p className="mut">Solo la ve la cuenta del creador. Desde aquí gestionas las cuentas y quién modera. Los combates, veladas, fichas, perfiles, noticias y avisos se gestionan desde <Link href="/moderacion">Moderación</Link>. Cada cambio queda en el <Link href="/moderacion/historial">historial</Link>.</p>

      <h2>Cuentas ({total})</h2>
      <p className="mut">{ORDEN.map((r) => `${TIPO[r]}: ${porTipo.find((g) => g.role === r)?._count._all ?? 0}`).join(" · ")}</p>
      <form action="/moderacion/usuarios" role="search" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label className="field" style={{ flex: "1 1 240px" }}><span>Buscar por nombre o correo electrónico</span><input name="q" defaultValue={q} maxLength={80} /></label>
        <button>Buscar cuentas</button>
      </form>
      <p className="mut" role="status">{q ? `${cuentas.length === 30 ? "Las 30 primeras cuentas" : `${cuentas.length} ${cuentas.length === 1 ? "cuenta" : "cuentas"}`} con «${q}».` : "Las 30 cuentas más recientes."}</p>
      {cuentas.length === 0 ? <p className="mut">No hay ninguna cuenta con ese nombre o correo. <Link href="/moderacion/usuarios">Ver las más recientes</Link></p> : (
        <ul className="lista" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {cuentas.map((c) => (
            <li key={c.id} className="tarjeta" style={{ gap: 10 }}>
              <div>
                <strong>{c.name}</strong>{c.id === yo.id && " (tú)"}
                <div className="meta">{c.email} · {c.emailVerifiedAt ? "correo confirmado" : "correo sin confirmar"} · desde el {fmtDate(c.createdAt)} · {c._count.sessions} {c._count.sessions === 1 ? "sesión abierta" : "sesiones abiertas"}</div>
              </div>
              {c.id === yo.id ? <p className="mut" style={{ margin: 0 }}>Cuenta del creador: siempre es moderador.</p> : (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <form action={cambiarTipoDeCuenta} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <input type="hidden" name="userId" value={c.id} /><input type="hidden" name="q" value={q} />
                    <label className="field"><span>Tipo de cuenta</span>
                      <select name="role" defaultValue={c.role}>{ORDEN.map((r) => <option key={r} value={r}>{TIPO[r]}</option>)}</select>
                    </label>
                    <button aria-label={`Cambiar el tipo de cuenta de ${c.name}`}>Cambiar el tipo</button>
                  </form>
                  {c._count.sessions > 0 && (
                    <form action={cerrarSesionesDe}>
                      <input type="hidden" name="userId" value={c.id} /><input type="hidden" name="q" value={q} />
                      <button className="secondary" aria-label={`Cerrar todas las sesiones de ${c.name}`}>Cerrar sus sesiones</button>
                    </form>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 id="mi-acceso">Tu acceso de creador</h2>
      <p>Te quedan <strong>{yo.recoveryCodes.length}</strong> de 10 códigos de emergencia. Si te quedan pocos o crees que alguien los ha visto, crea otros nuevos: los anteriores dejarán de servir.</p>
      <CodigosEmergencia accion={regenerarCodigos} boton="Crear códigos de emergencia nuevos" continuar="/moderacion/usuarios" />
      <h3 style={{ marginTop: 20 }}>Tus últimas entradas</h3>
      {entradas.length === 0 ? <p className="mut">Todavía no hay entradas registradas.</p> : (
        <ul>{entradas.map((e) => {
          const d = e.after as { metodo?: string; ip?: string | null } | null;
          return <li key={e.id}>{e.createdAt.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })} · {d?.metodo === "emergencia" ? "con un código de emergencia" : "con la aplicación de códigos"}{d?.ip ? ` · desde ${d.ip}` : ""}</li>;
        })}</ul>
      )}
      <p className="mut">Si ves una entrada que no reconoces, cambia tu contraseña en <Link href="/mi-cuenta">Mi cuenta</Link> y crea códigos de emergencia nuevos.</p>
    </>
  );
}
