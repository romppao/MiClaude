# Encargo para Codex: Lona, paneles por tipo de usuario

- **Fecha:** 14 de octubre de 2026
- **Autor:** Claude Code, como revisor y por encargo del fundador.
- **Proyecto:** `MiClaude/` (repositorio romppao/MiClaude). La app se llama **Lona**.
- **Aprobación:** el 14-10-2026 el fundador aprobó **todas** las propuestas de esta revisión y pidió corregir los fallos.
- **Estado:** el bloque E lo hizo Claude (PR #55, versión 0.12.1); **no lo repitas**. Codex hace **F → G → H**, con **un PR por bloque**, partiendo de la rama principal cuando el #55 esté integrado.
- **Revisión:** Claude revisa cada PR. Avisa al fundador cuando haya algo desplegado en la demo (https://lona-demo.onrender.com/).

## Punto de partida
- Parte de la rama principal `claude/ring-espana-mvp` actualizada, con el PR #55 ya integrado (versión 0.12.1 o posterior).
- Usa los filtros nuevos `filtrosSiguiendo` y `VELADAS_NO_PUBLICAS` (`src/lib/community/siguiendo.ts`) y `resumenResultadosPendientes` (`src/lib/events/resultados-pendientes.ts`); te servirán para F1 y G6.
- Ramas sugeridas: `codex/paneles-f-pulido`, `codex/paneles-g-madrid` y `codex/paneles-h-despues`.
- Sigue `CLAUDE.md`, `docs/DESARROLLO.md` y `docs/REVISION.md`:
  - las migraciones solo pueden añadir, nunca borrar;
  - cada arreglo lleva su prueba;
  - el catálogo y el mapa (`npm run mapa`) tienen que estar al día;
  - el CI tiene que quedar en verde.
- **Diseño:** usa los componentes y clases del diseño v3 que ya existen (`AccionesPrincipales`, `tarjeta`, `fila`, `dato`, `pildora`…). Puedes reordenar y simplificar, pero no cambies la estética: el diseño visual nuevo es de otro equipo.
- **Reglas aprobadas que no se pueden romper:**
  - el récord amateur está oculto por defecto;
  - un combate autodeclarado cuenta 24 h después de registrarse;
  - las veladas pasadas necesitan autorización de un moderador.
  - Para cualquier lista de combates que «cuentan», usa siempre `boutsQueCuentan()` (`src/lib/common/record-eligibility.ts`).

---

## BLOQUE E: fallos (HECHO por Claude en el PR #55; solo como referencia)

**E1. «Peleadores que sigo» muestra combates de veladas no aprobadas.**
`src/app/siguiendo/page.tsx` solo excluye `CANCELLED`. Por eso aparecen combates de veladas `PENDING_AUTHORIZATION` y `REJECTED`, tanto en «Próximos» como en «Últimos resultados».

Hecho cuando:
- «Próximos» solo incluye veladas `SCHEDULED`;
- «Últimos resultados» usa `boutsQueCuentan()`;
- hay una prueba con una velada pendiente y otra rechazada en la que ninguna de las dos aparece.

**E2. La cifra «Por resultado» de la entidad se queda corta.**
En `src/app/_inicio/Entidad.tsx`, `pendientes` usa `take: 1`. La cifra y el aviso solo miran la última velada con resultados pendientes.

Hecho cuando:
- la cifra suma los combates sin resultado de **todas** sus veladas ya celebradas (excepto las canceladas o rechazadas);
- el aviso lista cada velada pendiente, como mucho 3, con un enlace «ver todas»;
- hay una prueba con dos veladas pendientes.

**E3. La barra del cartel de la entidad inventa un dato.**
`huecos = Math.max(6, …)` supone 6 combates.

Hecho cuando:
- la barra desaparece y en su lugar se muestra «N combates en el cartel»;
- solo vuelve si la velada tiene un número de combates previsto. Si quieres ese campo, propónlo, pero no lo añadas en este bloque.

---

## BLOQUE F: pulido común de los paneles (sin funciones nuevas)

**F1. Bloque «Te toca» al principio de cada panel.**
Crea un componente común, por ejemplo `src/app/_inicio/TeToca.tsx`, que reciba una lista de pendientes `{texto, href, cantidad}` y no se pinte si la lista está vacía. Pendientes de cada tipo de cuenta:
- **Aficionado:** confirmar el correo; combates de sus peleadores con resultado y sin su aura; respuestas a sus solicitudes de clase.
- **Peleador:** combates que otros declaran con él (`porConfirmar`); retos y sparrings pendientes; respuestas de inscripción; crear la ficha si no la tiene.
- **Entrenador:** solicitudes de clase pendientes; solicitudes para participar en sus veladas; resultados por poner.
- **Entidad:** resultados por poner (con el criterio de E2); solicitudes para participar.

Hecho cuando: los cuatro paneles lo usan, y hay pruebas con lista vacía y con lista llena.

**F2. Como mucho 4 accesos rápidos por panel.**
Lo que se quita sigue en el menú (`src/lib/accounts/menu.ts`).
- **Aficionado:** subir vídeos o fotos, peleadores que sigo, mis reservas (solo si tiene) y buscar clases. Se quitan «Buscar peleadores» y «Próximas veladas», que ya están en la barra inferior.
- **Peleador:** registrar un combate, retos y sparrings, inscribirme en una velada y publicar un highlight.
- **Entrenador:** publicar una clase, crear una velada o interclub, mis clases y mis veladas.
- **Entidad:** crear una velada o interclub, mis veladas, mi perfil público y buscar peleadores.

Comprueba que todo lo que se quita siga accesible desde el menú y que el menú no supere los 5 enlaces por bloque. Actualiza `tests/` del menú.

**F3. Aficionado: dar aura sin salir del panel y a los dos peleadores.**
En «Últimos resultados» de `Aficionado.tsx`:
- cada combate muestra a los dos peleadores con su propio botón de aura, que es un formulario con `giveAura` y `back=/mi-panel`;
- respeta `canGiveAura`, el límite diario y el correo sin confirmar, igual que en la ficha;
- si ya la ha dado, se muestra «Hecho» y la opción de quitarla.

Hecho cuando: funciona sin JavaScript y hay una prueba e2e de dar y quitar aura desde el panel.

**F4. Aficionado: panel útil desde el primer día.**
Si no sigue a nadie, en lugar de mensajes vacíos se muestran:
- «Peleadores destacados de tus disciplinas»: `peleadoresConAura` filtrado por `user.interests`, con botón «Seguir» (`toggleFollow`);
- «Próximas veladas de tus disciplinas» (`proximasVeladas`).

Si no eligió disciplinas, se usan todas. Las sugerencias del registro (`registro/intereses`) también tienen que tener en cuenta las disciplinas elegidas: haz que el paso sea de dos pantallas o que filtre al elegir.

**F5. «Peleadores que sigo» con el diseño v3.**
- Sustituye las tablas por `fila` y `tarjeta`, como en el panel.
- Quita la columna «Respaldo» y usa textos llanos: «Programado», «Declarado: cuenta a partir del…» o «Verificado».
- Las pruebas de accesibilidad (axe) y del diseño adaptable tienen que seguir pasando.

**F6. Entrenador: contestar solicitudes desde el panel.**
Lista las solicitudes de clase pendientes, como mucho 5, con «Aceptar» y «Rechazar». Reutiliza las acciones de `/mis-clases`.

Cambia las cifras «Activas / En pausa / Años» por:
- «Solicitudes este mes»;
- «Clases aceptadas»;
- «Alumnos que repiten» (más de una solicitud aceptada).

Quita la tarjeta grande de «Clases publicadas», que repite la cifra de las activas.

**F7. Peleador: récord por disciplina.**
Si tiene más de una disciplina, la portada del panel permite cambiar de disciplina; puede hacerse con enlaces `?disciplina=`. Se respeta la privacidad del récord amateur.

**F8. «Completa tu perfil».**
Barra de progreso con lo que falta, que desaparece al llegar al 100 %:
- **Peleador:** foto, gimnasio, provincia, categoría de peso y alias;
- **Entrenador:** foto, presentación, gimnasio y al menos una clase;
- **Entidad:** los datos de su perfil público que ya existan, como logotipo, web o descripción. No añadas campos nuevos para esto;
- **Aficionado:** disciplinas y provincia (la provincia llega en G1; hasta entonces, solo disciplinas).

---

## BLOQUE G: funciones para la captación en Madrid

**G1. Provincia del aficionado (opcional).**
- Añade `User.province String?` (migración aditiva).
- Se pide en `registro/intereses` y en «Mi cuenta». Usa la lista `PROVINCES` que ya existe.
- Con provincia, el panel muestra «Cerca de ti» con veladas y clases de su provincia.
- Con provincia, el botón «Buscar clases» filtra por ella.

**G2. «Esta semana en Madrid» en la portada pública.**
- En `Visitante.tsx` y `PortadaComun.tsx`: veladas y clases de los próximos 7 días en la provincia del usuario, o en Madrid si no hay ninguna elegida.
- Permite cambiar de provincia con un `select`, mediante un formulario GET.
- No pidas la ubicación del navegador en este bloque.

**G3. «Voy a ir» en las veladas.**
- Tabla nueva `EventAttendance {userId, eventId, createdAt}` con `@@id([userId, eventId])`.
- Botón en `/veladas/[slug]` para veladas futuras, que exige cuenta y se puede quitar.
- Enlace «Añadir a mi calendario» que genera un archivo `.ics` con una ruta GET, sin datos personales.
- En el panel del aficionado, una sección «Mi agenda» con las veladas marcadas y el próximo combate de sus peleadores.
- El público solo ve el número («23 van a ir»), nunca los nombres.
- La entidad ve el número en su panel.

**G4. «Disponible para pelear».**
- Interruptor en «Mi ficha»: `Fighter.availableToFight Boolean @default(false)` y `Fighter.currentWeightKg Decimal?`, ambos opcionales y aditivos.
- Desactivado por defecto. El peso solo se muestra mientras está activado.
- Filtro «Disponibles» en `/peleadores` y en el buscador del cartel (`buscarParaCartel`).
- Se desactiva solo a los 60 días, con aviso al peleador.

**G5. Agenda del entrenador.**
- Sección «Esta semana» en su panel, con las solicitudes aceptadas ordenadas por día y franja (`day`, `fromMinute`, `toMinute`).
- Las solicitudes antiguas que solo tienen texto en `preferred` van al final.

**G6. Entidad: lista de preparación de cada velada.**
En `/organizador/[slug]` y en el panel, sin campos nuevos, con lo que ya se puede comprobar:
- **Antes:** cartel con algún combate, enlace de entradas y categorías de peso puestas.
- **Después:** todos los resultados anotados.

Cada punto sin hacer enlaza a donde se arregla. Muestra también la cifra de G3. Como «seguidores de sus peleadores», cuenta los `Follow` de los peleadores de sus carteles.

---

## BLOQUE H: después

**H1. Avisos dentro de la app (campanita).**
- Tabla `Notification {id, userId, kind, title, href, readAt?, createdAt}` con índice `(userId, readAt)`.
- Campanita en la cabecera con el número de avisos sin leer, y página `/avisos`.
- Tipos:
  - combate anunciado de un peleador seguido (donde hoy se llama a `notifyFollowersOfBout`);
  - resultado publicado de un peleador seguido;
  - aura recibida, agrupada por día;
  - alguien declara un combate contigo;
  - reto o sparring recibido;
  - solicitud de clase (para el entrenador) y respuesta (para el aficionado);
  - solicitud para participar (para el organizador);
  - vídeo nuevo de tu combate.
- Conservación: 12 meses, el plazo que ya figura en IDEAS. Al darse de baja, se borran.
- Opcional: recordatorio por correo el día antes de una velada marcada con «Voy a ir». Depende de tener el correo real con dominio; déjalo preparado pero desactivado.

**H2. Peleador: vídeos del público y comentarios de aura.**
- En el panel, «Vídeos de tus combates», con los `MediaItem` de sus combates y un botón «Añadir a mis highlights». Se avisa a quien lo grabó con H1.
- Junto a la gráfica de aura, el número de seguidores y los 3 últimos comentarios de aura que no estén ocultos.

**H3. Entrenador: «Mis peleadores».**
Peleadores de su gimnasio (`Fighter.gymId` = el gimnasio del entrenador) con su próximo combate. Sirve para montar interclubs.

**H4. Seguir y dar aura a gimnasios y promotoras.**
Ya está en IDEAS (punto 5, fase 2). Diseña el modelo de datos en el PR y espera la revisión de Claude antes de programar la interfaz.

**H5. Panel de federación.**
Si la entidad es `FEDERACION`, el panel muestra:
- la cola de «Respaldar resultados y títulos» (`/respaldar`), con su cantidad;
- los títulos pendientes;
- sus competiciones.

Las promotoras y los clubes siguen con su panel.

**H6. Bandeja única de moderación.**
`/moderacion` pasa a ser una sola lista ordenada por urgencia:
1. veladas pasadas pendientes;
2. combates con señales de coherencia;
3. avisos de error;
4. reclamaciones;
5. organizadores;
6. gimnasios;
7. combates sin señales.

Cada elemento tiene acciones en línea y, después de decidir, pasa al siguiente. Mantén los enlaces y anclas antiguos (`#avisos`, `#reclamaciones`…) para no romper las pruebas ni los marcadores.

---

## Al terminar cada bloque
- Actualiza `CHANGELOG.md` y la versión según `docs/DESARROLLO.md`.
- Añade a `docs/IDEAS.md` lo que cambia de estado.
- Escribe un traspaso propio en `docs/ecosistema/traspasos/` con objetivo, archivos, pruebas, límites y siguiente paso.
- Escribe tu nota en `OBSIDIAN/OBSIDIAN/Sesiones/`.
- Pide la revisión de Claude indicando el número del PR.

**Origen:** revisión de Claude del 14-10-2026, con la nota `OBSIDIAN/OBSIDIAN/Sesiones/2026-10-14 - Claude - revision panel aficionado.md`.

---

## BLOQUE D: gimnasios reales para la versión real (añadido el 14-10-2026; va DESPUÉS de G y ANTES de H)

Haz el bloque D tal como está descrito en `docs/ecosistema/traspasos/2026-10-13-claude-encargo-codex-afilar-y-gimnasios.md` («ENCARGO 2 — BLOQUE D»: D1 modelo, D2 importación desde OpenStreetMap, D3 alta a mano, reclamación), **con estos cambios aprobados por el fundador hoy**:

1. **Sin Cataluña, también en el mapa.** El fundador dice: «no quiero que salgan los de cataluña, es territorio de la competencia». Esto **sustituye** a la frase del encargo del 13-10 «Los de Cataluña sí aparecen en el mapa».
   - El importador descarta las provincias de **Barcelona, Girona, Lleida y Tarragona** (por la provincia de la dirección o, si falta, por las coordenadas).
   - Un gimnasio de Cataluña dado de alta a mano o por reclamación **no se publica en el mapa**. Lo revisa un moderador.
   - Una prueba lo comprueba.
   - La lista de provincias excluidas va en una sola constante con su explicación, para poder cambiarla si el fundador lo decide.
2. **Destino: la versión real, además de la demo.** La versión real (Cloud Run + Neon, `docs/PRODUCCION.md`, PR #57) empieza **vacía**: sin peleadores, veladas ni cuentas de ejemplo. **Los gimnasios reales son lo único que se carga.**
   - El script tiene que poder ejecutarse contra la base real sin cargar nada del seed, con una confirmación explícita (por ejemplo, `IMPORTAR_EN_REAL=si`).
   - Cuéntale al fundador cuántos gimnasios se cargarían por provincia **antes** de ejecutarlo en la base real.
3. Sigue vigente: **ningún envío masivo** de correos o SMS a gimnasios mientras no haya revisión legal.

**Hecho cuando:**
- hay recuento por provincia (sin Cataluña), con los dudosos en «por revisar»;
- se ve la atribución de OpenStreetMap;
- funciona la reclamación con revisión de un moderador;
- hay pruebas del filtro de Cataluña;
- `docs/PRODUCCION.md` tiene una sección de cómo cargarlos en la versión real.
