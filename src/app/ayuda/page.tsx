import Link from "next/link";

export const metadata = { title: "¿Cómo funciona?" };

export default function Help() {
  return (
    <>
      <h1>¿Cómo funciona Ring España?</h1>
      <p>Ring España reúne el boxeo español en un solo lugar: los peleadores, sus récords, las veladas, los gimnasios y los entrenadores. Damos especial importancia al boxeo amateur, que es donde nacen los campeones del futuro.</p>
      <p className="mut">No necesitas una cuenta para consultar veladas, fichas y el ránking. Para valorar, registrar combates o publicar sí es necesario registrarse.</p>

      <h2>Si eres aficionado</h2>
      <ol>
        <li><Link href="/registro">Crea tu cuenta</Link> y confirma tu correo electrónico.</li>
        <li>Busca a un peleador en <Link href="/peleadores">Peleadores</Link> o mira quién compite en <Link href="/veladas">Veladas</Link>.</li>
        <li>En la ficha del peleador, elige el combate que viste y pulsa <strong>«Valorar a este peleador»</strong>. Puedes poner de 1 a 5 estrellas, escribir un comentario e indicar si lo viste en directo.</li>
        <li>Las mejores valoraciones aparecen en el <Link href="/ranking">Ránking</Link>.</li>
      </ol>
      <p className="mut">Solo se puede valorar un combate que ya se ha celebrado, una vez por combate, y no pueden valorar quienes han participado en él.</p>

      <h2>Si eres peleador</h2>
      <ol>
        <li><Link href="/registro">Crea tu cuenta</Link> eligiendo «Tener mi ficha de peleador» y confirma tu correo electrónico.</li>
        <li>Si alguien ya registró un combate tuyo, busca tu ficha y pide que pase a ser tuya. Si no aparece, crea una nueva.</li>
        <li>En <Link href="/mi-ficha">Mi ficha</Link>, registra tus combates. Añadir un enlace que los demuestre (acta, cartel, vídeo o publicación) ayuda a que se confirmen antes.</li>
        <li>Cuando tu rival tiene cuenta, recibe el combate para confirmarlo con «Sí, es correcto».</li>
      </ol>

      <h2>Si organizas veladas</h2>
      <p>Solicita el acceso de organizador en <Link href="/organizador">Organizadores</Link>. Un moderador revisa la solicitud. Después podrás crear tus veladas, montar el cartel y anotar los resultados, que quedan marcados como verificados.</p>

      <h2>Qué significan las etiquetas de un combate</h2>
      <table>
        <tbody>
          <tr><th scope="row">Pendiente de confirmar</th><td>Lo ha registrado uno de los peleadores y su rival todavía no lo ha confirmado. Cuenta en el récord, pero se indica que aún no está respaldado.</td></tr>
          <tr><th scope="row">Confirmado por el rival</th><td>Los dos peleadores están de acuerdo.</td></tr>
          <tr><th scope="row">Verificado</th><td>Lo ha comprobado un moderador o lo ha publicado el organizador de la velada.</td></tr>
          <tr><th scope="row">En revisión</th><td>Alguien ha indicado que no es correcto. No cuenta en el récord hasta que se aclare.</td></tr>
          <tr><th scope="row">Evidencia</th><td>El combate incluye un enlace que lo demuestra. Ábrelo para comprobarlo tú mismo.</td></tr>
          <tr><th scope="row">✓ Verificado (gimnasios y organizadores)</th><td>Un moderador ha comprobado que existen y son quienes dicen ser.</td></tr>
        </tbody>
      </table>

      <h2>Cómo cuidamos que los datos sean fiables</h2>
      <p>Mostramos siempre cuánto respaldo tiene cada dato. Las valoraciones están ligadas a un combate concreto, se limitan por usuario y solo pueden hacerlas personas registradas con el correo confirmado. Todos los cambios importantes quedan registrados.</p>

      <h2>¿Has visto un error?</h2>
      <p>En la ficha de cualquier peleador encontrarás la opción <strong>«¿Hay un error? Avísanos»</strong>, disponible para usuarios registrados. Un moderador revisará tu aviso.</p>
    </>
  );
}
