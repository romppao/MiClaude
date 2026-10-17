# Cómo funciona la versión real de Lona (explicado sin tecnicismos)

> Escrito el 17-10-2026 a petición del fundador: «hazlo tú todo automáticamente y documéntalo para que me entere de todo el funcionamiento». El detalle técnico, para quien programe, está en [PRODUCCION.md](PRODUCCION.md).

## En una frase

La **versión real** es la aplicación que usará la gente de verdad. Vive en Google y empieza **vacía**. La **demo** (Render) sigue aparte, con datos de ejemplo, para enseñar y probar. Nada de la demo pasa a la versión real.

## Las piezas y para qué sirve cada una

| Pieza | Dónde está | Para qué sirve | Coste |
|---|---|---|---|
| **La web** | Google Cloud Run, en Bélgica (proyecto `lona-511614`, cuenta info@lonaclub.es) | Es la aplicación que se ve en el navegador | Gratis con poco uso. Se apaga sola cuando nadie la usa y se enciende en segundos |
| **La base de datos** | Neon, en Fráncfort (proyecto `lona-produccion`, organización «Lona Club») | Guarda cuentas, peleadores, veladas… | Gratis (plan gratuito) |
| **El correo** | Resend, región UE, dominio lonaclub.es (verificado) | Envía los correos de la app (confirmar cuenta, avisos) desde avisos@lonaclub.es | Gratis hasta 100 correos al día |
| **«Entrar con Google»** | Google, cliente «Lona web» | Permite registrarse con la cuenta de Google. Pantalla publicada («En producción») | Gratis |
| **Las claves** | Google Secret Manager (y 2 en GitHub) | Contraseñas que la app necesita. Nadie las ve: se copiaron con el botón de cada web | Gratis o céntimos (ver abajo) |
| **El código** | GitHub, `romppao/MiClaude` | Donde se guarda la app y se prueba cada cambio | Gratis |
| **Las fotos y vídeos** | Cloudflare R2 (**pendiente de activar**) | Guardar fotos fuera de la base de datos | Gratis hasta 10 GB. Activarlo exige aceptar una suscripción (0 €) |
| **La demo** | Render (`ring-espana-demo`) | Enseñar y probar con datos ficticios | Gratis |
| **El despertador de la demo** | Google Cloud Scheduler, trabajo `despertar-demo` | Visita la demo cada 10 minutos para que no se duerma | Gratis (3 trabajos por cuenta) |

## Cómo llega una mejora a la versión real

1. **Un asistente prepara el cambio** en un PR (una propuesta de cambio en GitHub).
2. **GitHub lo prueba solo:** tipos, cientos de pruebas y recorridos en un navegador real. Tarda unos 25 minutos.
3. **Tú lo fusionas** con `gh pr merge NÚMERO --merge`. Nada entra sin tu «sí».
4. **La demo se actualiza sola** a los pocos minutos.
5. **La versión real no cambia sola.** Cuando quieras publicar, lanzas la publicación con este comando (o con el botón «Run workflow» en GitHub → Actions → «Desplegar la versión real»):
   `gh workflow run desplegar-produccion.yml --ref claude/ring-espana-mvp -f ref=claude/ring-espana-mvp`
6. **La publicación hace sola el resto** (unos 10 minutos):
   - comprueba que las claves imprescindibles existen;
   - crea la «imagen» de la app;
   - prepara la base de datos;
   - publica;
   - comprueba que la app responde.
7. **Si algo falla, la versión anterior sigue funcionando.** Nada se rompe a medias.

**Por qué la publicación la lanzas tú:** el sistema de seguridad de Claude no le deja publicar en producción. Es una protección a propósito: tú decides cuándo cambia la versión real.

## Las claves: dónde están y la regla de oro

- **Regla de oro:** una clave nunca se escribe en el chat, en un documento ni en una captura. Si alguna se ve por error, se borra y se crea otra. Así se hizo el 17-10 con un secreto de Google que apareció en la salida de una herramienta.
- **En Google (Secret Manager):** `DATABASE_URL` (base de datos), `RESEND_API_KEY` (correo, solo puede enviar y solo desde lonaclub.es), `GOOGLE_CLIENT_SECRET` (entrar con Google), `CREADOR_CORREO` (tu cuenta de creador: rompaoondo@gmail.com) y `CRON_SECRET` (tareas automáticas). Las 4 de R2 están creadas pero vacías.
- **En GitHub (secretos generales):** `PROD_DATABASE_URL_DIRECT` (la base de datos, para prepararla al publicar) y `PROD_CRON_SECRET`.
- **Cómo se guardaron sin verlas:**
  1. Se pulsó el botón «Copiar» de cada web.
  2. El ordenador pasó la clave directamente del portapapeles a Google o GitHub.
  3. Después se vació el portapapeles.
- **Quién puede leerlas:** la app (con su propia cuenta, `lona-web`) solo lee las suyas. La cuenta que publica (`desplegar-lona`) solo ve **si existen**, nunca su contenido.

## Cuánto cuesta y cómo se vigila

- **Objetivo del fundador:** «todo gratis o un máximo de 10 €».
- **Alerta de presupuesto** «Lona 10 EUR» en Google: te avisa por correo al llegar a 5 €, 9 € y 10 €. Es un aviso, no un corte. El freno real:
  - la web tiene como máximo 2 copias encendidas;
  - se apaga sin visitas.
- **Google regala crédito de prueba** (quedaban 264 € y 90 días el 17-10). Mientras dure, cualquier gasto pequeño sale de ahí.
- **Secret Manager** tiene un cupo gratuito. Cuando se rellenen las 4 claves de R2 podría costar unos céntimos al mes: compruébalo en la factura.
- **GitHub:** mientras el repositorio sea **público**, los minutos de pruebas son gratis e ilimitados. En **privado** hay 2.000 minutos gratis al mes. Cada ronda de pruebas gasta unos 25, así que caben unas 70 al mes.

## Repositorio privado: qué se ha preparado (17-10-2026)

Decidiste el 13-10 que el código fuese privado. Antes de cambiarlo se ha dejado todo listo para que no se rompa nada:

1. **La demo ya no se mantiene despierta desde GitHub** (gastaba unos 4.300 minutos al mes, más de los 2.000 gratis). Ahora lo hace Google Cloud Scheduler, gratis.
2. **Las 2 claves de GitHub** pasaron del entorno «produccion» a los secretos generales. Los repositorios privados gratuitos no tienen entornos.
3. **La publicación ya no pide el paso de aprobación de GitHub,** que en privado gratuito no existe. Sigue siendo manual: solo tú puedes lanzarla.

**Cómo ponerlo en privado (lo haces tú):**
1. GitHub → repositorio `MiClaude` → **Settings**.
2. Abajo del todo, «Danger Zone» → **Change visibility** → **Make private**.
3. Confirma.

Se puede volver a público cuando quieras.

## Lo que falta

1. **Que la publicación salga bien** con el arreglo del PR #110: la primera falló porque un archivo del código estaba en la carpeta de documentos, que no entra en la versión real.
2. **El dominio:** que lonaclub.es abra la versión real en vez de la demo. Supone:
   - verificar el dominio en Google;
   - cambiar registros en Infomaniak, con tu permiso y siguiendo [DOMINIO.md](DOMINIO.md);
   - quitarlo de Render.
3. **Cloudflare R2** para las fotos, cuando haya usuarios: aceptar la suscripción de 0 €.
4. **Revisión del abogado** ([LEGAL.md](LEGAL.md)): textos legales, menores y logotipos de gimnasios.
5. **Datos del aviso legal** (nombre, NIF, domicilio): se ponen como variables en GitHub cuando decidas qué figura.

## Si algo va mal

| Lo que ves | Qué significa | Qué hacer |
|---|---|---|
| La web tarda unos segundos la primera vez | Estaba apagada por no tener visitas (normal en el plan gratuito) | Nada |
| La publicación sale en rojo en GitHub | Algo no compiló o no respondió | La versión anterior sigue funcionando. Pásale el enlace a Claude |
| No llegan los correos de la app | Falta o caducó la clave de Resend, o se agotaron los 100 del día | Revisar en Resend → Logs. Se reenvían al día siguiente |
| «Entrar con Google» da error | La dirección de la web no coincide con la autorizada en Google | Pasa cuando el dominio aún no apunta a la versión real |
| Te llega la alerta de presupuesto | Algo está gastando | Avisa a Claude; no se cobra hasta agotar el crédito de prueba |
| La demo tarda en abrir | Falló el despertador | Google Cloud → Cloud Scheduler → `despertar-demo` → «Forzar ejecución» |
