import Link from "next/link";
import type { User } from "@prisma/client";
import { db } from "../../lib/common/db";
import { calendarDayStart } from "../../lib/common/dates";
import { EVENT_KIND_LABEL, fmtDate } from "../../lib/common/labels";
import { readOnboarding } from "../../lib/accounts/onboarding";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../lib/common/disciplines";
import { PROVINCES } from "../../lib/common/labels";
import { LIMITS } from "../../lib/common/text";
import { CLASS_KIND_LABEL, TRAINER_YEARS_MAX, classMeta, parseClass } from "../../lib/trainers/classes";
import { createMyTrainer } from "../actions/trainers";
import Icono from "../components/Icono";
import { AccionesPrincipales, Saludo } from "./comun";

/**
 * Inicio del entrenador (diseño v3, «homeCoach»). Sin perfil todavía: el formulario para publicarlo, con lo que eligió al registrarse.
 * Con perfil: sus clases publicadas y el botón para crear otra. Las reservas y los ingresos llegarán con la gestión de reservas.
 */
export default async function InicioEntrenador({ user }: { user: User }) {
  const [trainer, eventos, proximo] = await Promise.all([
    db.trainer.findUnique({ where: { userId: user.id }, include: { gym: true, classes: { orderBy: [{ active: "desc" }, { createdAt: "asc" }] } } }),
    db.event.count({ where: { organizerId: user.id } }),
    db.event.findFirst({ where: { organizerId: user.id, date: { gte: calendarDayStart() }, status: "SCHEDULED" }, orderBy: [{ date: "asc" }, { id: "asc" }] }),
  ]);
  const inscripciones = eventos ? await db.eventRegistration.count({ where: { status: "PENDING", event: { organizerId: user.id } } }) : 0;
  // El entrenador también organiza veladas e interclubs (decisión del fundador, 8 de octubre de 2026).
  const veladas = (
    <section aria-labelledby="titulo-veladas-entrenador" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="titulo-seccion"><h2 id="titulo-veladas-entrenador">Tus veladas e interclubs</h2>{eventos > 0 && <Link href="/organizador">Gestionar</Link>}</div>
      {proximo ? (
        <Link href={`/organizador/${proximo.slug}`} className="fila"><span className="cuerpo"><span className="nombre">{proximo.name}</span><span className="meta">{EVENT_KIND_LABEL[proximo.kind]} · {fmtDate(proximo.date)} · {proximo.city}</span></span><Icono nombre="siguiente" tam={18} /></Link>
      ) : <p className="mut" style={{ margin: 0 }}>{eventos ? "No tienes eventos programados." : "Organiza una velada o un interclub con tu club: crea el evento, monta el cartel y publica los resultados."}</p>}
      <Link href="/organizador#crear" className="btn secondary">Crear una velada o un interclub</Link>
    </section>
  );
  if (!trainer) {
    const borrador = readOnboarding(user.onboarding);
    const b = borrador?.kind === "entrenador" ? borrador : null;
    const clase = b?.clase ? parseClass(b.clase) : null;
    return (
      <div className="pantalla">
        <Saludo kicker="Mi panel" nombre={user.name} sub="Entrenador" />
        {user.emailVerifiedAt && <AccionesPrincipales acciones={[
          { href: "/organizador?tipo=velada#crear", titulo: "Crear una velada", detalle: "Cartel abierto al público", icono: "trofeo" },
          { href: "/organizador?tipo=interclub#crear", titulo: "Crear un interclub", detalle: "Encuentro entre clubes", icono: "personas" },
        ]} />}
        {!user.emailVerifiedAt ? (
          <div className="tarjeta tarjeta-acc anillo" style={{ padding: 22 }}>
            <h2 style={{ font: "800 24px/1.1 var(--font)" }}>Publica tu perfil de entrenador</h2>
            <p style={{ margin: 0, fontWeight: 500 }}>Primero confirma tu correo electrónico con el enlace que te enviamos. Después podrás publicar tu perfil{clase?.ok ? " y tu primera clase" : ""}.</p>
            <Link href="/verificar" className="btn btn-negro" style={{ alignSelf: "flex-start" }}>Confirmar mi correo</Link>
          </div>
        ) : (
          <section className="tarjeta" aria-labelledby="titulo-publicar-perfil" style={{ gap: 18 }}>
            <div><h2 id="titulo-publicar-perfil" style={{ font: "800 24px/1.1 var(--font)" }}>Publica tu perfil de entrenador</h2><p className="mut" style={{ margin: "6px 0 0" }}>Así te encontrarán peleadores y aficionados que buscan clases. Revisa los datos y publícalo.</p></div>
            <form action={createMyTrainer} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="leyenda">Disciplinas que enseñas</legend>
                <div className="chips">{DISCIPLINE_ORDER.map((d) => <label key={d} className="chip"><input type="checkbox" name="disciplina" value={d} defaultChecked={b?.disciplines.includes(d)} />{DISCIPLINE_LABEL[d]}</label>)}</div>
              </fieldset>
              <label className="field"><span>Dónde entrenas (opcional)</span><input name="gym" defaultValue={b?.gym ?? ""} maxLength={LIMITS.gym} /></label>
              <label className="field"><span>Ciudad (opcional)</span><input name="city" maxLength={LIMITS.city} /></label>
              <label className="field"><span>Provincia</span><select name="province" defaultValue={b?.province ?? ""} required><option value="">Elige una provincia</option>{PROVINCES.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="field"><span>Años entrenando (opcional)</span><input name="years" type="number" inputMode="numeric" min={0} max={TRAINER_YEARS_MAX} defaultValue={b?.years ?? ""} /></label>
              <label className="field"><span>Presentación (opcional)</span><textarea name="bio" rows={3} maxLength={LIMITS.bio} placeholder="Tu experiencia y cómo trabajas" /></label>
              {clase?.ok && <label className="tarjeta" style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}><input type="checkbox" name="publicarClase" defaultChecked /><span><strong>Publicar también mi primera clase</strong><span className="meta" style={{ display: "block" }}>{clase.value.title} · {CLASS_KIND_LABEL[clase.value.kind]} · {classMeta(clase.value)} · {clase.value.priceEuros} €</span></span></label>}
              <button className="btn-grande">Publicar mi perfil</button>
            </form>
          </section>
        )}
        {veladas}
      </div>
    );
  }
  const activas = trainer.classes.filter((c) => c.active);
  const desde = activas.length ? Math.min(...activas.map((c) => c.priceEuros)) : null;
  const pendientes = await db.classRequest.count({ where: { class: { trainerId: trainer.id }, status: "PENDING" } });
  return (
    <div className="pantalla" style={{ gap: 22 }}>
      <Saludo kicker="Mi panel" nombre={user.name} sub={`Entrenador${trainer.gym ? ` · ${trainer.gym.name}` : ""}${trainer.city ? `, ${trainer.city}` : ""}`} extra={<Link href={`/entrenadores/${trainer.slug}`} className="btn secondary" style={{ minHeight: 44, fontSize: 14 }}>Mi perfil</Link>} />
      <AccionesPrincipales acciones={[
        { href: "/organizador?tipo=velada#crear", titulo: "Crear una velada", detalle: "Cartel abierto al público", icono: "trofeo" },
        { href: "/organizador?tipo=interclub#crear", titulo: "Crear un interclub", detalle: "Encuentro entre clubes", icono: "personas" },
        { href: "/mis-clases#nueva", titulo: "Publicar una clase", detalle: "Individual o colectiva", icono: "mas" },
        { href: "/mis-clases#solicitudes", titulo: "Solicitudes de clase", detalle: "Acepta o responde", icono: "bandeja", aviso: pendientes },
        { href: "/organizador", titulo: "Mis veladas e interclubs", detalle: "Cartel y resultados", icono: "calendario" },
        { href: "/organizador#mis-eventos", titulo: "Solicitudes para participar", detalle: "Peleadores que quieren entrar", icono: "check", aviso: inscripciones },
        { href: "/peleadores", titulo: "Buscar peleadores", detalle: "Para tus carteles", icono: "buscar" },
      ]} />
      <section className="tarjeta tarjeta-acc anillo" style={{ padding: 22, gap: 6 }} aria-label="Tus clases publicadas">
        <span className="kicker">Clases publicadas</span>
        <span style={{ font: "800 64px/1 var(--font)", letterSpacing: "-.05em" }}>{activas.length}</span>
        <span style={{ fontWeight: 500 }}>{desde !== null ? `Desde ${desde} € por sesión · visibles en tu perfil público` : "Publica una clase para aparecer en «Entrenadores»."}</span>
      </section>
      <div className="rejilla-3">
        <div className="dato"><span className="clave">Activas</span><span className="valor">{activas.length}</span></div>
        <div className="dato"><span className="clave">En pausa</span><span className="valor">{trainer.classes.length - activas.length}</span></div>
        <div className="dato"><span className="clave">Años</span><span className="valor acc">{trainer.yearsCoaching ?? "—"}</span></div>
      </div>
      <section aria-labelledby="titulo-clases-inicio" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="titulo-seccion"><h2 id="titulo-clases-inicio">Tus clases</h2><Link href="/mis-clases">Gestionar</Link></div>
        {activas.length ? <div className="lista">{activas.map((c) => (
          <div key={c.id} className="fila"><span className="cuerpo"><span className="nombre">{c.title}</span><span className="meta">{classMeta(c)}</span></span><span className={`pildora ${c.kind === "INDIVIDUAL" ? "pildora-acc" : "pildora-violeta"}`}>{CLASS_KIND_LABEL[c.kind]}</span><strong className="acc">{c.priceEuros} €</strong></div>
        ))}</div> : <p className="mut" style={{ margin: 0 }}>Aún no tienes clases publicadas.</p>}
      </section>
      {veladas}
    </div>
  );
}
