import Link from "next/link";
import type { CSSProperties } from "react";
import { register } from "../actions/accounts";
import { LIMITS } from "../../lib/common/text";
import { internalPath } from "../../lib/common/paths";
import { oneParam } from "../../lib/common/safe";
import { TIPOS_DE_ENTIDAD, TIPO_DE_ENTIDAD_ETIQUETA, TIPOS_DE_CUENTA, type TipoDeCuenta } from "../../lib/accounts/landing";
import { conAlfa } from "../../lib/common/apariencia";
import PasosRegistro from "../components/PasosRegistro";
import Icono from "../components/Icono";

export const metadata = { title: "Crear cuenta" };

/** Los cuatro tipos de cuenta (diseño v3): la aplicación se adapta a lo que hace cada persona. */
const PANELES: Record<TipoDeCuenta, { titulo: string; descripcion: string; boton: string; titular: string; color: string }> = {
  usuario: { titulo: "Aficionado", descripcion: "Sigue a peleadores, da aura y consulta veladas.", boton: "Crear mi cuenta", titular: "Crear cuenta de aficionado", color: "#D4F67C" },
  peleador: { titulo: "Peleador", descripcion: "Crea tu ficha y lleva tu trayectoria.", boton: "Crear mi cuenta de peleador", titular: "Crear cuenta de peleador", color: "#FF6B5B" },
  entrenador: { titulo: "Entrenador", descripcion: "Promociónate y publica tus clases privadas, individuales o colectivas.", boton: "Crear mi cuenta de entrenador", titular: "Crear cuenta de entrenador", color: "#86C8FF" },
  entidad: { titulo: "Promotora, federación o club", descripcion: "Organiza veladas y presenta tu entidad. Un moderador revisa la solicitud.", boton: "Enviar solicitud y crear cuenta", titular: "Crear cuenta de entidad", color: "#BE33F5" },
};

const QUE_SIGUE: Record<TipoDeCuenta, string> = {
  usuario: "Después podrás elegir tus disciplinas y los peleadores que quieres seguir.",
  peleador: "Después podrás crear tu ficha con tu disciplina, tu categoría y tu provincia.",
  entrenador: "Después podrás preparar tu perfil de entrenador y tu primera clase.",
  entidad: "Un moderador revisará tu solicitud y te responderá por correo electrónico. Hasta entonces tu cuenta funciona como la de un aficionado.",
};

export default async function Register({ searchParams }: { searchParams: Promise<{ next?: string; tipo?: string }> }) {
  const sp = await searchParams;
  const next = internalPath(oneParam(sp.next) ?? "", "");
  const tipo = TIPOS_DE_CUENTA.find((t) => t === oneParam(sp.tipo));
  const siguiente = next ? `&next=${encodeURIComponent(next)}` : "";
  const entrar = `/entrar${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const volverAElegir = `/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const avisoDestino = next && <p className="notice notice-info" role="note">Crea tu cuenta para continuar. Cuando confirmes tu correo electrónico podrás volver a la página donde estabas.</p>;

  if (!tipo) {
    return (
      <div className="pantalla">
        <PasosRegistro tipo={null} paso={0} atras="/bienvenida" etiquetaAtras="Volver a la bienvenida" />
        <div>
          <h1>Crear cuenta</h1>
          <p className="lead">¿Cómo vas a usar Ring España? Elige el tipo de cuenta que necesitas: la aplicación se adapta a lo que haces.</p>
        </div>
        {avisoDestino}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {TIPOS_DE_CUENTA.map((t) => (
            <Link key={t} className="panel-tipo panel-registro" href={`/registro?tipo=${t}${siguiente}`} style={{ "--tinte": conAlfa(PANELES[t].color, 0.3), "--anillo": conAlfa(PANELES[t].color, 0.3), "--color": PANELES[t].color } as CSSProperties}>
              <strong>{PANELES[t].titulo}</strong>
              <span>{PANELES[t].descripcion}</span>
              <span className="accion">Elegir esta cuenta <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
        <p style={{ margin: 0 }}>¿Ya tienes cuenta? <Link href={entrar}>Entra en tu cuenta</Link>. ¿La contraseña? <Link href="/recuperar">Elige una nueva</Link>.</p>
        <p className="mut" style={{ margin: 0 }}>¿Dudas? Consulta <Link href="/ayuda">cómo funciona Ring España</Link>.</p>
      </div>
    );
  }

  const panel = PANELES[tipo];
  return (
    <div className="pantalla">
      <PasosRegistro tipo={tipo} paso={1} atras={volverAElegir} etiquetaAtras="Elegir otro tipo de cuenta" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
        <span className="pildora pildora-acc">{panel.titulo}</span>
        <h1 style={{ margin: 0 }}>{panel.titular}</h1>
      </div>
      {avisoDestino}
      <form action={register} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input type="hidden" name="tipo" value={tipo} />
        {next && <input type="hidden" name="next" value={next} />}
        <label className="field"><span>{tipo === "entidad" ? "Tu nombre (la persona que gestiona la cuenta)" : "Nombre"}</span><input name="name" autoComplete="name" required maxLength={LIMITS.name} /></label>
        <label className="field"><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required maxLength={LIMITS.email} /><span className="hint">Te enviaremos un enlace para confirmarlo.</span></label>
        <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={LIMITS.password} /><span className="hint">Mínimo 8 caracteres.</span></label>
        {tipo === "entidad" && (
          <>
            <label className="field"><span>Nombre de la entidad</span><input name="orgName" required maxLength={LIMITS.orgName} /></label>
            <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ font: "500 16px var(--font)", color: "var(--mut)", marginBottom: 8 }}>Tipo de entidad</legend>
              <div className="segmentos">
                {TIPOS_DE_ENTIDAD.map((k, i) => <label key={k}><input type="radio" name="entityKind" value={k} defaultChecked={i === 0} required />{TIPO_DE_ENTIDAD_ETIQUETA[k]}</label>)}
              </div>
            </fieldset>
            <label className="field"><span>Web o red social (opcional)</span><input name="website" type="url" inputMode="url" autoComplete="url" maxLength={LIMITS.url} /><span className="hint">Empieza por https://</span></label>
            <label className="field"><span>¿Cómo podemos comprobarlo?</span><input name="message" required maxLength={LIMITS.message} placeholder="Una web, una red social o una velada anterior" /><span className="hint">No escribas números de documento.</span></label>
          </>
        )}
        <p className="mut" style={{ margin: 0 }}>{QUE_SIGUE[tipo]}</p>
        <button className="btn-grande" style={{ marginTop: 6 }}>{panel.boton}<Icono nombre="siguiente" tam={18} grosor={2.2} /></button>
        <span className="hint" style={{ textAlign: "center", color: "var(--mut)" }}>Al crear tu cuenta aceptas que tratemos tus datos como explicamos en la <Link href="/privacidad">política de privacidad</Link>.</span>
      </form>
      <p style={{ margin: 0 }}><Link href={volverAElegir}>Elegir otro tipo de cuenta</Link></p>
      <p style={{ margin: 0 }}>¿Ya tienes cuenta? <Link href={entrar}>Entra en tu cuenta</Link>. ¿La contraseña? <Link href="/recuperar">Elige una nueva</Link>.</p>
    </div>
  );
}
