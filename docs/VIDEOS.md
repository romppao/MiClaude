# Vídeos y fotos del público: cómo funcionan y cómo activar el almacén

Petición del fundador (8 de octubre de 2026): «un espacio para que los aficionados suban el contenido que han grabado o fotografiado en la velada, para que los peleadores puedan obtener contenido de sus combates», y después: «**subir los vídeos en la app de verdad y, si no es viable, mediante enlaces**».

## Qué hay hecho

- **Quién comparte:** cualquier cuenta con el correo confirmado, desde la página de una velada («Subir vídeos o fotos de esta velada») o desde el menú («Subir vídeos o fotos de una velada» → `/compartir`).
- **Qué se comparte:** una foto (se guarda normalizada en WebP, hasta 4 MB) **o** un vídeo, que puede ser:
  - **subido a la aplicación** (MP4, MOV o WebM; 500 MB en R2, 100 MB en el disco de pruebas), con barra de progreso;
  - o **un enlace** (YouTube, Instagram, TikTok…), siempre disponible como alternativa.
- **Cuándo:** desde el mismo día de la velada hasta 4 meses después; nunca en veladas futuras o canceladas.
- **Consentimiento obligatorio** en cada envío: lo grabó la persona, puede compartirlo, los peleadores del combate pueden verlo y descargarlo para su uso personal, y si aparecen menores cuenta con el permiso de su familia o su club.
- **Dónde se ve:** en la velada («Vídeos y fotos del público») y, si se indica el combate, en la ficha pública de los dos peleadores («Vídeos y fotos de sus combates») y en «Mi ficha» → «Vídeos y fotos de mis combates», con botón **Descargar**.
- **Control:** quien lo subió lo borra cuando quiera desde «Mi panel» → «Mis vídeos y fotos» (también se borra el archivo). Cualquiera puede avisar («Aparezco yo y no doy permiso», «Es ofensivo…»); moderación lo retira desde su cola de avisos. Al eliminar la cuenta se borran sus vídeos y fotos.
- **Highlights del peleador:** también admiten vídeo subido, además del enlace.

## Dónde se guardan los vídeos

Los vídeos **no** van a la base de datos (pesan demasiado). El código (`src/lib/media/storage.ts`) elige el almacén así:

| Situación | Almacén | Qué pasa |
|---|---|---|
| Están las variables `R2_*` | **Cloudflare R2** | El navegador sube el vídeo **directamente** a R2 con una dirección temporal firmada (no pasa por nuestro servidor) y se reproduce desde R2 con otra dirección temporal. |
| Desarrollo, pruebas o demo (`DEMO_MODE=si`), o `MEDIA_DIR` | **Disco del servidor** | Sirve para probar. **En la demo de Render el disco se borra en cada despliegue o reinicio**: los vídeos subidos allí son temporales (la página lo avisa). |
| Producción sin R2 | **Ninguno** | Solo se pueden compartir vídeos con enlace; la página lo explica. El servidor avisa al arrancar. |

La firma de las direcciones es el estándar de Amazon S3 (*Signature Version 4*), probado con el ejemplo oficial de AWS (`tests/unit/s3.test.ts`): se puede cambiar a Scaleway, Backblaze B2 o Amazon S3 tocando solo la configuración del almacén.

## Activar R2 (lo hace el fundador; ya aprobado en el ADR-003)

R2 es la herramienta aprobada para imágenes y copias en el [ADR-003](decisiones/ADR-003-proveedores-fase-0.md) (10 GB gratis y salida de datos gratis **según fuentes secundarias**: compruébalo en la página oficial de precios de Cloudflare antes de activarlo, y si pide tarjeta). **No se contrata nada de pago.**

1. En **cloudflare.com** → *R2 Object Storage* → **Create bucket**. Nombre, por ejemplo, `ring-videos`. **Jurisdicción: Unión Europea** (no se puede cambiar después).
2. En *R2* → **Manage R2 API Tokens** → **Create API token** con permiso **Object Read & Write** solo sobre ese cubo. Apunta el **Access Key ID** y el **Secret Access Key** (el secreto solo se muestra una vez).
3. Copia el **Account ID** que aparece en la página principal de R2.
4. En el cubo → *Settings* → **CORS policy**, pega esto (cambia la dirección por la de la web; añade la de la demo si la usas):

   ```json
   [{ "AllowedOrigins": ["https://ring-espana-demo.onrender.com"], "AllowedMethods": ["PUT", "GET", "HEAD"], "AllowedHeaders": ["content-type", "range"], "ExposeHeaders": ["content-length", "content-range"], "MaxAgeSeconds": 3600 }]
   ```

5. Recomendado: en el cubo → *Settings* → **Object lifecycle rules**, una regla que borre los objetos con prefijo `videos/` que nadie haya publicado. Hoy no se puede distinguir por regla un vídeo publicado de uno abandonado, así que **no la actives todavía**: está pendiente una tarea de limpieza (ver `IDEAS.md`).
6. En **Render** → servicio `ring-espana-demo` → *Environment*, añade:

   | Variable | Valor |
   |---|---|
   | `R2_ACCOUNT_ID` | el Account ID |
   | `R2_ACCESS_KEY_ID` | el Access Key ID |
   | `R2_SECRET_ACCESS_KEY` | el Secret Access Key |
   | `R2_BUCKET` | `ring-videos` |
   | `R2_JURISDICCION` | `eu` |

   Si falta alguna de las cuatro primeras, el servidor no arranca y lo dice (mejor un fallo claro que vídeos perdidos).
7. Comprueba: sube un vídeo corto desde `/compartir` en el móvil, mira que se reproduce y que «Descargar el vídeo» funciona.

## Pendiente o por decidir

- **Revisión legal** del derecho de imagen (LOPDGDD) y de menores en las veladas amateur: el texto de consentimiento es una primera versión prudente, no asesoramiento jurídico (`TRASLADO.md`).
- **Limpieza de subidas abandonadas** (vídeos subidos que nadie llegó a publicar) y **miniaturas** de los vídeos.
- **Compresión** de vídeos grandes: hoy se suben tal cual (el móvil suele grabar en H.264/HEVC, que los navegadores reproducen; HEVC no se ve en algunos navegadores de escritorio).
- Las **fotos** siguen guardándose en la base de datos, como las de los perfiles; pasarán a R2 con la tarea T-004.
