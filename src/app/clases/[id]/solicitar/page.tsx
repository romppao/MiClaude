import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "../../../../lib/common/db";
import { getUser } from "../../../../lib/accounts/auth";
import { DISCIPLINE_LABEL } from "../../../../lib/common/disciplines";
import { CLASS_KIND_LABEL, classMeta } from "../../../../lib/trainers/classes";
import { REQUEST_MESSAGE_MAX, REQUEST_PHONE_MAX } from "../../../../lib/trainers/requests";
import { todayMadrid } from "../../../../lib/common/dates";
import ElegirHorario from "../../../components/ElegirHorario";
import { requestClass } from "../../../actions/trainers";

export const metadata: Metadata = { title: "Solicitar una clase", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Solicitar una clase publicada (petición del fundador, 8 de octubre de 2026). Una sola pantalla: la clase, cuándo te viene bien y el botón.
 * El entrenador la recibe por correo y en «Mis clases»; la respuesta llega a «Mis reservas» y por correo.
 */
export default async function SolicitarClase({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  // Lo que la persona había escrito, si vuelve aquí por un problema (no se pierde: principio 9).
  const sp = await searchParams;
  const previo = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v ?? "").slice(0, 500); };
  if (id.length > 40) notFound();
  const c = await db.trainingClass.findFirst({ where: { id, active: true, trainer: { userId: { not: null } } }, include: { trainer: { include: { gym: true } } } });
  if (!c) notFound();
  const user = await getUser();
  const aqui = `/clases/${c.id}/solicitar`;
  const pendiente = user ? await db.classRequest.findFirst({ where: { classId: c.id, userId: user.id, status: "PENDING" }, select: { id: true } }) : null;
  return (
    <div className="pantalla" style={{ gap: 18, maxWidth: 640 }}>
      <div><h1>Solicitar esta clase</h1><p className="lead" style={{ fontSize: 16 }}>Dile a {c.trainer.name} cuándo te viene bien. Te responderá aquí y por correo electrónico.</p></div>
      <section className="tarjeta" aria-label={`Clase: ${c.title}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className={`pildora ${c.kind === "INDIVIDUAL" ? "pildora-acc" : "pildora-violeta"}`}>{CLASS_KIND_LABEL[c.kind]}</span><span style={{ font: "800 26px var(--font)", letterSpacing: "-.03em" }}>{c.priceEuros} €</span></div>
        <div><h2 style={{ margin: 0, font: "700 20px/1.2 var(--font)" }}>{c.title}</h2><div className="meta">{classMeta(c)}{c.discipline ? ` · ${DISCIPLINE_LABEL[c.discipline]}` : ""}{c.capacity ? ` · ${c.capacity} plazas` : ""}</div></div>
        <div className="meta">Con <Link href={`/entrenadores/${c.trainer.slug}`}>{c.trainer.name}</Link>{c.trainer.gym ? ` · ${c.trainer.gym.name}` : c.trainer.city ? ` · ${c.trainer.city}` : ""}</div>
      </section>
      {!user ? (
        <div className="tarjeta"><p style={{ margin: 0 }}>Para solicitar la clase necesitas una cuenta. Así el entrenador sabe quién eres y puede responderte.</p><Link className="btn btn-grande" href={`/entrar?next=${encodeURIComponent(aqui)}`}>Entrar para solicitar la clase</Link><Link className="btn secondary" href={`/registro?next=${encodeURIComponent(aqui)}`}>Crear una cuenta</Link></div>
      ) : !user.emailVerifiedAt ? (
        <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>Para solicitar clases, primero <Link href="/verificar">confirma tu correo electrónico</Link>.</div>
      ) : c.trainer.userId === user.id ? (
        <p className="mut">Esta clase es tuya. Las solicitudes que recibas aparecen en <Link href="/mis-clases#solicitudes">Mis clases</Link>.</p>
      ) : pendiente ? (
        <div className="notice"><span aria-hidden="true">ℹ </span>Ya has solicitado esta clase y estás esperando la respuesta. Puedes verla en <Link href="/mis-reservas">Mis reservas</Link>.</div>
      ) : (
        <form action={requestClass} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="hidden" name="classId" value={c.id} />
          {/* Día en un calendario y franja con una barra (petición del fundador, 8 de octubre de 2026: «le obliga a escribir mucho»). */}
          <ElegirHorario hoy={todayMadrid()} individual={c.kind === "INDIVIDUAL"} minutos={c.minutes} inicial={{ day: previo("day"), from: Number(previo("fromMinute")) || undefined, to: Number(previo("toMinute")) || undefined }} />
          {c.kind === "GROUP" && <p className="hint" style={{ margin: 0 }}>Horario de la clase: {c.schedule}. Elige el día en que quieres empezar.</p>}
          <label className="field"><span>¿Algo importante que deba saber el entrenador? (opcional)</span><textarea name="message" defaultValue={previo("message")} maxLength={REQUEST_MESSAGE_MAX} rows={2} placeholder="Tu nivel, una lesión, si es tu primera clase…" /></label>
          <label className="field"><span>Teléfono (opcional)</span><input name="phone" defaultValue={previo("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={REQUEST_PHONE_MAX} /><span className="hint">Solo si prefieres que te llame o te escriba por teléfono.</span></label>
          <p className="mut" style={{ margin: 0 }}>{c.trainer.name} verá tu nombre, tu correo electrónico y lo que escribas aquí, y te responderá aquí y por correo. Si acepta, podréis escribiros por correo. La clase se paga directamente al entrenador: Ring España no cobra nada.</p>
          <button className="btn-grande">Solicitar la clase</button>
        </form>
      )}
    </div>
  );
}
