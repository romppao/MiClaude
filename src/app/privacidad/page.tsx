import Link from "next/link";
import { LEGAL_ACTUALIZADO, titular } from "../../lib/common/titular";

export const metadata = { title: "Privacidad y tus datos", description: "Qué datos guarda Lona, para qué, quién los ve, cuánto tiempo se conservan y cómo ejercer tus derechos." };

// La identidad del responsable y el contacto los define quien despliega la aplicación (variables de entorno); aquí no se inventa ninguno.
// Información del art. 13 RGPD; borrador revisable por un abogado (docs/LEGAL.md).
export default function Privacy() {
  const t = titular();
  const responsable = t.nombre;
  const contacto = t.contacto;
  return (
    <>
      <h1>Privacidad y tus datos</h1>
      <p className="mut">Última actualización: {LEGAL_ACTUALIZADO}. Explicado con palabras sencillas. {contacto ? "Si algo no queda claro, escríbenos y te lo aclaramos." : "Si algo no queda claro, consulta «¿Cómo funciona?» o avísanos desde el botón «¿Hay un error? Avísanos» de cualquier ficha."}</p>
      <p className="notice notice-info">Las fotos, banners y graduaciones que publiques forman parte de tu perfil público. Las imágenes se optimizan y se retiran sus metadatos. Puedes cambiarlas o quitarlas; al borrar tu cuenta se retiran tus imágenes. Moderación puede autorizar a titulares de gimnasios, entrenadores y federaciones a gestionar esos perfiles.</p>
      <p className="notice notice-info">Si eres peleador, tus highlights (enlaces a vídeos y fotos que publicas) son públicos en tu ficha y puedes retirarlos cuando quieras; en amateur, tu récord completo solo se muestra si lo activas. Si eres entrenador, tu perfil y tus clases son públicos. Todo ello se incluye en la descarga de tus datos y se borra al eliminar tu cuenta.</p>

      {(responsable || contacto) && (
        <>
          <h2>Quién es el responsable</h2>
          <p>{responsable && <>El responsable de tus datos es <strong>{responsable}</strong>{t.nif && <>, con NIF {t.nif}</>}{t.domicilio && <> y domicilio en {t.domicilio}</>}. </>}{contacto && <>Puedes escribirnos a <a href={`mailto:${contacto}`}>{contacto}</a>.</>} Más datos en el <Link href="/aviso-legal">aviso legal</Link>. Lona no tiene obligación de nombrar un delegado de protección de datos; para cualquier cuestión sobre tus datos, usa este mismo contacto.</p>

        </>
      )}

      <p>Los vídeos enlazados desde otras páginas web se abren allí cuando pulsas el enlace; no se reproducen incrustados en Lona. Al salir, se aplica la política de privacidad de esa página, que puede usar sus propias cookies.</p>

      <h2>Qué datos guardamos</h2>
      <ul>
        <li><strong>Tu cuenta:</strong> tu nombre, tu correo electrónico y tu contraseña. La contraseña no se guarda: solo se conserva una huella cifrada que no permite conocerla.</li>
        <li><strong>Tu ficha de peleador</strong> (solo si la creas): nombre, apellidos, alias, ciudad, provincia, gimnasio, medidas, guardia, presentación, disciplinas, las divisiones deportivas y pesos que declaras (grupo de edad y categoría masculina o femenina), tu récord anterior declarado y, si quieres, tu fecha de nacimiento (en público solo se enseña la edad).</li>
        <li><strong>Trayectoria y respaldos:</strong> los títulos que declaras, sus categorías históricas y fuentes, las solicitudes de revisión y, cuando corresponda, tu acreditación para respaldar hechos de otras personas.</li>
        <li><strong>Tu actividad:</strong> los combates que registras o confirmas, las auras y comentarios que das, los peleadores que sigues, las personas que bloqueas y los avisos que envías.</li>
        <li><strong>Si avisas de un contenido sin tener cuenta</strong> (<Link href="/avisar">Avisar de un contenido</Link>): tu nombre, tu correo y lo que nos cuentas, solo para tramitar el aviso y comunicarte la decisión.</li>
        <li><strong>Datos técnicos mínimos:</strong> una cookie necesaria para mantener tu sesión iniciada (detalle en <Link href="/cookies">Cookies</Link>) y, durante 2 días como máximo, tu dirección de conexión, solo para frenar intentos repetidos de acceso. No usamos cookies de publicidad ni de medición.</li>
      </ul>

      <h2>Gimnasios y datos profesionales</h2>
      <p>El directorio publica datos profesionales del negocio aportados por su responsable, por moderación o procedentes de OpenStreetMap. Los datos importados conservan su origen y la atribución ODbL. No se publican automáticamente contactos que parezcan personales. Puedes pedir corrección o retirada desde la ficha o escribiendo al contacto de esta página. La prueba para reclamar un gimnasio solo la ven quien la aporta y moderación: no pedimos DNI. Se vacía al decidir y las solicitudes decididas se conservan como máximo 90 días. Los gimnasios ficticios se identifican en la demo y no se publican en la versión real.</p>
      <h2>Provincia, asistencia y disponibilidad</h2>
      <p>La provincia de tu cuenta es opcional y sirve para mostrar actividad cerca de ti. Las veladas que marcas con «Voy a ir» aparecen en tu agenda; el público solo ve cuántas personas han marcado su asistencia, nunca sus nombres. Puedes quitar la marca. Si activas «Disponible para pelear», tu disponibilidad y el peso que quieras declarar se muestran durante 60 días y puedes retirarlos cuando quieras. Todo ello figura en tu descarga de datos; la asistencia se borra con tu cuenta.</p>
      <h2>Para qué los usamos</h2>
      <p>Para darte el servicio que has pedido al crear tu cuenta: mantener tu ficha y tu récord, permitirte dar aura y seguir a peleadores, enviarte los correos necesarios (confirmar tu correo, recuperar tu contraseña y, si no los desactivas, avisos de nuevos combates de los peleadores que sigues) y garantizar que los datos publicados son fiables y que la comunidad es segura.</p>

      <h2>Con qué base legal</h2>
      <ul>
        <li><strong>Para darte el servicio</strong> (tu cuenta, tu ficha, tus combates, el aura, los avisos y los correos necesarios): porque lo has pedido al registrarte y aceptar las <Link href="/condiciones">condiciones de uso</Link> (art. 6.1.b del RGPD).</li>
        <li><strong>Para que los datos publicados sean fiables y la comunidad sea segura</strong> (moderación, frenar intentos repetidos de acceso, historial de cambios y fichas provisionales creadas al registrar un combate): por nuestro interés legítimo y el de la comunidad (art. 6.1.f). Puedes oponerte escribiéndonos.</li>
        <li><strong>Para lo que es opcional</strong> (fecha de nacimiento, mostrar tu récord amateur completo, avisos de nuevos combates y entrar con Google): porque tú lo eliges, y puedes cambiarlo cuando quieras (art. 6.1.a).</li>
        <li><strong>Para cumplir la ley</strong>, por ejemplo al responder a una autoridad o atender un aviso de contenido ilícito (art. 6.1.c).</li>
      </ul>
      <p>Para crear una cuenta solo son obligatorios tu nombre, tu correo y una contraseña. Sin ellos no podemos darte el servicio. Lo demás es voluntario.</p>
      <p>No tomamos decisiones automatizadas que te produzcan efectos jurídicos ni te afecten de forma importante. El aura, los rangos y el ránking solo ordenan a los peleadores con lo que la comunidad declara y confirma.</p>

      <h2>Quién los ve</h2>
      <ul>
        <li><strong>Cualquier persona</strong> puede ver las fichas de peleadores, sus divisiones deportivas declaradas, los pesos y divisiones de sus combates, su récord y su aura, y los comentarios que dejas al dar aura junto a tu nombre de pila y la inicial de tu primer apellido.</li>
        <li>Los títulos activos y su fuente se muestran en tu ficha pública. Las notas de revisión las ven moderación y las personas acreditadas para esa disciplina; tu correo electrónico sigue siendo privado. Al eliminar tu cuenta se retiran tus títulos y acreditación, y sus datos personales del historial.</li>
        <li><strong>Nunca se muestra</strong> tu correo electrónico ni tu contraseña.</li>
        <li><strong>Las personas moderadoras</strong> ven tu correo electrónico solo para revisar avisos y solicitudes.</li>
        <li><strong>El proveedor de envío de correo</strong> recibe tu dirección y el mensaje solo para poder entregártelo.</li>
        <li><strong>El mapa de gimnasios</strong> se descarga del servicio libre OpenFreeMap (datos de OpenStreetMap), que solo recibe qué zona del mapa estás mirando. Si pulsas «Usar mi ubicación», tu ubicación se usa en tu propio dispositivo para ordenar los gimnasios por distancia: no se envía a Lona ni se guarda. Para colocar los gimnasios en el mapa se busca su dirección pública en OpenStreetMap.</li>
        <li><strong>Si entras con Google</strong>, Google nos confirma tu nombre, tu correo electrónico y un identificador de tu cuenta de Google. No recibimos tu contraseña de Google ni pedimos acceso a nada más (ni contactos, ni correo, ni archivos). Usamos esos datos solo para crear tu cuenta o entrar en ella.</li>
        <li>Si otra persona registra un combate contra ti y no tienes ficha, se crea una ficha provisional que solo enseña tu nombre y la inicial de tu apellido, y no sale en listados ni en buscadores hasta que la reclames o el combate se confirme.</li>
      </ul>

      <h2>Proveedores que nos ayudan</h2>
      <p>Para funcionar usamos empresas que tratan datos solo siguiendo nuestras instrucciones y con un contrato de encargo de tratamiento:</p>
      <ul>
        <li><strong>Alojamiento de la aplicación:</strong> Google Cloud (servidores en Bélgica, Unión Europea).</li>
        <li><strong>Base de datos:</strong> Neon (servidores de Amazon Web Services en Fráncfort, Unión Europea).</li>
        <li><strong>Almacenamiento de vídeos y copias de seguridad:</strong> Cloudflare R2, con los datos guardados en la Unión Europea.</li>
        <li><strong>Envío de correos:</strong> Resend.</li>
        <li><strong>Buzón de contacto:</strong> Infomaniak (Suiza, país con un nivel de protección reconocido por la Comisión Europea).</li>
        <li><strong>Copias de seguridad automáticas:</strong> se generan con GitHub Actions, que no las guarda.</li>
      </ul>
      <p>Algunas de estas empresas, o sus proveedores, tienen sede en Estados Unidos. Si alguna transfiere datos fuera del Espacio Económico Europeo, lo hace con las garantías que exige el RGPD: el Marco de Privacidad de Datos UE-EE. UU. o las cláusulas contractuales tipo de la Comisión Europea. Puedes pedirnos más información.</p>
      <p>No vendemos tus datos ni los usamos para publicidad. Solo los comunicaremos a una autoridad cuando la ley nos obligue.</p>

      <h2>Menores de edad</h2>
      <p>En España, a partir de los 14 años puedes dar tu consentimiento para usar Lona. Si tienes menos de 14 años, es tu madre, padre o tutor quien debe autorizarlo. Si eres madre, padre o tutor y crees que un menor usa Lona sin tu permiso, o aparece en una ficha, foto o vídeo, escríbenos y lo retiraremos.</p>

      <h2>Cuánto tiempo los conservamos</h2>
      <p>Los avisos de tu campanita solo los ves tú. Te informan sobre actividad relacionada con tu cuenta; son independientes de la preferencia de correo y no son mensajes comerciales. Puedes marcarlos como leídos y descargarlos con tus datos.</p>
      <ul>
        <li>Tu cuenta y tu ficha, hasta que las elimines.</li>
        <li>Cuentas cuyo correo nunca se ha confirmado: se borran a los 30 días.</li>
        <li>Enlaces enviados por correo: caducan a la hora (recuperar contraseña) o a las 48 horas (confirmar correo).</li>
        <li>Solicitudes para reclamar una ficha: el texto con el que demuestras quién eres se borra en cuanto un moderador decide, y la solicitud a los 90 días.</li>
        <li>Avisos ya resueltos: 12 meses. Historial de cambios: 3 años.</li>
        <li>Correos que te enviamos: se guardan hasta entregarlos, para reintentarlo si falla el envío; una vez enviados se borra su contenido y a los 30 días, el registro.</li>
        <li>Avisos de la campanita: 12 meses desde su creación. Después dejan de mostrarse y se eliminan en la limpieza periódica; al eliminar tu cuenta también se borran.</li>
      </ul>

      <p>Si añades a tus highlights un vídeo público de tu combate, se mantiene una referencia al vídeo original y se avisa a quien lo compartió. Si el original se retira, se oculta o su velada deja de ser pública, también deja de verse en tus highlights. Quitar esa referencia de tu ficha no borra el vídeo de otra persona.</p>

      <h2>Tus derechos y cómo ejercerlos</h2>
      <p>Puedes ejercerlos tú mismo, sin pedir permiso a nadie, desde tu cuenta:</p>
      <ul>
        <li><strong>Ver y descargar tus datos:</strong> <Link href="/mi-cuenta">Mi cuenta</Link> → «Descargar una copia de mis datos».</li>
        <li><strong>Corregirlos:</strong> tus datos personales en <Link href="/mi-cuenta">Mi cuenta</Link> y los de tu ficha en <Link href="/mi-ficha">Mi ficha</Link>.</li>
        <li><strong>Eliminarlos:</strong> <Link href="/mi-cuenta/eliminar">Mi cuenta → Eliminar mi cuenta</Link>. Si tu ficha tiene combates, se conservan porque forman parte del récord de tus rivales, pero tu ficha pasa a mostrarse como «Peleador anónimo» y se borran tus datos personales.</li>
        <li><strong>Dejar de recibir avisos por correo:</strong> desde el enlace de cualquier aviso o en Mi cuenta.</li>
      </ul>
      <p>Si no tienes cuenta y otra persona ha creado una ficha con tus datos, o si quieres ejercer cualquier otro derecho (oposición, limitación), {contacto ? <>escríbenos a <a href={`mailto:${contacto}`}>{contacto}</a></> : "avísanos desde el botón «¿Hay un error? Avísanos» de la ficha, con una cuenta verificada,"} y lo atenderemos en el plazo de un mes. También puedes pedir la portabilidad de tus datos y retirar en cualquier momento los consentimientos que nos hayas dado. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la <a href="https://www.aepd.es" rel="noopener noreferrer">Agencia Española de Protección de Datos</a>.</p>
    </>
  );
}
