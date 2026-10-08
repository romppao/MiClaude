import { CLASS_MINUTES, CLASS_PRICE_MAX, CLASS_SCHEDULE_MAX, CLASS_TITLE_MAX, GROUP_CAPACITY } from "../../lib/trainers/classes";

type Valores = { kind?: string; title?: string; minutes?: string; price?: string; capacity?: string; schedule?: string };

/** Campos de una clase (registro del entrenador y «Mis clases»). Las plazas y el horario solo se ven en una clase colectiva. */
export default function CamposClase({ valores = {} }: { valores?: Valores }) {
  const tipo = valores.kind === "GROUP" ? "GROUP" : "INDIVIDUAL";
  const minutos = valores.minutes || "60";
  return (
    <>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="leyenda">Tipo</legend>
        <div className="segmentos">
          <label><input type="radio" name="kind" value="INDIVIDUAL" defaultChecked={tipo === "INDIVIDUAL"} required />Individual</label>
          <label><input type="radio" name="kind" value="GROUP" defaultChecked={tipo === "GROUP"} />Colectiva</label>
        </div>
      </fieldset>
      <label className="field"><span>Título</span><input name="title" defaultValue={valores.title ?? ""} required maxLength={CLASS_TITLE_MAX} placeholder="Técnica y defensa" /></label>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="leyenda">Duración</legend>
        <div className="chips">{CLASS_MINUTES.map((m) => <label key={m} className="chip"><input type="radio" name="minutes" value={m} defaultChecked={String(m) === minutos} required />{m} min</label>)}</div>
      </fieldset>
      <label className="field"><span>Precio por persona y sesión (€)</span><input name="price" type="number" inputMode="numeric" min={0} max={CLASS_PRICE_MAX} step={1} defaultValue={valores.price ?? ""} required placeholder="35" /><span className="hint">Lo cobras tú directamente: Ring España no gestiona pagos.</span></label>
      <div className="solo-grupo">
        <label className="field"><span>Plazas del grupo</span><input name="capacity" type="number" inputMode="numeric" min={GROUP_CAPACITY.min} max={GROUP_CAPACITY.max} defaultValue={valores.capacity ?? ""} placeholder="10" /><span className="hint">Solo para clases colectivas: entre {GROUP_CAPACITY.min} y {GROUP_CAPACITY.max}.</span></label>
        <label className="field"><span>Horario</span><input name="schedule" defaultValue={valores.schedule ?? ""} maxLength={CLASS_SCHEDULE_MAX} placeholder="Martes y jueves · 19:30" /><span className="hint">Solo para clases colectivas. Las individuales se acuerdan con cada alumno.</span></label>
      </div>
    </>
  );
}
