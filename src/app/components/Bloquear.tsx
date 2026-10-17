/**
 * «Bloquear a esta persona» (Apple 1.2; lib/community/bloqueos.ts). Se despliega antes de bloquear para explicar qué pasará: abrirlo y pulsar
 * el botón son dos pasos, así que no se bloquea a nadie por un toque sin querer. `accion` es la acción del servidor (los componentes no importan
 * acciones); `origen` e `id` dicen qué se está viendo (una ficha, un comentario…), para no tener que mostrar identificadores de usuario.
 */
export function BotonBloquear({ accion, origen, id, back, nombre }: { accion: (f: FormData) => Promise<void>; origen: string; id: string; back: string; nombre: string }) {
  return (
    <details className="bloquear">
      <summary className="mut">Bloquear a {nombre}</summary>
      <form action={accion} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
        <input type="hidden" name="origen" value={origen} /><input type="hidden" name="id" value={id} /><input type="hidden" name="back" value={back} />
        <p className="mut" style={{ margin: 0 }}>
          Ya no podrá retarte, proponerte sparring, invitarte, pedir tus clases ni seguirte, y dejarás de ver sus comentarios, vídeos y fotos. Se cancelan las
          propuestas, invitaciones y solicitudes pendientes entre vosotros. No le avisamos. Puedes desbloquearla cuando quieras en «Mi cuenta».
        </p>
        <button className="secondary">Bloquear a {nombre}</button>
      </form>
    </details>
  );
}

/** Aviso de que la persona está bloqueada, con la forma de deshacerlo. */
export function Desbloquear({ accion, userId, back, nombre }: { accion: (f: FormData) => Promise<void>; userId: string; back: string; nombre: string }) {
  return (
    <form action={accion} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input type="hidden" name="userId" value={userId} /><input type="hidden" name="back" value={back} />
      <span className="mut" style={{ flex: "1 1 200px" }}>Has bloqueado a {nombre}: no podéis contactar y no ves lo que publica.</span>
      <button className="secondary">Desbloquear a {nombre}</button>
    </form>
  );
}
