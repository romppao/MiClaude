import Link from "next/link";
import { LEGAL_ACTUALIZADO, titular } from "../../lib/common/titular";

export const metadata = { title: "Condiciones de uso", description: "Las reglas de Lona: qué puedes publicar, cómo moderamos, cómo avisar de un problema y cómo reclamar." };

// Condiciones generales preparadas para el Reglamento (UE) 2022/2065 de Servicios Digitales (arts. 14, 16, 17 y 20) y la LSSI.
// Borrador revisable por un abogado: docs/LEGAL.md.
export default function Condiciones() {
  const { contacto } = titular();
  const correo = contacto ? <a href={`mailto:${contacto}`}>{contacto}</a> : "el contacto del aviso legal";
  return (
    <>
      <h1>Condiciones de uso</h1>
      <p className="mut">Última actualización: {LEGAL_ACTUALIZADO}. Explicadas con palabras sencillas. Quién es el titular de Lona está en el <Link href="/aviso-legal">aviso legal</Link>.</p>

      <h2>1. Qué es Lona</h2>
      <p>Lona es una plataforma gratuita para la comunidad de deportes de contacto de España. Permite consultar y publicar fichas de peleadores, entrenadores y gimnasios, combates, récords, veladas y clases, y reconocer a los peleadores con aura. Para consultar no hace falta cuenta. Para publicar o participar, sí.</p>

      <h2>2. Tu cuenta</h2>
      <ul>
        <li>Al crear tu cuenta aceptas estas condiciones y la <Link href="/privacidad">política de privacidad</Link>.</li>
        <li>Da datos reales y mantenlos al día. Una persona, una cuenta. No te hagas pasar por otra persona, gimnasio u organización.</li>
        <li>Guarda tu contraseña. Lo que se haga con tu cuenta es responsabilidad tuya, salvo que nos avises de que alguien ha entrado sin tu permiso.</li>
        <li><strong>Menores:</strong> si tienes menos de 14 años, necesitas el permiso de tu madre, padre o tutor para usar Lona, y son ellos quienes deben crear o autorizar la cuenta.</li>
        <li>Puedes dejar Lona cuando quieras desde <Link href="/mi-cuenta/eliminar">Mi cuenta → Eliminar mi cuenta</Link>.</li>
      </ul>

      <h2>3. Lo que publicas</h2>
      <ul>
        <li><strong>Sigue siendo tuyo.</strong> Al publicar fotos, vídeos, enlaces, textos, combates o veladas nos das un permiso gratuito, no exclusivo y para todo el mundo para alojarlo, mostrarlo, adaptarlo al formato de la aplicación y compartirlo dentro de Lona y en enlaces que lleven a ella, mientras siga publicado. El permiso termina cuando lo borras o eliminas tu cuenta, salvo los combates, que se conservan de forma anónima porque forman parte del récord de tus rivales.</li>
        <li><strong>Solo lo que puedes publicar.</strong> Publica solo contenido propio o que tengas permiso para compartir. Si en una foto o vídeo salen otras personas, necesitas su permiso y, si son menores, el de sus padres o tutores.</li>
        <li><strong>Datos veraces.</strong> Los récords, resultados, pesos, títulos y graduaciones deben ser ciertos. Declarar datos falsos para subir en el ránking o perjudicar a otra persona está prohibido.</li>
      </ul>

      <h2>4. Lo que no está permitido</h2>
      <ul>
        <li>Insultar, acosar, amenazar o discriminar a nadie, también dentro y fuera de un combate.</li>
        <li>Publicar contenido ilegal, violento fuera del contexto deportivo, sexual, que muestre a menores sin permiso o que incite a hacerse daño.</li>
        <li>Publicar datos personales de otra persona sin su permiso: teléfono, dirección, documentos, etc.</li>
        <li>Vender, anunciar o promover sustancias dopantes o productos ilegales.</li>
        <li>Organizar o anunciar combates sin los permisos, el seguro y la asistencia médica que exija la ley, o con condiciones que pongan en riesgo a los participantes.</li>
        <li>Usar Lona para enviar publicidad no pedida, crear cuentas falsas, manipular el aura o el ránking, copiar los datos de forma automatizada o intentar saltarse la seguridad.</li>
        <li>Infringir derechos de autor, de marca o de imagen de terceros.</li>
      </ul>

      <h2 id="avisos">5. Cómo avisar de algo ilegal o que incumple estas normas</h2>
      <p>Cualquier persona puede avisarnos, tenga cuenta o no:</p>
      <ul>
        <li>Con o sin cuenta, desde el formulario <Link href="/avisar">Avisar de un contenido</Link> (también está al pie de cada página).</li>
        <li>Con cuenta, también desde el botón «¿Hay un error? Avísanos» de la ficha, del combate, del comentario o del vídeo.</li>
        <li>Con o sin cuenta, escribiendo a {correo}.</li>
      </ul>
      <p>Para poder actuar, indica en tu aviso:</p>
      <ul>
        <li>dónde está el contenido (el enlace);</li>
        <li>por qué crees que es ilegal o incumple estas normas;</li>
        <li>tu nombre y tu correo, salvo en los casos de abuso sexual infantil, que puedes denunciar sin identificarte;</li>
        <li>que lo que cuentas es cierto, a tu leal saber y entender.</li>
      </ul>
      <p>Te confirmaremos que lo hemos recibido y te diremos qué hemos decidido. Si un contenido hace pensar que hay un riesgo para la vida o la seguridad de alguien, lo comunicaremos a las autoridades.</p>

      <h2>6. Cómo moderamos</h2>
      <ul>
        <li>Personas moderadoras revisan los avisos, las solicitudes de reclamación de fichas y gimnasios, y los récords y veladas pasadas que necesitan autorización. No usamos sistemas automáticos para retirar contenido.</li>
        <li>Según la gravedad, podemos ocultar o retirar un contenido, marcar un dato como no verificado, limitar funciones o, en casos graves o repetidos, suspender o cerrar una cuenta.</li>
        <li>Cuando una decisión te afecte, te lo diremos con sus motivos: qué se ha hecho, por qué, en qué norma o en qué punto de estas condiciones se basa, y cómo puedes reclamar.</li>
        <li>Si alguien envía avisos falsos de forma reiterada, podemos dejar de atender sus avisos durante un tiempo, después de advertirle.</li>
      </ul>

      <h2>7. Si no estás de acuerdo con una decisión</h2>
      <p>Escribe a {correo} en los 6 meses siguientes, explicando por qué no estás de acuerdo. Una persona distinta de la que tomó la decisión la revisará y te responderá. Si tenías razón, la desharemos. También puedes acudir a un órgano de resolución extrajudicial certificado o a los tribunales.</p>

      <h2>8. Lona puede cambiar</h2>
      <p>Lona está en desarrollo y puede añadir, cambiar o retirar funciones. Si cambiamos estas condiciones de forma importante, te avisaremos con antelación razonable dentro de la aplicación o por correo. Si no estás de acuerdo, puedes eliminar tu cuenta.</p>

      <h2>9. Responsabilidad</h2>
      <p>Lo que publican los usuarios es responsabilidad de quien lo publica. Lona no organiza veladas, combates ni clases y no responde de ellos. Practicar deportes de contacto tiene riesgos. Lo explicamos con detalle en el <Link href="/aviso-legal">aviso legal</Link>.</p>

      <h2>10. Ley aplicable</h2>
      <p>Estas condiciones se rigen por la ley española. Si eres consumidor, son competentes los juzgados de tu domicilio.</p>
    </>
  );
}
