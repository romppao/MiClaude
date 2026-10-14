import Link from "next/link";
import { LEGAL_ACTUALIZADO } from "../../lib/common/titular";

export const metadata = { title: "Cookies", description: "Las únicas cookies y datos que Lona guarda en tu dispositivo, y para qué." };

// Inventario real (comprobado en el código el 15-10-2026): src/lib/accounts/auth.ts, src/lib/accounts/google.ts,
// src/app/components/SelectorTema.tsx y RecordarCampos.tsx. Si se añade otra cookie o almacenamiento, actualizar esta tabla y docs/LEGAL.md.
const FILAS: [string, string, string, string][] = [
  ["session", "Cookie", "Mantener tu sesión iniciada. Sin ella no podrías entrar en tu cuenta.", "30 días o hasta que cierres sesión"],
  ["google_oidc", "Cookie", "Proteger el inicio de sesión con Google frente a suplantaciones. Solo existe si pulsas «Continuar con Google».", "10 minutos"],
  ["volver", "Cookie", "Devolverte a la página en la que estabas cuando confirmes tu correo.", "2 horas"],
  ["lona:tema", "Almacenamiento local", "Recordar si elegiste el tema claro u oscuro.", "Hasta que vuelvas a «Sistema» o borres los datos del navegador"],
  ["Borrador del formulario", "Almacenamiento de sesión", "No perder lo que escribiste en un formulario si hay un error al enviarlo.", "Se borra al cerrar la pestaña"],
];

export default function Cookies() {
  return (
    <>
      <h1>Cookies</h1>
      <p className="mut">Última actualización: {LEGAL_ACTUALIZADO}.</p>
      <p><strong>Lona no usa cookies de publicidad, de seguimiento ni de medición, ni propias ni de terceros.</strong> Solo guarda en tu dispositivo lo imprescindible para que la aplicación funcione o para recordar una preferencia que tú has elegido. Según la ley (art. 22.2 de la LSSI) y la guía de la Agencia Española de Protección de Datos, estas cookies no necesitan tu consentimiento. Por eso no te mostramos ningún aviso para aceptarlas.</p>

      <h2>Qué guardamos</h2>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th scope="col">Nombre</th><th scope="col">Tipo</th><th scope="col">Para qué</th><th scope="col">Cuánto dura</th></tr></thead>
          <tbody>{FILAS.map(([n, t, p, d]) => <tr key={n}><td><code>{n}</code></td><td>{t}</td><td>{p}</td><td>{d}</td></tr>)}</tbody>
        </table>
      </div>
      <p>Todas son propias: las pone Lona y no se comparten con nadie.</p>

      <h2>Servicios de terceros</h2>
      <p>El mapa de gimnasios se descarga de OpenFreeMap, que recibe la zona del mapa que estás mirando, pero no pone cookies. Si pulsas «Continuar con Google», pasas por la página de Google, que aplica su propia política de cookies.</p>

      <h2>Cómo borrarlas</h2>
      <p>Puedes borrarlas en cualquier momento desde la configuración de tu navegador. Si borras la cookie <code>session</code>, se cerrará tu sesión.</p>
      <p>Más información sobre tus datos en la <Link href="/privacidad">política de privacidad</Link>.</p>
    </>
  );
}
