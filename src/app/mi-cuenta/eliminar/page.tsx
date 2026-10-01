import Link from "next/link";
import { requireUser } from "../../../lib/accounts/auth";
import { db } from "../../../lib/common/db";
import { deleteAccount } from "../../actions/accounts";
import { LIMITS } from "../../../lib/common/text";

export const metadata = { title: "Eliminar mi cuenta" };
export const dynamic = "force-dynamic";

export default async function DeleteAccount() {
  const user = await requireUser();
  const fighter = user.fighter;
  const conCombates = fighter ? await db.bout.count({ where: { OR: [{ fighterAId: fighter.id }, { fighterBId: fighter.id }] } }) : 0;
  return (
    <>
      <h1>Eliminar mi cuenta</h1>
      <p><strong>Esta acción no se puede deshacer.</strong> Léela con calma antes de continuar.</p>
      <h2>Qué se borra</h2>
      <ul>
        <li>Tu cuenta: tu nombre, tu correo electrónico y tu contraseña.</li>
        <li>Las auras y los comentarios que has dado, los peleadores que sigues y tus avisos y solicitudes.</li>
        {fighter && conCombates === 0 && <li>Tu ficha de peleador, porque no tiene combates registrados.</li>}
      </ul>
      {fighter && conCombates > 0 && (
        <>
          <h2>Qué se conserva</h2>
          <p>Tu ficha tiene {conCombates === 1 ? "1 combate registrado" : `${conCombates} combates registrados`}. Esos combates también forman parte del récord de tus rivales, así que se conservan, pero <strong>tu ficha pasa a mostrarse como «Peleador anónimo»</strong>: se borran tu nombre, tu alias, tu fecha de nacimiento, tu procedencia, tu gimnasio, tus medidas y tu presentación.</p>
        </>
      )}
      {user.role === "ORGANIZER" && <p>Las veladas que has publicado se conservan, pero dejarán de figurar a tu nombre.</p>}
      <form className="search" action={deleteAccount} style={{ flexDirection: "column", maxWidth: 420 }}>
        <label className="field"><span>Escribe tu contraseña para confirmar que eres tú</span><input name="current" type="password" autoComplete="current-password" required maxLength={LIMITS.password} /></label>
        <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" name="confirm" style={{ width: 24, height: 24 }} required />
          <span>Entiendo que no se puede deshacer y quiero eliminar mi cuenta.</span>
        </label>
        <button>Eliminar mi cuenta definitivamente</button>
      </form>
      <p><Link href="/mi-cuenta">No quiero eliminarla: volver a Mi cuenta</Link></p>
    </>
  );
}
