import Link from "next/link";

export const metadata = { title: "Privacidad y tus datos", description: "Qué datos guarda Ring España, para qué, quién los ve, cuánto tiempo se conservan y cómo ejercer tus derechos." };

// La identidad del responsable y el contacto los define quien despliega la aplicación (variables de entorno); aquí no se inventa ninguno.
const responsable = process.env.RESPONSABLE_NOMBRE;
const contacto = process.env.CONTACT_EMAIL;

export default function Privacy() {
  return (
    <>
      <h1>Privacidad y tus datos</h1>
      <p className="mut">Explicado con palabras sencillas. Si algo no queda claro, escríbenos y te lo aclaramos.</p>

      {(responsable || contacto) && (
        <>
          <h2>Quién es el responsable</h2>
          <p>{responsable && <>El responsable de tus datos es <strong>{responsable}</strong>. </>}{contacto && <>Puedes escribirnos a <a href={`mailto:${contacto}`}>{contacto}</a>.</>}</p>
        </>
      )}

      <h2>Qué datos guardamos</h2>
      <ul>
        <li><strong>Tu cuenta:</strong> tu nombre, tu correo electrónico y tu contraseña. La contraseña no se guarda: solo se conserva una huella cifrada que no permite conocerla.</li>
        <li><strong>Tu ficha de peleador</strong> (solo si la creas): nombre, apellidos, alias, ciudad, provincia, gimnasio, medidas, guardia, presentación, disciplinas, tu récord anterior declarado y, si quieres, tu fecha de nacimiento (en público solo se enseña la edad).</li>
        <li><strong>Tu actividad:</strong> los combates que registras o confirmas, las auras y comentarios que das, los peleadores que sigues y los avisos que envías.</li>
        <li><strong>Datos técnicos mínimos:</strong> una cookie necesaria para mantener tu sesión iniciada y, durante 2 días como máximo, tu dirección de conexión, solo para frenar intentos repetidos de acceso. No usamos cookies de publicidad ni de medición.</li>
      </ul>

      <h2>Para qué los usamos</h2>
      <p>Para darte el servicio que has pedido al crear tu cuenta: mantener tu ficha y tu récord, permitirte dar aura y seguir a peleadores, enviarte los correos necesarios (confirmar tu correo, recuperar tu contraseña y, si no los desactivas, avisos de nuevos combates de los peleadores que sigues) y garantizar que los datos publicados son fiables y que la comunidad es segura.</p>

      <h2>Quién los ve</h2>
      <ul>
        <li><strong>Cualquier persona</strong> puede ver las fichas de peleadores, sus combates, su récord y su aura, y los comentarios que dejas al dar aura junto a tu nombre de pila y la inicial de tu primer apellido.</li>
        <li><strong>Nunca se muestra</strong> tu correo electrónico ni tu contraseña.</li>
        <li><strong>Las personas moderadoras</strong> ven tu correo electrónico solo para revisar avisos y solicitudes.</li>
        <li><strong>El proveedor de envío de correo</strong> recibe tu dirección y el mensaje solo para poder entregártelo.</li>
        <li>Si otra persona registra un combate contra ti y no tienes ficha, se crea una ficha provisional que solo enseña tu nombre y la inicial de tu apellido, y no sale en listados ni en buscadores hasta que la reclames o el combate se confirme.</li>
      </ul>

      <h2>Cuánto tiempo los conservamos</h2>
      <ul>
        <li>Tu cuenta y tu ficha, hasta que las elimines.</li>
        <li>Cuentas cuyo correo nunca se ha confirmado: se borran a los 30 días.</li>
        <li>Enlaces enviados por correo: caducan a la hora (recuperar contraseña) o a las 48 horas (confirmar correo).</li>
        <li>Solicitudes para reclamar una ficha: el texto con el que demuestras quién eres se borra en cuanto un moderador decide, y la solicitud a los 90 días.</li>
        <li>Avisos ya resueltos: 12 meses. Historial de cambios: 3 años.</li>
      </ul>

      <h2>Tus derechos y cómo ejercerlos</h2>
      <p>Puedes ejercerlos tú mismo, sin pedir permiso a nadie, desde tu cuenta:</p>
      <ul>
        <li><strong>Ver y descargar tus datos:</strong> <Link href="/mi-cuenta">Mi cuenta</Link> → «Descargar una copia de mis datos».</li>
        <li><strong>Corregirlos:</strong> tus datos personales en <Link href="/mi-cuenta">Mi cuenta</Link> y los de tu ficha en <Link href="/mi-ficha">Mi ficha</Link>.</li>
        <li><strong>Eliminarlos:</strong> <Link href="/mi-cuenta/eliminar">Mi cuenta → Eliminar mi cuenta</Link>. Si tu ficha tiene combates, se conservan porque forman parte del récord de tus rivales, pero tu ficha pasa a mostrarse como «Peleador anónimo» y se borran tus datos personales.</li>
        <li><strong>Dejar de recibir avisos por correo:</strong> desde el enlace de cualquier aviso o en Mi cuenta.</li>
      </ul>
      <p>Si no tienes cuenta y otra persona ha creado una ficha con tus datos, o si quieres ejercer cualquier otro derecho (oposición, limitación), {contacto ? <>escríbenos a <a href={`mailto:${contacto}`}>{contacto}</a></> : "avísanos desde el botón «¿Hay un error? Avísanos» de la ficha, con una cuenta verificada,"} y lo atenderemos. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la <a href="https://www.aepd.es" rel="noopener noreferrer">Agencia Española de Protección de Datos</a>.</p>
    </>
  );
}
