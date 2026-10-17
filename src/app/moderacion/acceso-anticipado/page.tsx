import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "../../../lib/accounts/permissions";
import { db } from "../../../lib/common/db";
import { fmtDate } from "../../../lib/common/labels";
import { MAX_CORREOS_POR_ENVIO, accesoAnticipadoActivo } from "../../../lib/accounts/acceso-anticipado";
import { cambiarAccesoAnticipado, invitarAccesoAnticipado, quitarAccesoAnticipado } from "../../actions/acceso-anticipado";

export const metadata: Metadata = { title: "Acceso anticipado · Moderación", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Acceso anticipado (17 de octubre de 2026, petición del fundador): encenderlo o apagarlo y llevar la lista de personas invitadas.
 * Encendido, solo crean cuenta —con su correo o con Google— los correos de la lista. Guía completa: docs/ACCESO-ANTICIPADO.md.
 */
export default async function AccesoAnticipado() {
  await requireAdmin("/moderacion/acceso-anticipado");
  const [activo, invitados] = await Promise.all([
    accesoAnticipadoActivo(),
    db.earlyAccessInvite.findMany({ orderBy: [{ createdAt: "desc" }, { email: "asc" }], take: 500 }),
  ]);
  const conCuenta = new Set((await db.user.findMany({ where: { email: { in: invitados.map((i) => i.email) } }, select: { email: true } })).map((u) => u.email.toLowerCase()));
  return (
    <>
      <p><Link href="/moderacion/hoy">← Hoy: lo que espera</Link></p>
      <h1>Acceso anticipado</h1>
      <p className="lead">Mientras está encendido, solo pueden crear cuenta —con su correo o con su cuenta de Google— las personas de esta lista. Quien ya tiene cuenta entra igual.</p>

      <section className="tarjeta" aria-labelledby="estado-acceso" style={activo ? { borderColor: "var(--acc)" } : undefined}>
        <h2 id="estado-acceso" style={{ margin: 0 }}>{activo ? "Encendido: solo entran las personas invitadas" : "Apagado: cualquiera puede crear una cuenta"}</h2>
        <form action={cambiarAccesoAnticipado}>
          <input type="hidden" name="estado" value={activo ? "no" : "si"} />
          <button className={activo ? "secondary" : undefined}>{activo ? "Apagar el acceso anticipado (abrir a todo el mundo)" : "Encender el acceso anticipado"}</button>
        </form>
      </section>

      <section aria-labelledby="invitar-acceso" style={{ margin: "24px 0" }}>
        <h2 id="invitar-acceso">Invitar a personas</h2>
        <form action={invitarAccesoAnticipado} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label className="field">
            <span>Correos, uno por línea (para quien vaya a entrar con Google, el de su cuenta de Google)</span>
            <textarea name="correos" rows={5} required />
          </label>
          <label className="field">
            <span>Nota para ti (opcional; por ejemplo, «gimnasio de Getafe»)</span>
            <input name="nota" maxLength={200} />
          </label>
          <p className="hint" style={{ margin: 0 }}>Hasta {MAX_CORREOS_POR_ENVIO} correos de una vez. Los repetidos se ignoran. Avísales tú: «Ya puedes entrar en Lona con tu cuenta de Google o con tu correo».</p>
          <button>Añadir a la lista</button>
        </form>
      </section>

      <section aria-labelledby="lista-acceso">
        <h2 id="lista-acceso">Personas invitadas ({invitados.length})</h2>
        {invitados.length === 0 ? <p className="mut">Todavía no has invitado a nadie.</p> : (
          <ul className="lista" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {invitados.map((i) => (
              <li key={i.email} className="tarjeta" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  <strong>{i.email}</strong>
                  <div className="meta">{conCuenta.has(i.email) ? "Ya tiene cuenta" : "Aún no ha creado su cuenta"} · desde el {fmtDate(i.createdAt)}{i.note ? ` · ${i.note}` : ""}</div>
                </div>
                <form action={quitarAccesoAnticipado}>
                  <input type="hidden" name="correo" value={i.email} />
                  <button className="secondary" aria-label={`Quitar de la lista a ${i.email}`}>Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
