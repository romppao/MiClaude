import Link from "next/link";
import type { User } from "@prisma/client";
import { db } from "../../lib/common/db";
import { readOnboarding } from "../../lib/accounts/onboarding";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../lib/common/disciplines";
import { PROVINCES } from "../../lib/common/labels";
import { LIMITS } from "../../lib/common/text";
import { CLASS_KIND_LABEL, TRAINER_YEARS_MAX, classMeta, parseClass } from "../../lib/trainers/classes";
import { createMyTrainer } from "../actions/trainers";
import Icono from "../components/Icono";
import { Saludo } from "./comun";

/**
 * Inicio del entrenador (diseño v3, «homeCoach»). Sin perfil todavía: el formulario para publicarlo, con lo que eligió al registrarse.
 * Con perfil: sus clases publicadas y el botón para crear otra. Las reservas y los ingresos llegarán con la gestión de reservas.
 */
export default async function InicioEntrenador({ user }: { user: User }) {
  const trainer = await db.trainer.findUnique({ where: { userId: user.id }, include: { gym: true, classes: { orderBy: [{ active: "desc" }, { createdAt: "asc" }] } } });
  if (!trainer) {
    const borrador = readOnboarding(user.onboarding);
    const b = borrador?.kind === "entrenador" ? borrador : null;
    const clase = b?.clase ? parseClass(b.clase) : null;
    return (
      <div className="pantalla">
        <Saludo nombre={user.name} sub="Entrenador" />
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
      </div>
    );
  }
  const activas = trainer.classes.filter((c) => c.active);
  const desde = activas.length ? Math.min(...activas.map((c) => c.priceEuros)) : null;
  return (
    <div className="pantalla" style={{ gap: 22 }}>
      <Saludo nombre={user.name} sub={`Entrenador${trainer.gym ? ` · ${trainer.gym.name}` : ""}${trainer.city ? `, ${trainer.city}` : ""}`} extra={<Link href={`/entrenadores/${trainer.slug}`} className="btn secondary" style={{ minHeight: 44, fontSize: 14 }}>Mi perfil</Link>} />
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
      <Link href="/mis-clases#nueva" className="btn btn-grande"><Icono nombre="mas" />Crear una clase</Link>
    </div>
  );
}
