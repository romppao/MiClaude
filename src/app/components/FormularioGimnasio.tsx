import type { Gym } from "@prisma/client";
import { PROVINCES } from "../../lib/common/labels";
import { DISCIPLINE_ORDER, DISCIPLINE_LABEL } from "../../lib/common/disciplines";

/** Formulario compartido; recibe la acción autorizada desde la página. Solo contacto profesional del negocio. */
export default function FormularioGimnasio({ action, gym, admin = false, back }: { action: (f: FormData) => Promise<void>; gym?: Gym | null; admin?: boolean; back?: string }) {
  return <form action={action} className="tarjeta">
    {gym && <input type="hidden" name="gymId" value={gym.id} />}
    {back && <input type="hidden" name="back" value={back} />}
    <label className="field"><span>Nombre del gimnasio</span><input name="name" required maxLength={150} defaultValue={gym?.name} /></label>
    <label className="field"><span>Ciudad</span><input name="city" required maxLength={100} defaultValue={gym?.city} /></label>
    <label className="field"><span>Provincia</span><select name="province" required defaultValue={gym?.province ?? ""}><option value="">Elige una provincia</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
    <label className="field"><span>Dirección profesional</span><input name="address" maxLength={200} defaultValue={gym?.address ?? ""} /></label>
    <label className="field"><span>Teléfono profesional (opcional)</span><input name="phone" type="tel" maxLength={30} defaultValue={gym?.phone ?? ""} /></label>
    <label className="field"><span>Correo profesional (opcional)</span><input name="email" type="email" maxLength={200} defaultValue={gym?.email ?? ""} /></label>
    <label className="field"><span>Web (opcional)</span><input name="website" type="url" maxLength={500} defaultValue={gym?.website ?? ""} /></label>
    <label className="field"><span>Instagram (opcional)</span><input name="instagram" type="url" maxLength={500} defaultValue={gym?.instagram ?? ""} /></label>
    <fieldset><legend>Disciplinas</legend><div className="chips">{DISCIPLINE_ORDER.map((d) => <label key={d} className="chip"><input name="disciplina" type="checkbox" value={d} defaultChecked={gym?.disciplines.includes(d)} />{DISCIPLINE_LABEL[d]}</label>)}</div></fieldset>
    {admin && <><label className="field"><span>Estado</span><select name="status" defaultValue={gym?.status ?? "PUBLISHED"}><option value="PUBLISHED">Publicado</option><option value="PENDING">Por revisar</option><option value="REMOVED">Retirado</option></select></label><label className="field"><span>Nota de revisión</span><textarea name="note" maxLength={1000} defaultValue={gym?.reviewNote ?? ""} /></label></>}
    {!gym && !admin && <><p>Aporta una web o redes del gimnasio y explica tu relación. No subas DNI ni documentos de identidad. Un moderador revisará el alta y la reclamación.</p><label className="field"><span>Prueba</span><textarea name="evidence" required minLength={10} maxLength={2000} /></label><label className="field"><span>Enlace de prueba (opcional)</span><input name="evidenceUrl" type="url" maxLength={500} /></label></>}
    <button>Guardar gimnasio</button>
  </form>;
}
