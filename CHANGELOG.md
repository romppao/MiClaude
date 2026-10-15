# Registro de cambios de Lona

Todas las versiones de la aplicación, de la más nueva a la más antigua. Cómo se numeran, cuándo se sube cada número y cómo se vuelve
a una versión anterior: [`docs/VERSIONES.md`](docs/VERSIONES.md).

Cada versión se agrupa en **Añadido** (funciones nuevas), **Cambiado** (lo que ya existía y ahora funciona o se ve distinto),
**Corregido** (fallos), **Eliminado** y **Seguridad**. Se escribe para personas: qué notará quien use la aplicación o quien la mantenga.

Las versiones 0.1.0 a 0.8.0 se reconstruyeron el 13 de octubre de 2026 a partir de los PR fusionados, cuando se empezó a llevar el
control de versiones. La línea «Fusión» indica el commit de cada una: el CI crea su etiqueta (`v0.X.Y`) en GitHub.

## [Sin publicar]

## [0.18.9] — 2026-10-15


### Cambiado
- Moderación reúne sus colas en una bandeja por urgencia, mantiene las páginas y los avisos sin cuenta/PAGINA/GYM. «Poner en revisión» envía `dispute`; se conservan notas y avisos al abrir enlaces.



## [0.18.7] — 2026-10-15

PR de Claude Code: estado tras cerrar el relevo de Claude (nube) (documentación).

### Cambiado
- `docs/ESTADO.md`: relevo cerrado (#82, #84 y #83), recuento de gimnasios en la demo (1 publicado, 190 por revisar) y fallo de tiempo de espera de OpenStreetMap.

## [0.18.6] — 2026-10-15

PR de Claude (nube): relevo a Claude Code (documentación).

### Cambiado
- `docs/ecosistema/traspasos/2026-10-15-claude-nube-a-claude-code.md`: qué se hizo hoy, qué queda a medias y cómo cerrarlo, cómo seguir con los gimnasios reales (información de menos de un año y todas las comunidades) y las reglas nuevas. `ESTADO.md` lo enlaza al principio.

## [0.18.5] — 2026-10-15

PR de Claude (nube): T-013 (#77) y T-002 (#78) de Codex, integrados sobre la 0.18.x.

### Corregido
- Los enlaces al reglamento y a contenido avisado en moderación anuncian que abren otra pestaña. La autoría generada por el mapa también incorpora aviso y protección. La auditoría espera al mapa y comprueba el aviso y la protección de la pestaña de origen.

### Cambiado
- Los vídeos externos de la galería avisan visiblemente de la salida; condiciones y privacidad explican qué ocurre al abrir páginas ajenas.

### Cambiado
- Se agrupan las actualizaciones de Dependabot #17, #18, #19, #65 y #66: Vitest 5.0.3, Sharp 0.35.5, Next 15.5.27, MapLibre 6.14.0 y tipos de Node 26.6.5, con una única resolución de dependencias.

## [0.18.4] — 2026-10-15

PR de Claude: primera lista de gimnasios reales investigada a mano (petición del fundador, 15-10-2026: «los gimnasios de la vida real… solo gimnasios de deportes de contacto… todas las comunidades autónomas»).

### Añadido
- `docs/datos/gimnasios-investigados.json`: 191 clubes de boxeo, kickboxing, K-1, muay thai, MMA y jiu-jitsu con su fuente, en 24 provincias (108 en Madrid). Faltan Castilla-La Mancha, Extremadura, Canarias, Huesca y casi toda Castilla y León.
- `scripts/importar-gimnasios-lista.ts` y las opciones «lista-recuento» y «lista-cargar» del botón «Cargar gimnasios reales en la demo». Solo se publica con confianza alta y fuente de menos de un año (`fechaFuente`, petición del fundador); el resto queda por revisar en moderación. El Club de Boxeo Ludus queda con boxeo y K-1, como confirmó el fundador. Nunca pisa un gimnasio existente ni carga Cataluña.

## [0.18.3] — 2026-10-15

PR de Claude: T-010, avisos de fallos (imprescindible n.º 7 del lanzamiento, en la parte de programación).

### Añadido
- **Avisos a Sentry** con `SENTRY_DSN`: cada fallo nuevo (y cada uno que reaparece tras darse por resuelto) llega a Sentry con el mismo texto que en «Fallos», con los datos personales ya tachados y sin usuario, correo ni IP. Si la base de datos no responde, también avisa. Sin dependencias nuevas: se usa el formato estándar de Sentry por HTTP.
- `/salud` da la latencia de la base de datos y si los avisos de fallos están activados.

## [0.18.2] — 2026-10-15

PR de Claude: cargar los gimnasios reales en la demo desde GitHub (el fundador quiere probarlos en la demo, 15-10-2026).

### Añadido
- **Acción «Cargar gimnasios reales en la demo»** (pestaña Actions, botón «Run workflow»). «recuento» descarga los gimnasios de OpenStreetMap, los compara con la base de la demo y muestra cuántos se cargarían por provincia, sin escribir nada; «cargar» hace lo mismo y los carga. Solo para la demo. Necesita el secreto `DEMO_DATABASE_URL`.

- **Dominio:** `docs/DOMINIO.md` explica cómo proteger lonaclub.es, el orden seguro para separarlo de la demo (primero el DNS y luego Render) y cómo deshacer cada cambio. Ningún asistente toca el dominio.

## [0.18.1] — 2026-10-15

PR de Claude: T-008, cola de correos. Imprescindible n.º 3 del lanzamiento (correo real), en la parte de programación.

### Cambiado
- **Ningún correo se pierde:** cada correo se guarda antes de enviarse. Si el proveedor falla, se reintenta (1 min, 5 min, 30 min, 2 h y 12 h); tras 6 intentos queda apuntado en «Fallos».
- **Límite diario del proveedor** (`MAIL_LIMITE_DIARIO`, 100 por defecto, el plan gratuito de Resend). Al llegar, los correos esperan al día siguiente. Los de la cuenta (confirmar el correo, contraseña) pasan antes y tienen reservados los últimos 10.
- Los correos entregados no guardan su contenido (puede llevar enlaces de un solo uso) y se borran a los 30 días; `/privacidad` lo dice.
- La cola se procesa al enviar cada correo, en la limpieza periódica y con la tarea de noticias, sin tareas programadas nuevas. `/salud` dice cuántos esperan y cuántos fallaron.

## [0.18.0] — 2026-10-15

PR de Claude (nube): los bloques D (#64) y H (#71) de Codex, integrados sobre la 0.17.0 con las correcciones de su revisión. La lista única de moderación de H no entra: tenía un botón que no funcionaba y no admitía los avisos sin cuenta (queda para Codex).

### Añadido (bloque H)
- Campanita de avisos personales, con lectura, descarga propia y conservación de doce meses.
- Vídeos públicos de tus combates añadidos por referencia a tus highlights; aviso a quien los compartió (salvo si hay un bloqueo entre los dos).
- Seguidores y comentarios recientes en el panel del peleador (sin los de personas que ha bloqueado), plantilla del gimnasio del entrenador y pendientes de federación con acreditación.


### Añadido (bloque D)
- Directorio de gimnasios con procedencia OSM, contactos profesionales y disciplinas, revisión de altas, reclamación, gestión y cesión de propiedad.
- Importador manual con recuento previo, protección de datos corregidos, duplicados por revisar y guardas de carga oficial.
- Exclusión de Cataluña en directorio y mapa; atribución ODbL y distinción del seed ficticio.

## [0.17.0] — 2026-10-15

PR de Claude (nube): los paneles F y G que preparó Codex (#56, #62), en la versión que integró Claude Code (#69, #70), actualizados sobre la 0.16.1. Sustituye a los cuatro PR.

### Mejorado (bloque F)
- Los cuatro paneles reúnen sus pendientes en «Te toca» y reducen los accesos rápidos a cuatro como máximo.
- El aficionado puede dar y quitar aura a ambos participantes desde su panel; las recomendaciones respetan sus disciplinas y el registro separa disciplinas y sugerencias.
- El entrenador responde solicitudes desde el panel y ve solicitudes del mes, clases aceptadas y alumnos que repiten.
- Récord por disciplina en el panel del peleador, progreso del perfil y tarjetas adaptables en «Peleadores que sigo».
- El entrenador puede completar su gimnasio desde la edición de su perfil (salvo en las provincias sin gimnasios en Lona).

### Añadido (bloque G)
- Provincia opcional y actividad local, asistencia voluntaria a veladas y calendario ICS público.
- Disponibilidad del peleador con peso opcional y caducidad de 60 días, filtros en directorio y cartel.
- Agenda semanal del entrenador y lista de preparación de veladas con cantidades agregadas de asistentes y seguidores.

## [0.16.1] — 2026-10-15

PR de Claude: T-004, parte 2. Las fotos salen de la base de datos (el fundador lo aprobó el 15-10-2026: «ponte a ello»).

### Cambiado
- **Fotos fuera de la base de datos:** la foto y el banner de los perfiles, las fotos de los highlights y las del público se guardan en el almacén de fotos (Cloudflare R2, el mismo cubo que los vídeos) y la base solo apunta dónde está cada una. Así la base gratuita (0,5 GB) no se llena con unos miles de fotos. Para quien usa la aplicación no cambia nada.
- Mientras no estén las variables `R2_*`, todo sigue como antes: las fotos se guardan en la base. Las fotos antiguas se siguen viendo y se trasladan con `scripts/fotos-al-almacen.ts`, que no borra nada de la base sin la opción `--vaciar`.
- Al quitar o sustituir una foto, retirar un highlight o un vídeo del público, eliminar la cuenta u ocultar una ficha, la foto se borra también del almacén. Ocultar una ficha borra además sus vídeos, que hasta ahora se quedaban.
- El CI guarda las fotos en un almacén en disco (`FOTOS_EN_DISCO=si`), para probar el mismo camino que en producción.

## [0.16.0] — 2026-10-15

PR de Claude: lo que faltaba programar de los textos legales (petición del fundador, 15-10-2026: «procede con todas las correcciones para dejar la aplicación lista y perfecta para el uso cotidiano»).

### Añadido
- **Bloquear a otra persona** (lo exige Apple para publicar en la tienda): desde su ficha, su comentario de aura, su vídeo o foto, su propuesta o su solicitud de clase. Ya no podrá retarte, proponerte sparring, pedir tus clases ni seguirte, y no verás lo que publique; lo pendiente entre las dos se cancela. No se le avisa ni cambia nada para los demás. Se deshace en «Mi cuenta», pestaña «Bloqueos», y entra en la copia de tus datos.
- **Avisar de un contenido sin cuenta** (`/avisar`, al pie de todas las páginas): dirección, motivo, explicación, nombre, correo y declaración de buena fe, como pide la ley de servicios digitales. Acusa recibo por correo y entra en la cola de moderación.
- **Correos con la decisión de moderación:** al cerrar un aviso, quien avisó recibe la decisión; si se retira algo, su autor recibe qué se ha hecho, por qué y cómo reclamar.

### Cambiado
- Moderación ve los avisos sin cuenta (con nombre y correo de quien avisa) y, en los avisos sobre una página, solo puede cerrarlos: se actúa desde la propia página.
- `/condiciones`, `/privacidad` y `docs/LEGAL.md` recogen las tres funciones nuevas.

## [0.15.1] — 2026-10-15

PR de Claude: separar la demo de la versión real (petición del fundador, 15-10-2026).

### Cambiado
- **La demo ya no sale en los buscadores:** sus páginas llevan «noindex», su `robots.txt` no anuncia el mapa del sitio y su `sitemap.xml` está vacío. Quien busque «Lona» no debe llegar a la versión de pruebas. La versión real no cambia: se sigue dejando encontrar.
- **Documentación:** `PRODUCCION.md` tiene un paso 0 para quitar ya lonaclub.es de Render y de la zona DNS (sin tocar el correo); `ESTADO.md` recoge la decisión.

## [0.15.0] — 2026-10-15

PR de Claude: arreglos de la revisión previa a la versión oficial (T-016). Codex encontró los de las partes 3-5 y Claude, los de las partes 1-2.

### Seguridad
- **Récord amateur privado:** ya no se ve en «Peleadores que sigo» (C3-01) ni en la búsqueda de sparring cuando se suman varias disciplinas (C4-01).
- **Fichas provisionales:** las galerías de fotos y vídeos ya no muestran el apellido completo, solo la inicial (C3-02).
- **Veladas pasadas:** siempre necesitan la autorización de moderación. Ya no se publican al poner un resultado, al cancelar y reabrir ni al mover una velada futura a una fecha pasada (C5-01). Su cartel no hace públicas las fichas provisionales hasta que se autoriza (C5-04).
- **Correos en el registro del servidor:** una instalación real (https, sin demo) no arranca con `MAIL_TRANSPORT=log`, que dejaría ahí los enlaces de acceso.

### Corregido
- **Borrar la cuenta tras entrar con Google:** quien entró con Google y no tiene contraseña confirma volviendo a entrar con Google y tiene 15 minutos para borrarla. «Cambiar mi contraseña» le explica cómo elegir una.
- **Fechas imposibles:** las solicitudes de clase y las propuestas de sparring rechazan días que no existen, como el 31 de noviembre (C4-03).
- **Valoración de gimnasios:** solo cuenta el aura de los combates que cuentan para el récord (C5-03).
- Quedan fuera los restos de «Ring España» en los mensajes de arranque, el lector de noticias y la clave del formulario.

### Cambiado
- **Gimnasios de Cataluña** (Barcelona, Girona, Lleida y Tarragona): no salen en la lista, el mapa, la búsqueda, el sitemap ni su ficha, y no se crean gimnasios nuevos en esas provincias (C5-02, decisión del fundador). La lista está en `src/lib/common/territorio.ts`.
- **Máximo de 5 fotos al día por persona** mientras las fotos se guarden en la base de datos, que tiene 1 GB gratis.

## [0.14.1] — 2026-10-14

## [0.14.0] — 2026-10-15

PR de Claude: textos legales para el lanzamiento (petición del fundador). Son borradores pendientes de revisión jurídica (`docs/LEGAL.md`).

### Añadido
- **Aviso legal** (`/aviso-legal`): titular, NIF, domicilio y contacto, que se leen de variables de entorno, y un **bloque de responsabilidad**: contenido de usuarios, datos orientativos, veladas de terceros, riesgo deportivo, enlaces y disponibilidad.
- **Condiciones de uso** (`/condiciones`): normas, licencia del contenido, cómo avisar de contenido ilícito, moderación, sanciones y reclamaciones (DSA).
- **Política de cookies** (`/cookies`) con el inventario real: solo cookies técnicas y de preferencia, sin banner.
- El servidor avisa al arrancar si faltan los datos del titular (`TITULAR_NOMBRE`, `TITULAR_NIF`, `TITULAR_DOMICILIO`).

### Cambiado
- **Privacidad:**
  - responsable completo;
  - base legal de cada uso;
  - datos obligatorios;
  - decisiones automatizadas;
  - proveedores y transferencias;
  - menores;
  - plazo de un mes para los derechos;
  - fecha de actualización.
- **Pie de página:** enlaces a Condiciones, Privacidad, Cookies y Aviso legal.
- **Consentimiento al crear la cuenta:** el registro y «Continuar con Google» mencionan también las condiciones de uso.

### Corregido (recorrido de Antigravity por la demo, 14-10-2026)
- **Noticias:** las búsquedas de Google Noticias colaban en la portada común titulares ajenos a los deportes de contacto (fundas de móvil, camiones, vela, fútbol). Ahora, si el titular no nombra ninguna disciplina, se descarta. Las ya guardadas se borran al reiniciar el servidor.
- **Privacidad:** los dos avisos sobre fotos y highlights iban encima del título; ahora van debajo.
- **Veladas:** la etiqueta «no oficial» pasa a escribirse con mayúscula inicial, como las demás.

## [0.13.1] — 2026-10-14

PR de Claude: solo documentación.

### Añadido
- Ficha [T-016](docs/tareas/T-016-revision-previa-al-lanzamiento.md): revisión completa antes de montar la versión oficial, por partes, para que cualquier asistente la retome. El fundador decidió revisar la app antes de lanzar lonaclub.es y de publicar en Google.

## [0.13.0] — 2026-10-14

PR de Claude: preparación de la versión real en lonaclub.es (ADR-005).

### Añadido
- **La versión real se puede publicar en Google Cloud Run** con su propia base de datos en Neon, separada de la demo. Incluye:
  - imagen Docker (`Dockerfile`, salida *standalone* de Next.js solo al compilar la imagen);
  - despliegue manual desde Actions, que aplica las migraciones antes de publicar y comprueba `/salud`;
  - guía de operación en `docs/PRODUCCION.md`.
- **Copia de seguridad diaria** de la base real en Cloudflare R2, con jurisdicción UE (`copia-diaria.yml`).

### Cambiado
- La actualización de noticias cada 6 horas también llega a la versión real cuando tiene dirección (variable `PROD_URL`). Cada destino usa su propia clave.
- La demo de Render no cambia: sigue arrancando con `next start` y sus datos de ejemplo.
- **La base de la demo pasa de Render a Neon** (`lona-demo`, Fráncfort), porque la de Render caducaba el 1-11-2026. Se copió entera (30 tablas con los mismos recuentos). `render.yaml` ya no enlaza la base de Render: `DATABASE_URL` se pega en el panel.

## [0.12.2] — 2026-10-14

PR de Claude (nube). Si se fusiona antes que #56, ese PR (0.12.2) pasa a 0.12.3.

### Añadido
- **Relevo entre sesiones** (petición del fundador): [`docs/ESTADO.md`](docs/ESTADO.md), una página corta con cómo está todo, qué hay en curso, qué ha dicho ya el fundador y qué está reservado, y `scripts/estado.mjs`, que enseña en directo la demo, las ramas y PR en curso y los ficheros que dos trabajos tocan a la vez. Reservar un trabajo (`node scripts/estado.mjs reservar <asistente> "<tema>"`) sube una rama vacía y no gasta minutos de pruebas. `CLAUDE.md`, `AGENTS.md` y las instrucciones de Copilot mandan leerlo al empezar.

## [0.12.1] — 2026-10-14

PR de Claude (bloque E del encargo de paneles por tipo de usuario: fallos de la revisión del 14 de octubre).

### Corregido
- **«Peleadores que sigo»** ya no muestra combates de veladas pendientes de autorizar ni de veladas rechazadas. Sus «Últimos resultados» siguen la misma regla que el récord, el panel y el ránking: solo cuentan los combates autodeclarados cuando han pasado sus 24 horas.
- **Panel de la promotora, federación o club:** la cifra «Por resultado» suma los combates sin resultado de **todas** sus veladas ya celebradas (antes solo miraba la última). El aviso enlaza cada velada pendiente, como mucho tres, y ofrece ver las demás.
- **Panel de la entidad:** se quita la barra del cartel, que suponía seis combates por velada. Queda el número real de combates del cartel.

## [0.12.0] — 2026-10-14

PR de Claude (entrar con Google, T-015).

### Añadido
- **Entrar y registrarse con Google** («Continuar con Google»). Si ya existe una cuenta con ese correo, se entra en ella; si no, se crea con el correo ya confirmado y se sigue el mismo paso del alta. La cuenta del creador mantiene el segundo paso. El botón solo aparece cuando están puestas las claves de Google (guía en `docs/GOOGLE.md`). Las promotoras, federaciones y clubes siguen registrándose con correo y contraseña.

### Seguridad
- Al vincular Google a una cuenta que no había confirmado su correo, se invalida su contraseña y se cierran sus sesiones, por si otra persona la creó con un correo ajeno.

## [0.11.3] — 2026-10-14

PR de Claude sobre #52.

### Corregido
- Las pruebas vuelven a comprobar que el comentario de un aura se ve en la ficha del peleador y que un combate declarado suma en el récord cuando pasan sus 24 horas. Esas comprobaciones se habían perdido al adaptar las pruebas al bloque B.
- El tema claro u oscuro elegido en el menú ya no se pierde a veces al cargar una página: si se borra, se vuelve a aplicar solo.
- Las pruebas de veladas pasadas y del plazo de 24 horas ya no fallan a ratos. Usan nombres únicos, esperan a que la página muestre el dato y ya no confunden lo buscado, que la página repite, con un resultado.

## [0.11.2] — 2026-10-14

### Cambiado
- En retos oficiales y sparring se pueden elegir ciudad y gimnasio entre los perfiles que cumplen los filtros deportivos, sin escribir nombres. El nombre o alias sigue siendo opcional. Los clubes homónimos se distinguen por su ubicación y se conservan los enlaces de búsqueda anteriores.

## [0.11.1] — 2026-10-13

### Cambiado
- Se documenta el cierre de la revisión de lanzamiento, las comprobaciones locales y los pendientes para la segunda revisión.

## [0.11.0] — 2026-10-13

### Añadido
- Las veladas pasadas requieren autorización de moderación antes de publicarse o contar en récords y ránquines.
- Las declaraciones de combates entran en el récord 24 horas después si siguen sin disputarse ni estar en revisión.

### Cambiado
- El público ve solo el total de combates amateur también en el cartel cuando el récord está privado.
- La ayuda aclara que el combate declarado aparece en ambas fichas, y el botón compacto de atribución del mapa tiene una zona táctil de 44 × 44 px.

### Corregido
- Las decisiones de autorización de veladas quedan auditadas y se notifican al organizador.

## [0.10.0] — 2026-10-13

PR #48 (incluye el trabajo responsive de #47, que no se publicó como 0.9.1). Fusión: `d5842b4`.

### Añadido
- **Diagnóstico de fuentes de noticias** en `/moderacion/noticias`: cada fuente muestra si responde, si devuelve un canal válido y cuántos titulares aporta.
- **Buscador de peleadores en el cartel** (organizador): cada esquina del combate tiene su búsqueda; los inscritos aceptados salen siempre primero, y sin búsqueda se ve una lista corta.
- Nueva fuente de noticias: Marca (boxeo) y Marca (MMA), comprobadas el 13-10-2026.
- Prueba de navegador `hidratacion.mjs`: vigila errores de hidratación en zona horaria de Madrid y de Nueva York.

### Cambiado
- Los combates futuros muestran «Programado»; los pasados sin resultado, «Resultado por anotar».
- «Nivel» ya no viene preseleccionado al crear una velada: hay que elegirlo («Elige tu nivel»).
- Los botones de envío se bloquean hasta que termina la acción y muestran «Creando tu cuenta…» o «Guardando…» (con tope de seguridad de 30 s).
- El enlace de entradas de una velada debe empezar por https.

### Corregido
- Catálogo y mapa de mantenimiento al día; huellas estables entre Windows y Linux, sin incluir archivos generados.
- Pruebas de rival y ficha pública que esperan al contenido visible y abren su pestaña; datos de prueba con nivel explícito, también en los combates profesionales del recorrido de respaldo.
- Protección de envíos en formularios con un campo llamado «method»; el banco visual usa el color del tema para texto sobre el acento.
- Titulares repetidos en las noticias: se descartan por dirección o título normalizados (incluido un fallo con la barra final y parámetros).
- Al actualizar noticias se rechaza una respuesta que no sea un canal RSS.
- No se puede pedir inscripción a una velada en cuya cartelera ya figura la persona.
- Listado de peleadores: sin foto ya no aparece el icono de imagen rota sobre las iniciales (revisión con Impeccable tras integrar el PR #47).
- Fechas de «Mi ficha» sin zona horaria fija (posible causa de un aviso de hidratación; la causa no está confirmada).

- Cabecera y navegación distribuidas en escritorio y ajustadas a móviles estrechos.
- Tarjetas que crecen con nombres largos; noticias visibles y ordenadas según el espacio disponible.
- Fotos ausentes con iniciales legibles, incluidos nombres con emoji, y cifras de aura con formato español.

### Eliminado
- Fuentes de noticias FEKM (rechaza las peticiones, 403) y MMA España (sin canal, devuelve HTML); quedan anotadas como retiradas.

## [0.9.0] — 2026-10-13

PR #46.

### Añadido
- **Mapa de gimnasios** (OpenFreeMap, gratuito y sin claves): «Usar mi ubicación», marcadores agrupados y «Los mejores de tu zona» con la
  valoración Lona (aura de sus peleadores, peleadores, entrenadores y verificación), con orden «Mejores» o «Más cerca».
- **Mapa en las fichas** de gimnasio («Dónde está») y de entrenador («Dónde entrena»), con «Cómo llegar» si hay dirección exacta.
- Campo «Dirección del gimnasio» al editar su perfil; la ubicación se busca sola en segundo plano (Nominatim).
- **Control de versiones**: este registro, [`docs/VERSIONES.md`](docs/VERSIONES.md), `scripts/version.mjs`, comprobación en cada PR,
  etiqueta automática al fusionar y la versión visible en la ayuda, en moderación, en `/salud` y en cada fallo registrado.
- Plan de lanzamiento ([`docs/LANZAMIENTO.md`](docs/LANZAMIENTO.md)): lista el 1 de noviembre, lanzamiento público el 15.

### Cambiado
- La lista completa de gimnasios queda recogida en «Ver todos los gimnasios», debajo del mapa.
- Si fallan las pruebas de navegador, el CI publica un aviso legible desde el PR con los fallos y lo que se veía en cada página.

### Corregido
- Contraste de la línea de autoría del mapa en tema oscuro.

## [0.8.0] — 2026-10-13

PR #45. Fusión: `6862a77`.

### Añadido
- Tema claro y oscuro: sigue el del sistema y se puede fijar en el menú.
- Registro de fallos (`/moderacion/fallos`): todo fallo queda guardado, agrupado y con su historia.
- Panel de moderación ordenado en «Pendiente de revisar», «Estado de la aplicación» y «Herramientas».

### Seguridad
- Preparación del repositorio privado ([ADR-004](docs/decisiones/ADR-004-repositorio-privado.md)) con licencia de todos los derechos
  reservados.

## [0.7.0] — 2026-10-13

PR #44. Fusión: `246e99a`.

### Cambiado
- Nueva marca **Lona** con el logotipo del cuadrilátero, y el ring como icono y favicon.
- La portada usa la foto «Bajo las cuerdas», del fundador.

## [0.6.0] — 2026-10-10

PR #41 a #43. Fusión: `c45538b`.

### Cambiado
- La aplicación se adapta a móvil y a escritorio, y responde más rápido.
- En escritorio, la cabecera ocupa una sola fila y la portada no deja huecos.

### Corregido
- Las portadas de las noticias se ven en el móvil sin solaparse.

### Añadido
- La demo se mantiene despierta.

## [0.5.0] — 2026-10-09

PR #36 a #40. Fusión: `d1e7ace`.

### Añadido
- Inscripción de peleadores en veladas e interclubs, y gestión de solicitudes para el organizador.
- Plazas por categoría con lista de espera.
- Ayuda para emparejar a los aceptados.
- Buscar rival o sparring con filtros.
- La inscripción es visible para el peleador.

### Cambiado
- Al emparejar en élite, y en cualquier categoría de edad, la edad no se compara.
- La portada tiene menos texto bajo el lema.

## [0.4.0] — 2026-10-08

PR #34 y #35. Fusión: `81f2330`.

### Añadido
- Pestañas que se deslizan.
- Foto y banner a la vez en la ficha.
- Portadas de los vídeos.
- Quitar una disciplina de la ficha.
- Solicitar clases.
- Acciones principales en cada panel y «Buscar clases».
- Reserva de clases con calendario.
- Retos de combate y propuestas de sparring.

### Corregido
- 13 defectos de la revisión completa.

## [0.3.0] — 2026-10-08

PR #28 y #30 a #33. Fusión: `63cdad3`.

### Añadido
- Portada con noticias y una portada por disciplina.
- Menú según el tipo de cuenta.
- El entrenador puede organizar.
- Vídeos y fotos del público.
- Cuenta del creador con segundo paso.
- Iconos de cada deporte; noticias solo en español y por disciplina.
- Catálogo del código, comprobado en el CI.

### Cambiado
- Las fotos del móvil se ajustan solas al subirlas.

## [0.2.0] — 2026-10-08

PR #27. Fusión: `a34deab`.

### Cambiado
- Diseño móvil v3 en negro y lima, fase 1.

## [0.1.0] — 2026-10-03

PR #8 a #16, la primera versión pública de la demo, todavía como «Ring España». Fusión: `d9fba95`.

### Añadido
- Fichas de peleadores, combates, veladas, ránking y aura.
- Divisiones por edad y sexo.
- Todas las provincias y disciplinas.
- Diseño violeta provisional.
- Trayectoria histórica.
- Respaldo opcional.
- Menú por actividades.
