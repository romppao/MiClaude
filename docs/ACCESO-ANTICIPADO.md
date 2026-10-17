# Acceso anticipado: que Lona salga en Google, que la gente entre con su cuenta de Google y que, al principio, solo entren las personas que tú elijas

> Petición del fundador, 17 de octubre de 2026: «que la web salga en las búsquedas de Google y que la gente pueda registrarse con su cuenta de Google. Haré un acceso anticipado a personas concretas».
> Este documento es la lista, **en orden**, de lo que hace falta. Marca cada paso con la fecha cuando lo termines. Las claves y contraseñas **nunca** se escriben en el chat ni en documentos: se pegan directamente en el panel del servicio que corresponda.

## Lo importante en cuatro líneas

1. **Nunca metas a gente real en la demo** (`ring-espana-demo.onrender.com`): deja confirmar el correo con un botón y hacerse moderador, y su base de datos es de prueba y caduca hacia el 1–2 de noviembre. Lo real va en **lonaclub.es**.
2. **Entrar con Google ya funciona**; solo hay que apuntarlo al dominio real (paso 4).
3. **Aparecer en Google ya está construido para la versión real** (mapa del sitio, `robots.txt`, títulos por página); la demo está bloqueada a propósito. Lo único que hace falta es publicar lonaclub.es y avisar a Google (paso 8).
4. **El acceso anticipado se controla desde la propia aplicación** (Moderación → «Acceso anticipado», también enlazado desde Administración): un botón lo enciende o lo apaga y solo podrán crear cuenta los correos que apuntes. Apagado por defecto (paso 16).

## El orden, paso a paso

### A. Decisiones (media hora, solo tú)

| # | Decisión | Qué recomienda Claude |
|---|---|---|
| 1 | **Menores** ([T-014](tareas/T-014-politica-de-menores.md)): hay muchos peleadores menores de edad. | Abrir **solo a mayores de 18** y sin promoción dirigida a menores. Es lo más rápido y seguro; la política de menores (3–5 días de trabajo) se hace después. |
| 2 | **Gasto mensual**: unos 10–30 € al mes (Neon, Cloud Run, correo) más el dominio. | Aprobarlo con una alerta de presupuesto de 1 € en Google Cloud para enterarte si algo se dispara. |
| 3 | **Quién es el responsable legal** (nombre y contacto que saldrán en privacidad y aviso legal). | Tu nombre o el de la sociedad, y `info@lonaclub.es`. |

### B. Cuentas (las creas tú; Claude te guía pantalla a pantalla)

4. **Google Cloud** (proyecto `lona-511614`, cuenta info@lonaclub.es): vincular la facturación y poner la alerta de 1 €. Guía: [`PRODUCCION.md`](PRODUCCION.md), «Puesta en marcha», pasos 1 a 5.
5. **Neon** (base de datos con copias, proyecto `lona-produccion`, Fráncfort) y **Cloudflare R2** (fotos y copias de seguridad, jurisdicción UE). Guía: [T-012](tareas/T-012-base-de-datos-gestionada.md).
6. **Resend** (correo real): añadir el dominio lonaclub.es. Resend te dará unos registros de DNS (SPF y DKIM): se añaden en Infomaniak **sin tocar** los registros MX ni los que ya existen. Sin correo real nadie puede confirmar su cuenta.
7. **Google, «Entrar con Google»**: ya tienes el proyecto; falta añadir la dirección del sitio real. En la pantalla de credenciales de Google, en «URI de redirección autorizados», añade `https://lonaclub.es/api/auth/google/callback` (y la de `www` si la usas). La app debe estar en estado **«En producción»** (así no hay límite de 100 usuarios ni avisos). Guía: [`GOOGLE.md`](GOOGLE.md).
8. **UptimeRobot y Sentry** (gratuitos): avisan si la web se cae o algo falla. Guía: [T-010](tareas/T-010-observabilidad.md).

### C. Montaje de la versión real (lo hace Claude, tú apruebas)

9. Primer despliegue en **Cloud Run** con las variables y los secretos (`PRODUCCION.md`, pasos 6 y siguientes). Claude lo prepara; tú **apruebas el despliegue** en GitHub (entorno `produccion`).
10. **Copias de seguridad diarias y restauración probada**: Claude las monta y **prueba a restaurar** una copia antes de dar nada por bueno.
11. **Cuenta del creador** en producción (`CREADOR_CORREO` y segundo paso) y clave nueva de noticias (`CRON_SECRET`): una hora, con la guía de Claude.

### D. El dominio (solo tú; Claude no toca DNS)

12. Seguir [`DOMINIO.md`](DOMINIO.md), sección 3, **al pie de la letra**: primero quitar de Infomaniak los registros que apuntan a la demo, después quitar el dominio del servicio de Render, y por último asignar lonaclub.es a Cloud Run con los registros que te dé Google. **No tocar** MX, SPF, `_dmarc` ni los TXT de verificación.

### E. Lo legal (antes de que entre nadie)

13. **Abogado**: que revise [`LEGAL.md`](LEGAL.md) (privacidad, condiciones, aviso legal, invitaciones, denuncias, logotipos de gimnasios). Las preguntas ya están escritas en la sección «Para el abogado» de cada apartado.
14. Rellenar los datos del titular (variables `TITULAR_*` y `RESPONSABLE_NOMBRE`) para que privacidad y aviso legal salgan completos.

### F. Pruebas (tú y Claude)

15. Pruebas definitivas por tipo de cuenta ([`LANZAMIENTO.md`](LANZAMIENTO.md), sección 4), **en un iPhone y un Android reales** y con tu cuenta de creador.

### G. Acceso anticipado: invitar a personas concretas

16. Con la versión real funcionando, entra con tu cuenta de creador y ve a **Moderación → Acceso anticipado** (también está en «Hoy» y en Administración). Pulsa **«Encender el acceso anticipado»**. No hay que tocar variables ni volver a desplegar.
17. En esa misma pantalla, **pega los correos** de las personas (uno por línea; para quien vaya a entrar con Google, el correo de su cuenta de Google) y pulsa «Añadir a la lista». Quien no esté en la lista y quiera registrarse verá un aviso amable. Quien ya tenga cuenta no se ve afectado. La lista dice quién ha creado ya su cuenta.
18. **Avísales tú** con un mensaje corto: «Ya puedes entrar en lonaclub.es con tu cuenta de Google (o con tu correo). Es un acceso anticipado: cuéntame qué falla o qué echas de menos.»
19. Para **abrir a todo el mundo** el 15 de noviembre: en la misma pantalla, «Apagar el acceso anticipado». Después conviene vaciar la lista (cada correo tiene su botón «Quitar»).

### H. Que salga en Google

20. **Google Search Console**: añade la propiedad `lonaclub.es` («Dominio») y verifícala con el registro TXT que te indique (en Infomaniak, sin tocar lo demás). Si ya verificaste el dominio para Google Cloud, puede estar hecho.
21. En Search Console → **Sitemaps** → añade `https://lonaclub.es/sitemap.xml`. Lo genera la aplicación sola con los peleadores, veladas, gimnasios y entrenadores públicos (no incluye fichas sin reclamar ni ocultas).
22. **Paciencia:** Google tarda días o semanas en mostrar un sitio nuevo. Se comprueba escribiendo `site:lonaclub.es` en Google. Mientras tanto, compartir enlaces en redes (WhatsApp, Instagram) ya muestra una tarjeta con título y descripción.

## Qué NO hacer

- No registres a gente real en la demo ni le des su dirección.
- No pegues claves, contraseñas ni códigos en el chat: van directamente en el panel del servicio.
- No toques MX, SPF, DKIM, `_dmarc` ni TXT existentes al cambiar el DNS: se rompe el correo de info@.
- No publiques en las tiendas (App Store, Google Play) hasta que esto esté en marcha: son 6–10 semanas y empiezan después ([`PUBLICACION.md`](PUBLICACION.md)).

## Qué hace Claude por su lado

- [x] Entrar con Google (hecho, probado en la demo).
- [x] Mapa del sitio, `robots.txt` y bloqueo de la demo a los buscadores.
- [x] Acceso anticipado por lista de correos, en Moderación → «Acceso anticipado» (0.26.0, 17-10-2026).
- [x] Tarjetas al compartir (Open Graph) y datos estructurados para buscadores (0.26.0).
- [ ] Montaje de producción, copias y prueba de restauración (cuando estén las cuentas del bloque B).
