# Versión real de Lona (producción)

Decisión y motivos: [ADR-005](decisiones/ADR-005-alojamiento-cloud-run.md).

**Las claves nunca se escriben en el chat, en el código ni en documentos.** Se pegan directamente en Secret Manager o en los secretos de GitHub.

## Piezas

| Pieza | Dónde | Notas |
|---|---|---|
| Web | Cloud Run, servicio `lona`, `europe-west1`, proyecto `lona-511614` | Imagen del `Dockerfile` (salida *standalone*). |
| Base | Neon, proyecto `lona-produccion` (Fráncfort) | Conexión *pooled* para la app y directa para las migraciones y las copias. |
| Copias | R2, cubo de copias con jurisdicción UE | `.github/workflows/copia-diaria.yml`, a las 02:30 UTC. Se conservan 30 días. |
| Correo | Resend, dominio lonaclub.es | Remitente `Lona <avisos@lonaclub.es>`; las respuestas van a info@lonaclub.es. |
| Dominio | lonaclub.es y www (Infomaniak) | Asignación de dominio de Cloud Run. |

## Variables del servicio Cloud Run

**Públicas** (variables normales):

| Variable | Valor |
|---|---|
| `APP_URL` | `https://lonaclub.es` |
| `MAIL_FROM` | `Lona <avisos@lonaclub.es>` |
| `CONTACT_EMAIL` | `info@lonaclub.es` |
| `RESPONSABLE_NOMBRE` | Nombre del responsable del tratamiento |
| `GOOGLE_CLIENT_ID` | El ID de cliente de Google |
| `TRUSTED_PROXY_HOPS` | `1` (comprobarlo con la primera petición real: la IP debe ser la del visitante) |

**Secretas** (Secret Manager, montadas como variables): `DATABASE_URL` (*pooled*), `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `CREADOR_CORREO`, `SENTRY_DSN` (avisos de fallos, región UE), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` y `R2_BUCKET` (más la variable normal `R2_JURISDICCION=eu`). Desde la 0.16.1, **R2 guarda también las fotos** (perfiles, highlights y fotos del público) en la carpeta `fotos/` del mismo cubo que los vídeos; sin estas variables las fotos se guardan dentro de la base de datos, y la base gratuita de Neon (0,5 GB) se llenaría con unos miles de fotos. No poner `FOTOS_EN_DISCO`: es solo para pruebas.

**Nunca:** `DEMO_MODE` ni `MAIL_TRANSPORT=log`.

## Puesta en marcha (una sola vez)
0. **Separar ya lonaclub.es de la demo** (petición del fundador, 15-10-2026: «quiero separar la aplicación web de la demo de render… ya»). Hasta que la versión real esté montada, lonaclub.es no debe enseñar la demo:
   - **Seguir [`DOMINIO.md`](DOMINIO.md), sección 3, al pie de la letra** (orden seguro, cómo comprobarlo y cómo deshacerlo). Resumen:
   - primero Infomaniak → zona DNS de lonaclub.es → borrar el registro A `216.24.57.1` y el CNAME `www → ring-espana-demo.onrender.com`;
   - después Render → servicio `ring-espana-demo` → Settings → Custom Domains → borrar `lonaclub.es` y `www.lonaclub.es` (al revés quedaría un rato el dominio apuntando a un servicio que no lo reclama);
   - **no tocar** MX, SPF, `_dmarc` ni los TXT de verificación (Google, Search Console): el buzón info@ sigue funcionando.
   - La demo sigue en https://ring-espana-demo.onrender.com/ y, desde la 0.15.1, pide a los buscadores que no la muestren (`noindex` y sin mapa del sitio).
1. **Proyecto y facturación.**
   - Vincular `lona-511614` (cuenta info@lonaclub.es) a la cuenta de facturación y poner una alerta de presupuesto de 1 €.
   - Activar Cloud Run, Artifact Registry, Secret Manager e IAM Credentials.
2. **Repositorio de imágenes:** Artifact Registry `lona` (Docker) en `europe-west1`.
3. **Cuenta de servicio para desplegar** (`desplegar-lona@…`), con los roles:
   - Cloud Run Admin;
   - Artifact Registry Writer;
   - Service Account User sobre la cuenta de ejecución.
4. **Workload Identity Federation para GitHub**, limitado al repositorio `romppao/MiClaude`.
   - Variables del repositorio: `GCP_PROJECT_ID`, `GCP_REGION=europe-west1`, `GCP_WIF_PROVIDER` y `GCP_DEPLOY_SA`.
   - Entorno de GitHub `produccion` con aprobación del fundador.
5. **Secretos de GitHub:**
   - `PROD_DATABASE_URL_DIRECT`;
   - los cuatro `BACKUP_R2_*`;
   - `PROD_CRON_SECRET`;
   - variable `PROD_URL=https://lonaclub.es`.
6. **Primer despliegue:** Actions → «Desplegar la versión real (Cloud Run)» → elegir la etiqueta. Después, añadir las variables y los secretos del servicio, y volver a desplegar.
7. **Dominio:**
   - verificar lonaclub.es en Search Console (registro TXT);
   - Cloud Run → «Gestionar dominios personalizados» → lonaclub.es y www;
   - poner en Infomaniak los registros A/AAAA y CNAME que indique Google;
   - quitar lonaclub.es de Render;
   - **no tocar** los registros MX, SPF ni DMARC de Infomaniak.
8. **Google OAuth:**
   - URI de redirección `https://lonaclub.es/api/auth/google/callback` (ya está puesta);
   - app publicada;
   - correo de asistencia info@lonaclub.es.
9. **Fotos fuera de la base de datos** (T-004). Con las variables `R2_*` puestas, las fotos nuevas ya van a R2. Las que ya estuvieran en la base (por ejemplo, si se copia la base de la demo) se trasladan así:
   - `npx tsx scripts/fotos-al-almacen.ts`, con `DATABASE_URL` y las variables `R2_*` de producción. Copia y apunta; **no borra nada** y se puede repetir;
   - comprobar en la aplicación que las fotos se ven;
   - solo entonces, y con el visto bueno del fundador, `npx tsx scripts/fotos-al-almacen.ts --vaciar`, que comprueba cada foto en R2 antes de vaciar sus bytes de la base.
10. **Resend:**
   - verificar lonaclub.es (los registros van en su subdominio de envío);
   - `RESEND_API_KEY` en Secret Manager.

## Publicar una versión nueva
1. Fusionar el PR y esperar a la etiqueta `vX.Y.Z` que crea el CI.
2. Actions → «Desplegar la versión real (Cloud Run)» → `ref = vX.Y.Z`. El flujo:
   - compila la imagen;
   - aplica las migraciones;
   - publica;
   - comprueba `/salud`.
3. **Volver atrás:** Cloud Run → servicio `lona` → Revisiones → enviar el 100 % del tráfico a la anterior. Si una migración rompió algo, restaurar la base (abajo).

## Restaurar una copia
1. Descargar el archivo `diarias/lona-…dump` del cubo de R2.
2. En Neon, crear una **rama** de `lona-produccion`, para no tocar la base viva, y copiar su conexión directa.
3. Ejecutar `pg_restore --clean --if-exists --no-owner -d "<conexión de la rama>" lona-….dump`.
4. Comprobar los datos y, si están bien, convertir esa rama en la principal (Neon → Branches → «Set as default») o restaurar sobre la principal.

**Prueba de restauración:** hay que hacerla una vez antes del lanzamiento y anotarla aquí con fecha y resultado.

## Contenido inicial
La versión real empieza **vacía**: sin peleadores, veladas ni cuentas de ejemplo. El arranque de la demo (`scripts/arranque-demo.sh`) es el único que carga datos ficticios. Los gimnasios reales se cargarán con el importador del bloque D (OpenStreetMap, con su atribución ODbL).

## Cuentas y dónde está cada cosa

| Servicio | Cuenta | Para qué |
|---|---|---|
| Infomaniak | Del fundador | Dominio lonaclub.es, zona DNS y buzón info@lonaclub.es |
| Google Cloud | Proyecto **`lona-511614`**, de **info@lonaclub.es** | Cloud Run, Secret Manager, «Entrar con Google» (cliente OAuth «Lona web»). El proyecto `lona-511613`, de la cuenta de Gmail del fundador, está **en desuso** y hay que borrarlo: su secreto quedó expuesto |
| Neon | info@lonaclub.es, organización «Lona Club» (`org-shiny-sky-35660821`) | Base real `lona-produccion` (`solitary-morning-87085163`, Fráncfort `aws-eu-central-1`, PostgreSQL 18), creada el 14-10-2026 con todas las migraciones y vacía. Base de la demo `lona-demo` (`mute-king-39532104`, Fráncfort, PostgreSQL 18): copia de la base de Render hecha el 14-10-2026 (30 tablas, mismos recuentos) |
| Cloudflare | info@lonaclub.es | R2: copias y vídeos |
| Resend | info@lonaclub.es | Correos de la aplicación |
| Sentry | info@lonaclub.es | Errores |
| Render | Del fundador | Solo la demo (`ring-espana-demo`) |
| GitHub | `romppao/MiClaude` (privado) | Código, CI, despliegue y copias |

Las claves de cada servicio solo están en Secret Manager o en los secretos de GitHub. Si una se pierde, se crea otra nueva en el servicio y se sustituye; nunca se recupera la antigua.

## DNS de lonaclub.es (estado esperado)

| Nombre | Tipo | Valor | Para qué | ¿Se puede tocar? |
|---|---|---|---|---|
| `lonaclub.es` | MX | `mta-gw.infomaniak.ch` | Recibir correo en info@ | **No** |
| `lonaclub.es` | TXT | `v=spf1 include:spf.infomaniak.ch -all` | SPF del buzón | Solo para añadir un `include` si un proveedor lo exige |
| `_dmarc.lonaclub.es` | TXT | `v=DMARC1; p=reject;` | Protección contra suplantación | **No** |
| `lonaclub.es` y `www` | A, AAAA o CNAME | Los que indique Cloud Run. Hasta entonces, **ninguno** (paso 0): los antiguos A `216.24.57.1` y CNAME `ring-espana-demo.onrender.com` llevaban a la demo y hay que borrarlos | Web | Sí, al cambiar de alojamiento |
| Registros de Resend | TXT/MX en su subdominio | Los que indique Resend | Envío de correos | Sí, si se cambia de proveedor |

## Problemas conocidos y cómo resolverlos

| Síntoma | Causa | Solución |
|---|---|---|
| Render o Google dicen que no pueden verificar el dominio recién comprado | Red.es tarda horas en publicar un `.es` nuevo (lonaclub.es: comprado a las 14:20 y publicado a las 16:10 del 14-10-2026). Se comprueba con `nslookup -type=NS lonaclub.es a.nic.es` | Esperar y volver a pulsar «Verify». No es un fallo de los registros |
| No llega un correo a info@lonaclub.es justo después de activar el dominio | Los servidores de correo recuerdan durante un tiempo que el dominio «no existía» (la zona `.es` permite guardarlo hasta 24 h) | Esperar y pedir que se reenvíe. Mirar también el spam en https://mail.infomaniak.com |
| «Continuar con Google» da `redirect_uri_mismatch` | `APP_URL` no coincide letra por letra con la URI autorizada en Google | `APP_URL=https://lonaclub.es`, sin barra final. URI autorizada: `https://lonaclub.es/api/auth/google/callback` |
| El botón «Continuar con Google» no aparece | Falta `GOOGLE_CLIENT_ID` o `GOOGLE_CLIENT_SECRET` en el servicio | Añadirlas y volver a desplegar |
| Una clave secreta se ha visto en un chat, una captura o un documento | Exposición | Crear una clave nueva en el servicio, sustituirla, desactivar la antigua y borrar la captura |
| El despliegue falla en «Aplicar las migraciones» | Migración incompatible o falta `PROD_DATABASE_URL_DIRECT` | No se ha publicado nada: corregir y repetir. Si la base quedó a medias, restaurar (sección anterior) |
| `/salud` da 503 | La app no llega a la base: Neon dormido que no despierta, contraseña cambiada o cuota agotada | Panel de Neon: estado y consumo de CU-h. Comprobar `DATABASE_URL` en Secret Manager |
| La web va lenta la primera vez | Arranque en frío de Cloud Run y de Neon tras un rato sin uso (segundos) | Normal en el plan gratuito. Si molesta, mínimo 1 instancia, con coste y con decisión del fundador |
| GitHub Actions deja de ejecutarse a final de mes | Se agotaron los 2.000 minutos gratuitos (repositorio privado) | `mantener-demo-despierta.yml` gasta unos 4.300 al mes: sustituirlo por UptimeRobot o Better Stack |
| La demo deja de funcionar a primeros de noviembre de 2026 | Sigue usando la base gratuita de Render (`ring-demo-db`, caduca el 1-11-2026) | Su copia ya está en Neon (`lona-demo`). En Render → `ring-espana-demo` → Environment, `DATABASE_URL` debe ser la conexión *pooled* de `lona-demo`. `render.yaml` ya no la enlaza a la base de Render |
| Algo extraño en la app | — | Moderación → «Fallos de la aplicación» (`/moderacion/fallos`) y, cuando esté, Sentry |

## Herramientas de Neon para asistentes (instaladas el 14-10-2026)
- Skills `neon` y `neon-postgres` a nivel de usuario, para Claude Code (`neon skills --global`).
- Servidor MCP «Neon» (`https://mcp.neon.tech/mcp`) en la configuración de usuario de Claude Code, en modo OAuth: no guarda claves en archivos y pide iniciar sesión al primer uso.
- Copia de la configuración anterior: `~/.claude.json.antes-neon-20261014`.
- Copia de una base a otra sin ver las claves (así se pasó la demo de Render a Neon): las direcciones van en variables de entorno a un contenedor `postgres:18-alpine` que hace `pg_dump --format=custom --no-owner --no-privileges` y `pg_restore --no-owner --no-privileges`, y después se comparan los recuentos de todas las tablas.
- Para usar la base desde la terminal sin ver la clave, pasarla directamente de Neon al programa, por ejemplo:
  `DATABASE_URL="$(npx neon@latest connection-string --project-id solitary-morning-87085163)" npx prisma migrate deploy`.

## Gimnasios reales (bloque D)
La base oficial empieza vacía. Solo se cargan gimnasios reales mediante el importador de [GIMNASIOS-REALES.md](GIMNASIOS-REALES.md), después de aplicar sus migraciones. No ejecutar el seed. Primero generar y comparar el plan contra la base oficial y mostrar el recuento por provincia al fundador. La carga exige IMPORTAR_EN_REAL=si y el hash autorizado en RECUENTO_OSM_REVISADO; el script verifica el destino. Sin Cataluña, contactos dudosos por revisar y atribución ODbL. En esta sesión no se ha cargado ningún dato ni obtenido un recuento real por el bloqueo de red.
