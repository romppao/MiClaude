import Link from "next/link";

export const metadata = { title: "¿Cómo funciona?" };

export default function Help() {
  return (
    <>
      <h1>¿Cómo funciona Ring España?</h1>
      <p>Ring España reúne los deportes de contacto de España en un solo lugar, con el boxeo en cabeza: boxeo, MMA, Muay Thai, kickboxing, K-1 y jiu-jitsu. Aquí encontrarás a los peleadores, sus récords, las veladas, los gimnasios y los entrenadores. Damos especial importancia al deporte amateur, que es donde nacen los campeones del futuro.</p>
      <p className="mut">No necesitas una cuenta para consultar veladas, fichas y el ránking. Para dar aura, registrar combates o publicar sí es necesario registrarse.</p>

      <h2>Si eres aficionado</h2>
      <ol>
        <li><Link href="/registro">Crea tu cuenta</Link> y confirma tu correo electrónico.</li>
        <li>Busca a un peleador en <Link href="/peleadores">Peleadores</Link> o mira quién compite en <Link href="/veladas">Veladas</Link>.</li>
        <li>En la ficha del peleador, elige el combate que viste y pulsa <strong>«Dar aura»</strong>. El aura es tu forma de reconocer a un peleador que te ha impresionado. Puedes añadir un comentario e indicar si lo viste en directo.</li>
        <li>Los peleadores con más aura aparecen en el <Link href="/ranking">Ránking</Link>, ordenados dentro de su disciplina y de su categoría de peso.</li>
      </ol>
      <p className="mut">Solo se puede dar aura por un combate que ya se ha celebrado, una vez por combate y peleador, y no pueden darla quienes han participado en él. Si cambias de opinión, puedes quitar tu aura.</p>

      <h2>Si eres peleador</h2>
      <ol>
        <li><Link href="/registro">Crea tu cuenta</Link> eligiendo «Tener mi ficha de peleador» y confirma tu correo electrónico.</li>
        <li>Si alguien ya registró un combate tuyo, busca tu ficha y pide que pase a ser tuya. Si no aparece, crea una nueva.</li>
        <li>Elige tu disciplina y tu categoría de peso. Si ya habías competido antes, indica cuántos combates llevas; si recuerdas tu récord, añádelo, y si no, con el número de combates basta. Puedes añadir más disciplinas cuando quieras.</li>
        <li>En <Link href="/mi-ficha">Mi ficha</Link>, registra tus combates. Añadir un enlace que los demuestre (acta, cartel, vídeo o publicación) ayuda a que se confirmen antes.</li>
        <li>Cuando tu rival tiene cuenta, recibe el combate para confirmarlo con «Sí, es correcto».</li>
      </ol>

      <h2>Si organizas veladas</h2>
      <p>Solicita el acceso de organizador en <Link href="/organizador">Organizadores</Link>. Un moderador revisa la solicitud. Después podrás crear tus veladas, montar el cartel y anotar los resultados, que quedan marcados como verificados.</p>

      <h2 id="respaldo">Qué significan las etiquetas de un combate</h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Qué significan las etiquetas de un combate">
<table>
        <tbody>
          <tr><th scope="row">Pendiente de confirmar</th><td>Lo ha registrado uno de los peleadores y su rival todavía no lo ha confirmado. Si tiene resultado, cuenta en el récord de quien lo registró, marcado como pendiente. No cuenta en el del rival hasta que lo confirme o se verifique.</td></tr>
          <tr><th scope="row">Confirmado por el rival</th><td>Los dos peleadores están de acuerdo.</td></tr>
          <tr><th scope="row">Verificado</th><td>Lo ha comprobado un moderador o lo ha publicado el organizador de la velada.</td></tr>
          <tr><th scope="row">En revisión</th><td>Alguien ha indicado que no es correcto. No cuenta en el récord hasta que se aclare.</td></tr>
          <tr><th scope="row">Declarado por el propio deportista</th><td>El récord anterior a usar Ring España lo indica el peleador y se desglosa aparte. Si declara victorias, derrotas y empates, se suman a la cifra principal; si solo declara el número de combates, ese total se muestra aparte. No supone una verificación.</td></tr>
          <tr><th scope="row">Evidencia</th><td>Alguien ha añadido un enlace para respaldar el combate. Puedes abrirlo y comprobar qué aporta; tener un enlace no verifica automáticamente el resultado.</td></tr>
          <tr><th scope="row">✓ Verificado (gimnasios y organizadores)</th><td>Un moderador ha comprobado que existen y son quienes dicen ser.</td></tr>
        </tbody>
      </table>
</div>

      <h2>Cómo cuidamos que los datos sean fiables</h2>
      <p>Mostramos cuánto respaldo tiene cada combate. Los resultados sin confirmar y el récord anterior declarado se identifican como tales. El aura está ligada a un combate concreto, se limita por usuario y solo pueden darla personas registradas con el correo confirmado. Los cambios importantes quedan registrados.</p>
      <p>El <Link href="/ranking">ránking de aura</Link> mide reconocimiento del público; no es una clasificación deportiva oficial ni cambia el resultado de un combate.</p>

      <h2>¿Has visto un error?</h2>
      <p>En la ficha de cualquier peleador encontrarás la opción <strong>«¿Hay un error? Avísanos»</strong>, disponible para usuarios registrados. Un moderador revisará tu aviso.</p>
    </>
  );
}
