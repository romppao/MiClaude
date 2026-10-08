"use client";
import { useMemo, useState } from "react";
import { DIAS_POR_DELANTE, HORA_MAX, HORA_MIN, PASO_MINUTOS, diaLegible, hora } from "../../lib/trainers/requests";

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const sumarDias = (dia: string, n: number) => new Date(Date.parse(`${dia}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** Atajos de la barra de horas: rellenan la franja de un toque. */
const ATAJOS = [
  { nombre: "Mañana", desde: 9 * 60, hasta: 14 * 60 },
  { nombre: "Tarde", desde: 16 * 60, hasta: 21 * 60 },
  { nombre: "Noche", desde: 19 * 60, hasta: 23 * 60 },
];

/**
 * Elegir cuándo viene bien una clase sin escribir (petición del fundador, 8 de octubre de 2026: «es mucho mejor que pueda seleccionar la
 * fecha y hora en un calendario directamente, seleccionar su rango de tiempo mediante una barra»).
 *
 * - **Día:** una tira con los próximos 14 días (Hoy, Mañana, mar 14…) y «Otra fecha», que abre el calendario del móvil.
 * - **Franja** (solo en clases individuales; las colectivas tienen su horario): una barra con dos tiradores, de 07:00 a 23:00 en medias
 *   horas, que no deja una franja más corta que la clase, y tres atajos (mañana, tarde, noche).
 *
 * Envía `day` (AAAA-MM-DD), `fromMinute` y `toMinute` (minutos desde las 00:00). El servidor lo vuelve a comprobar todo.
 */
export default function ElegirHorario({ hoy, individual, minutos, inicial }: { hoy: string; individual: boolean; minutos: number; inicial?: { day?: string; from?: number; to?: number } }) {
  const dias = useMemo(() => Array.from({ length: 14 }, (_, i) => sumarDias(hoy, i)), [hoy]);
  const ultimo = sumarDias(hoy, DIAS_POR_DELANTE);
  const [dia, setDia] = useState(inicial?.day && inicial.day >= hoy && inicial.day <= ultimo ? inicial.day : "");
  const minimo = Math.max(PASO_MINUTOS, Math.ceil(minutos / PASO_MINUTOS) * PASO_MINUTOS);
  const [desde, setDesde] = useState(inicial?.from ?? 17 * 60);
  const [hasta, setHasta] = useState(inicial?.to ?? Math.min(HORA_MAX, 17 * 60 + Math.max(minimo, 3 * 60)));
  const otraFecha = dia && !dias.includes(dia);

  // Los dos tiradores nunca se cruzan ni dejan una franja más corta que la clase.
  const moverDesde = (v: number) => { const d = Math.min(v, HORA_MAX - minimo); setDesde(d); if (hasta - d < minimo) setHasta(d + minimo); };
  const moverHasta = (v: number) => { const h = Math.max(v, HORA_MIN + minimo); setHasta(h); if (h - desde < minimo) setDesde(h - minimo); };
  const pct = (m: number) => ((m - HORA_MIN) / (HORA_MAX - HORA_MIN)) * 100;

  return (
    <div className="elegir-horario">
      <fieldset>
        <legend className="leyenda">¿Qué día te viene bien?</legend>
        <div className="tira-dias" role="radiogroup" aria-label="Próximos días">
          {dias.map((d, i) => {
            const f = new Date(`${d}T12:00:00Z`);
            const marcado = d === dia;
            return (
              <button key={d} type="button" role="radio" aria-checked={marcado} className={`dia${marcado ? " elegido" : ""}`} onClick={() => setDia(d)} aria-label={`${i === 0 ? "Hoy, " : i === 1 ? "Mañana, " : ""}${diaLegible(d)}`}>
                <span className="dia-semana">{i === 0 ? "Hoy" : i === 1 ? "Mañana" : DIAS_CORTOS[f.getUTCDay()]}</span>
                <span className="dia-numero">{f.getUTCDate()}</span>
                <span className="dia-mes">{MESES_CORTOS[f.getUTCMonth()]}</span>
              </button>
            );
          })}
        </div>
        <label className="field otra-fecha"><span>Otra fecha</span>
          <input type="date" min={hoy} max={ultimo} value={otraFecha ? dia : ""} onChange={(e) => setDia(e.currentTarget.value)} />
        </label>
        <input type="hidden" name="day" value={dia} />
      </fieldset>

      {individual && (
        <fieldset>
          <legend className="leyenda">¿Entre qué horas?</legend>
          <div className="atajos-hora">
            {ATAJOS.map((a) => (
              <button key={a.nombre} type="button" className={`chip${desde === a.desde && hasta === a.hasta ? " activo" : ""}`} aria-pressed={desde === a.desde && hasta === a.hasta} onClick={() => { setDesde(a.desde); setHasta(Math.max(a.hasta, a.desde + minimo)); }}>
                {a.nombre} <span className="mut">{hora(a.desde)}–{hora(a.hasta)}</span>
              </button>
            ))}
          </div>
          <div className="barra-horas" style={{ "--desde": `${pct(desde)}%`, "--hasta": `${pct(hasta)}%` } as React.CSSProperties}>
            <span className="barra-pista" aria-hidden="true"><span className="barra-tramo" /></span>
            <input type="range" min={HORA_MIN} max={HORA_MAX} step={PASO_MINUTOS} value={desde} onChange={(e) => moverDesde(Number(e.currentTarget.value))} aria-label="Desde las" aria-valuetext={hora(desde)} />
            <input type="range" min={HORA_MIN} max={HORA_MAX} step={PASO_MINUTOS} value={hasta} onChange={(e) => moverHasta(Number(e.currentTarget.value))} aria-label="Hasta las" aria-valuetext={hora(hasta)} />
          </div>
          <div className="marcas-hora" aria-hidden="true"><span>07:00</span><span>11:00</span><span>15:00</span><span>19:00</span><span>23:00</span></div>
          <input type="hidden" name="fromMinute" value={desde} />
          <input type="hidden" name="toMinute" value={hasta} />
        </fieldset>
      )}

      <p className="resumen-horario" role="status" aria-live="polite">
        {dia ? <>Has elegido: <strong>{diaLegible(dia)}{individual ? `, entre las ${hora(desde)} y las ${hora(hasta)}` : ""}</strong>.</> : "Elige un día para continuar."}
      </p>
    </div>
  );
}
