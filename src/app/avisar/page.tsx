import Link from "next/link";
import type { Metadata } from "next";
import { getUser } from "../../lib/accounts/auth";
import { AVISO_EXPLICACION_MAX, AVISO_EXPLICACION_MIN, REASONS_BY_ENTITY, REPORT_REASONS } from "../../lib/community/reports";
import { avisarSinCuenta } from "../actions/community";

export const metadata: Metadata = { title: "Avisar de un contenido", description: "Avisa a Lona de un contenido ilegal o que incumple las normas, aunque no tengas cuenta." };
export const dynamic = "force-dynamic";

/**
 * Aviso de contenido ilegal o que incumple las normas, con o sin cuenta (DSA, art. 16; docs/LEGAL.md). Pide lo que exige la ley: dónde está,
 * por qué, quién avisa y la declaración de buena fe. Desde una página concreta se llega con `?direccion=` ya rellena.
 */
export default async function Avisar({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const direccion = typeof params.direccion === "string" ? params.direccion.slice(0, 500) : "";
  const user = await getUser();
  return (
    <div className="pantalla">
      <h1>Avisar de un contenido</h1>
      <p className="lead">Si ves en Lona algo ilegal o que incumple nuestras <Link href="/condiciones">condiciones de uso</Link>, cuéntanoslo aquí. No hace falta tener cuenta.</p>
      <p className="mut" style={{ margin: 0 }}>
        Una persona del equipo de moderación lo revisará; no usamos sistemas automáticos para decidir. Te confirmaremos que lo hemos recibido y te escribiremos con la decisión.
        {user?.emailVerifiedAt ? " Si se trata de un error en una ficha o en un combate, es más rápido el botón «¿Hay un error? Avísanos» de esa página." : ""}
      </p>

      <form action={avisarSinCuenta} className="tarjeta" style={{ gap: 14 }}>
        <label className="field">
          <span>Dirección de la página donde está</span>
          <input name="direccion" type="text" inputMode="url" required maxLength={500} defaultValue={direccion} placeholder="https://… o /peleadores/…" autoComplete="off" />
          <span className="hint mut">Cópiala de la barra del navegador, en la página de la ficha, la velada, el vídeo o el comentario.</span>
        </label>
        <label className="field">
          <span>Motivo</span>
          <select name="motivo" required defaultValue="">
            <option value="" disabled>Elige el motivo…</option>
            {REASONS_BY_ENTITY.PAGINA.map((k) => <option key={k} value={k}>{REPORT_REASONS[k]}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Explica por qué</span>
          <textarea name="explicacion" required rows={5} minLength={AVISO_EXPLICACION_MIN} maxLength={AVISO_EXPLICACION_MAX} placeholder="Qué es exactamente (un comentario, una foto, un dato…) y por qué crees que es ilegal o incumple las normas." />
          <span className="hint mut">Cuanto más concreto, antes podremos actuar. Al menos {AVISO_EXPLICACION_MIN} caracteres.</span>
        </label>
        <label className="field">
          <span>Tu nombre</span>
          <input name="nombre" type="text" maxLength={120} autoComplete="name" defaultValue={user?.name ?? ""} />
        </label>
        <label className="field">
          <span>Tu correo electrónico</span>
          <input name="correo" type="email" maxLength={254} autoComplete="email" defaultValue={user?.email ?? ""} />
          <span className="hint mut">Para confirmarte que lo hemos recibido y decirte qué hemos decidido. Solo lo usamos para este aviso.</span>
        </label>
        {/* Trampa para programas que rellenan formularios solos: una persona no la ve. */}
        <div aria-hidden="true" style={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}>
          <label>No rellenes este campo<input name="web" type="text" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <label className="chip" style={{ alignItems: "flex-start" }}>
          <input type="checkbox" name="declaracion" value="si" />
          <span>Declaro que lo que cuento es cierto y completo, a mi leal saber y entender.</span>
        </label>
        <p className="mut" style={{ margin: 0 }}>El nombre, el correo y la declaración son obligatorios, salvo en los avisos de abuso o explotación sexual de menores, que puedes enviar sin identificarte. Si hay un peligro inmediato para alguien, llama al 112.</p>
        <button>Enviar el aviso</button>
      </form>
      <p className="mut" style={{ margin: 0 }}>Cómo tratamos los datos de este aviso: <Link href="/privacidad">política de privacidad</Link>.</p>
    </div>
  );
}
