# Registro de cambios de Lona

Todas las versiones de la aplicación, de la más nueva a la más antigua. Cómo se numeran, cuándo se sube cada número y cómo se vuelve
a una versión anterior: [`docs/VERSIONES.md`](docs/VERSIONES.md).

Cada versión se agrupa en **Añadido** (funciones nuevas), **Cambiado** (lo que ya existía y ahora funciona o se ve distinto),
**Corregido** (fallos), **Eliminado** y **Seguridad**. Se escribe para personas: qué notará quien use la aplicación o quien la mantenga.

Las versiones 0.1.0 a 0.8.0 se reconstruyeron el 13 de octubre de 2026 a partir de los PR fusionados, cuando se empezó a llevar el
control de versiones. La línea «Fusión» indica el commit de cada una: el CI crea su etiqueta (`v0.X.Y`) en GitHub.

## [Sin publicar]

## [0.11.3] — 2026-10-14

PR de Claude sobre #52.

### Corregido
- Las pruebas vuelven a comprobar que el comentario de un aura se ve en la ficha del peleador y que un combate declarado suma en el récord cuando pasan sus 24 horas. Esas comprobaciones se habían perdido al adaptar las pruebas al bloque B.

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

PR #48; incluye el trabajo responsive de #47, que no se publicó como 0.9.1.

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
