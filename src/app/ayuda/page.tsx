import Link from "next/link";
import { AURA_POLICY, SCOPE_LABEL, SUPPORT_LABEL, SUPPORT_ORDER } from "../../lib/aura/trajectory";

export const metadata = { title: "¿Cómo funciona?" };

export default function Help() {
  return (
    <>
      <h1>¿Cómo funciona Ring España?</h1>
      <p>Ring España reúne a la comunidad de deportes de contacto de toda España: boxeo, jiu-jitsu, K-1, kickboxing, MMA y Muay Thai. Puedes consultar y compartir trayectorias amateur y profesionales, encontrar veladas, gimnasios y entrenadores, y reconocer las actuaciones que has visto. Elige tu disciplina y tu provincia para encontrar lo que te interesa.</p>
      <p className="mut">No necesitas una cuenta para consultar veladas, fichas y el ránking. Para dar aura, registrar combates o publicar sí es necesario registrarse.</p>

      <h2>Si eres aficionado</h2>
      <ol>
        <li><Link href="/registro">Crea tu cuenta</Link> y confirma tu correo electrónico.</li>
        <li>Busca a un peleador en <Link href="/peleadores">Peleadores</Link> o mira quién compite en <Link href="/veladas">Veladas</Link>.</li>
        <li>En la ficha del peleador, elige el combate que viste y pulsa <strong>«Dar aura»</strong>. El aura es tu forma de reconocer a un peleador que te ha impresionado. Puedes añadir un comentario e indicar si lo viste en directo.</li>
        <li>Los peleadores con más aura aparecen en el <Link href="/ranking">Ránking</Link>, ordenados dentro de la disciplina, nivel, división deportiva y peso del combate. Cambiar la categoría actual no mueve el aura recibida en combates anteriores.</li>
      </ol>
      <p className="mut">Solo se puede dar aura por un combate que ya se ha celebrado, una vez por combate y peleador, y no pueden darla quienes han participado en él. Si cambias de opinión, puedes quitar tu aura.</p>

      <h2>Si eres peleador</h2>
      <ol>
        <li><Link href="/registro">Crea tu cuenta</Link> eligiendo «Tener mi ficha de peleador» y confirma tu correo electrónico.</li>
        <li>Si alguien ya registró un combate tuyo, busca tu ficha y pide que pase a ser tuya. Si no aparece, crea una nueva.</li>
        <li>Elige tu disciplina, nivel, división deportiva (grupo de edad y categoría masculina o femenina) y peso. Cada reglamento tiene sus propias edades y pesos; puedes consultarlo junto al selector. Si no conoces la división, déjala sin confirmar. Si ya habías competido antes, indica cuántos combates llevas; si recuerdas tu récord, añádelo, y si no, con el número de combates basta. Puedes añadir más disciplinas cuando quieras.</li>
        <li>En <Link href="/mi-ficha">Mi ficha</Link>, registra tus combates. Añadir un acta, vídeo o publicación con el resultado ayuda a comprobarlo. Un cartel solo anuncia el combate.</li>
        <li>La confirmación del rival es opcional. Si discrepa, su aviso pide revisión a moderación; no elimina automáticamente el resultado ni su aura. Puedes declarar títulos anteriores desde «Mis títulos y mi aura», aunque aún no haya entrenadores ni federaciones en la aplicación.</li>
      </ol>

      <h2>Si organizas veladas</h2>
      <p>Solicita el acceso de organizador en <Link href="/organizador">Organizadores</Link>. Un moderador revisa la solicitud. Después podrás crear tus veladas, montar el cartel y anotar los resultados, que quedan marcados como verificados.</p>

      <h2 id="respaldo">Qué significan las etiquetas de un combate</h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Qué significan las etiquetas de un combate">
<table>
        <tbody>
          <tr><th scope="row">Declarado · confirmación opcional</th><td>Lo ha registrado uno de los peleadores. Si tiene resultado, se muestra como declarado en ambas fichas. Confirmarlo o aportar un respaldo es opcional.</td></tr>
          <tr><th scope="row">Confirmado por el rival</th><td>Los dos peleadores están de acuerdo.</td></tr>
          <tr><th scope="row">Verificado</th><td>Lo ha comprobado un moderador o lo ha publicado el organizador de la velada.</td></tr>
          <tr><th scope="row">En revisión</th><td>Moderación ha suspendido el resultado tras revisar un aviso. No cuenta en el récord ni en el aura hasta que se aclare. El aviso por sí solo no lo suspende.</td></tr>
          <tr><th scope="row">Declarado por el propio deportista</th><td>El récord anterior a usar Ring España lo indica el peleador y se desglosa aparte. Si declara victorias, derrotas y empates, se suman a la cifra principal; si solo declara el número de combates, ese total se muestra aparte. No supone una verificación.</td></tr>
          <tr><th scope="row">Evidencia</th><td>Alguien ha añadido un enlace para respaldar el combate. Puedes abrirlo y comprobar qué aporta; tener un enlace no verifica automáticamente el resultado.</td></tr>
          <tr><th scope="row">✓ Verificado (gimnasios y organizadores)</th><td>Un moderador ha comprobado que existen y son quienes dicen ser.</td></tr>
        </tbody>
      </table>
</div>

      <h2>Cómo cuidamos que los datos sean fiables</h2>
      <p>Mostramos cuánto respaldo tiene cada combate. Los resultados sin confirmar y el récord anterior declarado se identifican como tales. El aura está ligada a un combate concreto, se limita por usuario y solo pueden darla personas registradas con el correo confirmado. Los cambios importantes quedan registrados.</p>
      <p>El <Link href="/ranking">ránking de aura</Link> combina trayectoria, respaldo y reconocimiento de la comunidad. No es una clasificación deportiva oficial ni cambia el resultado de un combate.</p>

      <h2 id="aura">Cómo se calcula el aura</h2>
      <p>Aura = trayectoria + respaldo opcional + comunidad. Puedes participar y recibir aura sin títulos, entrenadores ni federaciones en la aplicación. Los títulos que declaras se identifican como tales; un respaldo acredita solo el hecho concreto.</p>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Puntos por títulos"><table><thead><tr><th>Título</th><th>Puntos declarados</th></tr></thead><tbody>{Object.entries(AURA_POLICY.titlePoints).map(([scope,points])=><tr key={scope}><th scope="row">{SCOPE_LABEL[scope as keyof typeof SCOPE_LABEL]}</th><td>{points}</td></tr>)}</tbody></table></div>
      <p>Se toma el título con mayor aporte de cada categoría, con la disciplina, nivel, división y peso que tenía en ese momento. Ganar varios títulos o repetir una declaración no multiplica ese aporte. Si no conocemos el reglamento histórico, la división queda sin confirmar.</p>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Bonificaciones por respaldo"><table><thead><tr><th>Respaldo del hecho</th><th>Bonificación del título</th><th>Puntos por combate</th></tr></thead><tbody>{SUPPORT_ORDER.map(kind=><tr key={kind}><th scope="row">{SUPPORT_LABEL[kind]}</th><td>{AURA_POLICY.supportPercent[kind]} %</td><td>{AURA_POLICY.boutSupportPoints[kind]}</td></tr>)}</tbody></table></div>
      <p>Por ejemplo, un título nacional declarado aporta 50 puntos; con documentación comprobada, 62; con entrenador u organizador acreditado, 75; con federación acreditada, 100. Al mejorar el respaldo se sustituye la bonificación anterior, no se suman todos los niveles. Los respaldos de combates tienen un máximo de {AURA_POLICY.maxBoutSupportPerCategory} puntos por categoría.</p>
      <p>Los reconocimientos de la comunidad añaden un punto cada uno. Nadie puede votar su propio combate ni concederse un respaldo. Los moderadores comprueban la identidad de quien respalda; un perfil que diga «federación» no concede permisos. Una declaración excluida por moderación deja de aportar; retirar una acreditación elimina sus bonificaciones. Corregir los datos requiere un respaldo nuevo.</p>
      <p>El récord cuenta los resultados y distingue declaraciones de resultados respaldados. La escala de aura es una versión inicial que se revisará con datos reales; no calcula automáticamente el nivel deportivo de una persona.</p>

      <h2>¿Has visto un error?</h2>
      <p>En la ficha de cualquier peleador encontrarás la opción <strong>«¿Hay un error? Avísanos»</strong>, disponible para usuarios registrados. Un moderador revisará tu aviso.</p>
    </>
  );
}
