import Link from "next/link";
import { register } from "../actions/accounts";
import { LIMITS } from "../../lib/common/text";
import { internalPath } from "../../lib/common/paths";
import { oneParam } from "../../lib/common/safe";
import { TIPOS_DE_ENTIDAD, TIPO_DE_ENTIDAD_ETIQUETA, TIPOS_DE_CUENTA, type TipoDeCuenta } from "../../lib/accounts/landing";

export const metadata = { title: "Crear cuenta" };

/** Los tres paneles del registro: un tipo de cuenta cada uno, sin desplegables ni frases largas. */
const PANELES: Record<TipoDeCuenta, { titulo: string; descripcion: string; boton: string; titular: string }> = {
  usuario: { titulo: "Usuario", descripcion: "Sigue a peleadores, da aura y consulta veladas.", boton: "Crear mi cuenta", titular: "Crear cuenta de usuario" },
  peleador: { titulo: "Peleador", descripcion: "Crea tu ficha y lleva tu trayectoria.", boton: "Crear mi cuenta de peleador", titular: "Crear cuenta de peleador" },
  entidad: { titulo: "Promotora o federación", descripcion: "Publica veladas y presenta tu entidad. Un moderador revisa la solicitud.", boton: "Enviar solicitud y crear cuenta", titular: "Crear cuenta de promotora o federación" },
};

export default async function Register({ searchParams }: { searchParams: Promise<{ next?: string; tipo?: string }> }) {
  const sp = await searchParams;
  const next = internalPath(oneParam(sp.next) ?? "", "");
  const tipo = TIPOS_DE_CUENTA.find((t) => t === oneParam(sp.tipo));
  const siguiente = next ? `&next=${encodeURIComponent(next)}` : "";
  const entrar = `/entrar${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const volverAElegir = `/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  if (!tipo) {
    return (
      <>
        <h1>Crear cuenta</h1>
        {next && <p className="notice notice-info" role="note">Crea tu cuenta para continuar. Cuando confirmes tu correo electrónico podrás volver a la página donde estabas.</p>}
        <p>Elige el tipo de cuenta que necesitas.</p>
        <div className="paneles-registro">
          {TIPOS_DE_CUENTA.map((t) => (
            <Link key={t} className="card panel-registro" href={`/registro?tipo=${t}${siguiente}`}>
              <strong>{PANELES[t].titulo}</strong>
              <span>{PANELES[t].descripcion}</span>
              <span className="panel-accion">Elegir esta cuenta <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
        <p>¿Ya tienes cuenta? <Link href={entrar}>Entra en tu cuenta</Link>. ¿La contraseña? <Link href="/recuperar">Elige una nueva</Link>.</p>
        <p className="mut">¿Dudas? Consulta <Link href="/ayuda">cómo funciona Ring España</Link>.</p>
      </>
    );
  }

  const panel = PANELES[tipo];
  return (
    <>
      <h1>{panel.titular}</h1>
      {next && <p className="notice notice-info" role="note">Crea tu cuenta para continuar. Cuando confirmes tu correo electrónico podrás volver a la página donde estabas.</p>}
      <form className="search" action={register} style={{ flexDirection: "column", alignItems: "stretch", maxWidth: 420 }}>
        <input type="hidden" name="tipo" value={tipo} />
        {next && <input type="hidden" name="next" value={next} />}
        <label className="field"><span>{tipo === "entidad" ? "Tu nombre (la persona que gestiona la cuenta)" : "Nombre"}</span><input name="name" autoComplete="name" required maxLength={LIMITS.name} /></label>
        <label className="field"><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required maxLength={LIMITS.email} /><span className="hint">Te enviaremos un enlace para confirmarlo.</span></label>
        <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={LIMITS.password} /><span className="hint">Mínimo 8 caracteres.</span></label>
        {tipo === "peleador" && <p className="mut">Al terminar podrás crear tu ficha con tu disciplina, tu categoría y tu provincia.</p>}
        {tipo === "entidad" && (
          <>
            <label className="field"><span>Nombre de la entidad</span><input name="orgName" required maxLength={LIMITS.orgName} /></label>
            <label className="field"><span>Tipo de entidad</span>
              <select name="entityKind" defaultValue="PROMOTORA" required>
                {TIPOS_DE_ENTIDAD.map((k) => <option key={k} value={k}>{TIPO_DE_ENTIDAD_ETIQUETA[k]}</option>)}
              </select>
            </label>
            <label className="field"><span>Web o red social (opcional)</span><input name="website" type="url" inputMode="url" autoComplete="url" maxLength={LIMITS.url} /><span className="hint">Empieza por https://</span></label>
            <label className="field"><span>¿Cómo podemos comprobarlo?</span><input name="message" required maxLength={LIMITS.message} /><span className="hint">Una web, una red social o una velada anterior. No escribas números de documento.</span></label>
            <p className="mut">Un moderador revisará tu solicitud y te responderá por correo electrónico. Hasta entonces tu cuenta funciona como la de un usuario.</p>
          </>
        )}
        <button>{panel.boton}</button>
        <span className="hint">Al crear tu cuenta aceptas que tratemos tus datos como explicamos en la <Link href="/privacidad">política de privacidad</Link>.</span>
      </form>
      <p><Link href={volverAElegir}>Elegir otro tipo de cuenta</Link></p>
      <p>¿Ya tienes cuenta? <Link href={entrar}>Entra en tu cuenta</Link>. ¿La contraseña? <Link href="/recuperar">Elige una nueva</Link>.</p>
      <p className="mut">¿Dudas? Consulta <Link href="/ayuda">cómo funciona Ring España</Link>.</p>
    </>
  );
}
