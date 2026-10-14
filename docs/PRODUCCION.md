# Versión real de Lona (producción)

Decisión y motivos: [ADR-005](decisiones/ADR-005-alojamiento-cloud-run.md).

**Las claves nunca se escriben en el chat, en el código ni en documentos.** Se pegan directamente en Secret Manager o en los secretos de GitHub.

## Piezas

| Pieza | Dónde | Notas |
|---|---|---|
| Web | Cloud Run, servicio `lona`, `europe-west1`, proyecto `lona-511613` | Imagen del `Dockerfile` (salida *standalone*). |
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

**Secretas** (Secret Manager, montadas como variables): `DATABASE_URL` (*pooled*), `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `CREADOR_CORREO` y, cuando haya vídeos, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` y `R2_BUCKET`.

**Nunca:** `DEMO_MODE` ni `MAIL_TRANSPORT=log`.

## Puesta en marcha (una sola vez)
1. **Proyecto y facturación.**
   - Vincular `lona-511613` a la cuenta de facturación y poner una alerta de presupuesto de 1 €.
   - Activar Cloud Run, Artifact Registry, Secret Manager e IAM Credentials.
   - Hacer propietario a info@lonaclub.es.
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
9. **Resend:**
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
