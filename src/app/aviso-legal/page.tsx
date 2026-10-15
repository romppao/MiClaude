import Link from "next/link";
import { LEGAL_ACTUALIZADO, titular } from "../../lib/common/titular";

export const metadata = { title: "Aviso legal", description: "Quién está detrás de Lona, cómo contactar y de qué responde Lona y de qué no." };

// Texto preparado para la Ley 34/2002 (LSSI), art. 10, y revisable por un abogado (docs/LEGAL.md). Los datos del titular vienen de variables de entorno.
export default function AvisoLegal() {
  const t = titular();
  return (
    <>
      <h1>Aviso legal</h1>
      <p className="mut">Última actualización: {LEGAL_ACTUALIZADO}.</p>

      <h2>Quién está detrás de Lona</h2>
      <ul>
        <li><strong>Titular:</strong> {t.nombre ?? "pendiente de publicar"}</li>
        {t.nif && <li><strong>NIF:</strong> {t.nif}</li>}
        {t.domicilio && <li><strong>Domicilio:</strong> {t.domicilio}</li>}
        {t.registro && <li><strong>Datos registrales:</strong> {t.registro}</li>}
        {t.contacto && <li><strong>Correo electrónico:</strong> <a href={`mailto:${t.contacto}`}>{t.contacto}</a></li>}
        <li><strong>Sitio web:</strong> lonaclub.es</li>
      </ul>
      <p>Lona es una plataforma en línea gratuita en la que la comunidad de deportes de contacto de España publica fichas, combates, veladas, gimnasios y clases. El uso de Lona se rige por este aviso, por las <Link href="/condiciones">condiciones de uso</Link>, por la <Link href="/privacidad">política de privacidad</Link> y por la <Link href="/cookies">política de cookies</Link>.</p>

      <h2>De qué responde Lona y de qué no</h2>
      <p>Queremos ser claros sobre lo que Lona puede y no puede garantizar:</p>
      <ul>
        <li><strong>Lo publican los usuarios.</strong> Las fichas, récords, resultados, veladas, gimnasios, clases, comentarios, fotos y enlaces los publican los propios usuarios, gimnasios y organizadores. Lona los aloja, pero no los crea ni los comprueba uno a uno antes de publicarlos. Cada persona responde de lo que publica.</li>
        <li><strong>Los datos deportivos son orientativos.</strong> Los récords, el aura, los rangos y el ránking se calculan con lo que declaran y confirman los usuarios. No son datos oficiales de ninguna federación ni sustituyen a sus registros. Lo verificado se marca como tal.</li>
        <li><strong>Lona no organiza veladas ni da clases.</strong> Las veladas, combates, sparrings, clases y entrenamientos que se anuncian en Lona los organizan terceros, bajo su propia responsabilidad. Lona no es parte de esos acuerdos, no cobra por ellos y no responde de cómo se desarrollan, de sus licencias, permisos, seguros ni medidas sanitarias.</li>
        <li><strong>Los deportes de contacto tienen riesgo.</strong> Practicarlos puede causar lesiones. Antes de entrenar o competir, consulta con un médico, entrena con personas cualificadas y comprueba que la actividad cuenta con los permisos, el seguro y la asistencia médica que exige la normativa. Nada de lo publicado en Lona es consejo médico, deportivo ni de nutrición, incluidos los pesos y las categorías.</li>
        <li><strong>Enlaces a otros sitios.</strong> Lona enlaza a vídeos, noticias, redes sociales y webs de terceros. No controlamos esos sitios y no respondemos de su contenido.</li>
        <li><strong>Funcionamiento.</strong> Hacemos lo posible para que Lona funcione siempre y sin errores, pero puede haber interrupciones por mantenimiento, fallos técnicos o causas ajenas. Lona es gratuita y se ofrece tal como está, sin garantía de disponibilidad continua.</li>
      </ul>
      <p>Cuando tengamos conocimiento efectivo de que algo publicado es ilícito o vulnera derechos de terceros, lo retiraremos o bloquearemos con diligencia, como establecen el artículo 16 de la LSSI y el Reglamento de Servicios Digitales. Si tienes cuenta, puedes avisarnos con el botón «¿Hay un error? Avísanos» de la ficha{t.contacto ? <>. Con o sin cuenta, también puedes escribir a <a href={`mailto:${t.contacto}`}>{t.contacto}</a></> : null}. Las <Link href="/condiciones#avisos">condiciones de uso</Link> explican qué incluir en el aviso.</p>
      <p>Nada de este aviso limita la responsabilidad que la ley no permite limitar, como la derivada de dolo o culpa grave, ni los derechos que te reconoce la normativa de consumidores.</p>

      <h2>Propiedad intelectual</h2>
      <p>El nombre Lona, su logotipo, el diseño y el código de la aplicación pertenecen a su titular. Lo que publican los usuarios sigue siendo suyo; las <Link href="/condiciones">condiciones de uso</Link> explican qué permiso nos dan para mostrarlo. El mapa usa datos de © colaboradores de OpenStreetMap, con licencia ODbL.</p>

      <h2>Ley aplicable</h2>
      <p>Este aviso se rige por la ley española. Si eres consumidor, para cualquier conflicto serán competentes los juzgados de tu domicilio. También puedes acudir a los sistemas de resolución extrajudicial de conflictos de consumo.</p>
    </>
  );
}
