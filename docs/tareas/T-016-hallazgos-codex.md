# T-016 — Hallazgos de Codex, partes 3–5

Fecha: 2026-10-14. Base revisada: `8f0798561875d06dc88ed828dbe2d6eb922f838e`, rama `claude/ring-espana-mvp`, versión 0.13.1. Rama del informe: `codex/revision-t016`.

Revisión de solo lectura de la aplicación: los arreglos se deciden y se entregan después. Los cambios de F (#56) y el avance local de G no forman parte de esta base.

## Método y límites

- Comprobada coincidencia del commit remoto con `origin/claude/ring-espana-mvp` local. `git fetch`, `scripts/estado.mjs` y su reserva se intentaron: la red de terminal impide fetch/push. Reserva equivalente publicada mediante el conector GitHub, con commit vacío y sin CI.
- Se inspeccionan pantallas, consultas, acciones, guardas y pruebas; los casos indicados como renderizados se ejecutan con las fuentes reales y dependencias simuladas, sin base de datos ni escrituras de producto.
- `npm test`: 737/737 unitarias pasan en la base 0.13.1. Esto no descarta los hallazgos que esas pruebas no cubren.
- No se ha ejecutado una vuelta de navegador con PostgreSQL vacío ni se ha modificado la demo/oficial. La revisión de Antigravity es independiente. «Comprobado» identifica la evidencia concreta, no una validación integral del servicio.

## Parte 3 — Visitante y aficionado (revisada)

### C3-01 — El listado de seguidos desvela resultados amateur privados

- **Gravedad:** BLOQUEA EL LANZAMIENTO.
- **Archivo:línea:** `src/app/siguiendo/page.tsx:74`.
- **Qué falla y reproducción:** seguir a un amateur con `recordPublic=false` y un combate celebrado con resultado. En `/siguiendo`, «Últimos resultados» escribe «Gana …» y el método, sin comprobar la privacidad de ninguno de los dos participantes.
- **Arreglo:** reutilizar la regla de privacidad compartida para mostrar solo el enfrentamiento si el récord amateur de alguno es privado.
- **Estado:** **comprobado** por lectura y renderizado de la pantalla real con ambos participantes privados: el HTML contiene ganador y `(KO)`. La ficha y el panel sí tienen una regla de ocultación; el fallo está en este recorrido.

### C3-02 — La galería publica el apellido completo de fichas provisionales

- **Gravedad:** BLOQUEA EL LANZAMIENTO.
- **Archivo:línea:** `src/app/components/Multimedia.tsx:22`, `src/app/components/Multimedia.tsx:26`.
- **Qué falla y reproducción:** compartir un vídeo/foto asociado a un combate contra una persona sin cuenta cuya ficha es provisional. `SELECT_MEDIO` pide nombre y apellidos pero no `listed`/`hiddenAt`; el texto del combate concatena el apellido completo. Aparece en la galería de velada y ficha, aunque la política promete solo la inicial para estas personas (`src/app/privacidad/page.tsx:44`).
- **Arreglo:** seleccionar el estado público de la ficha y usar `publicFighterName` también en los nombres y textos alternativos de las galerías.
- **Estado:** **comprobado** por lectura y renderizado de `GaleriaMedios`: un participante provisional se publica como «Provisional ApellidoCompleto».

### C3-03 — No hay condiciones de uso y la información de almacenamiento está incompleta

- **Gravedad:** BLOQUEA EL LANZAMIENTO por las condiciones pendientes de la revisión jurídica; la ausencia de una página separada de cookies no obliga por sí sola a añadir un banner.
- **Archivo:línea:** `src/app/registro/page.tsx:101`, `src/app/layout.tsx:110`, `src/app/privacidad/page.tsx:29`.
- **Qué falla y reproducción:** abrir registro y pie de página: solo enlazan privacidad; no existen rutas de condiciones ni cookies. El registro presenta una aceptación genérica del tratamiento de datos, sin condiciones del servicio. La ficha de lanzamiento deja los textos jurídicos pendientes del abogado.
- **Arreglo:** publicar las condiciones aprobadas, enlazarlas en registro/pie y completar la información de almacenamiento y el texto del alta con revisión jurídica.
- **Estado:** **comprobado** por inventario de rutas y lectura. Hallazgo ya conocido por Claude, confirmado en esta base.

**Inventario de almacenamiento:** cookie `session` de autenticación (30 días), `volver` para retorno del registro (2 h), cookie temporal de viaje a Google; preferencia de tema `lona:tema` en localStorage y recuperación de formularios en sessionStorage. No se ha encontrado analítica, publicidad ni reproductor externo incrustado: los vídeos externos se abren por enlace. La privacidad dice «una cookie» y omite el resto. En el código propio los usos son funcionales; si el servicio desplegado mantiene exclusivamente finalidades exentas, no necesita banner de consentimiento. Queda por comprobar el tráfico/almacenamiento de terceros en navegador y la revisión jurídica. Fuente: [Guía sobre cookies de la AEPD](https://www.aepd.es/guias/guia-cookies.pdf), apartados de cookies técnicas y finalidades exentas.

**Lo revisado sin otro fallo demostrado:** estados vacíos explícitos de portada, noticias, búsqueda, seguidos y panel; búsqueda parametrizada con exclusión de fichas ocultas y veladas no públicas; acceso, recuperación y verificación con guardas y pruebas existentes; límites de aura y avisos en servidor; banner/acciones de demo condicionados a `DEMO_MODE=si`. No se ha comprobado entrega de correos reales ni funcionamiento del mapa en dispositivo.

## Parte 4 — Peleador y entrenador (revisada)

### C4-01 — Sparring publica detalle amateur privado al mezclar disciplinas

- **Gravedad:** BLOQUEA EL LANZAMIENTO.
- **Archivo:línea:** `src/app/propuestas/page.tsx:64`, `src/app/propuestas/page.tsx:67`.
- **Qué falla y reproducción:** una ficha con boxeo profesional como primera disciplina y MMA amateur privada; buscarla sin filtro de disciplina/nivel. `nivelDe` suma las victorias/derrotas de ambas, pero decide la privacidad solo por la primera disciplina. Una derrota amateur privada entra en el resultado público.
- **Arreglo:** calcular y ocultar el detalle por cada disciplina/nivel antes de construir una cifra agregada.
- **Estado:** **comprobado** ejecutando la función real con una victoria profesional y una derrota amateur, `recordPublic=false`: publica `1-1-0`.

### C4-02 — Política de menores pendiente en los recorridos reales

- **Gravedad:** BLOQUEA EL LANZAMIENTO.
- **Archivo:línea:** `src/app/actions/accounts.ts:33`, `src/app/actions/fighters.ts:95`, `src/app/peleadores/[slug]/page.tsx:108`; referencia `docs/tareas/T-014-politica-de-menores.md:14` y `docs/LANZAMIENTO.md:32`.
- **Qué falla y reproducción:** el alta no solicita edad (decisión vigente) y la fecha de nacimiento de la ficha es opcional. Se puede indicar nacimiento de menor, publicar foto/banner, nombre y ciudad, recibir aura/comentarios y proponer sparring sin una política aplicada por edad. T-014 ordena no abrir a menores reales hasta resolverlo; no hay todavía una separación que permita cumplir esa apertura en el producto.
- **Arreglo:** cerrar la decisión del fundador y revisión jurídica de T-014 y aplicar sus restricciones de forma compartida en alta, ficha, imágenes, búsqueda y acciones antes de abrir la oficial.
- **Estado:** **comprobado por lectura** de guardas y flujos; no se han creado perfiles reales de menores. Es una condición de lanzamiento ya conocida, no una decisión nueva de Codex sobre la edad mínima.

### C4-03 — Clase y sparring aceptan días inexistentes y cambian la fecha

- **Gravedad:** IMPORTANTE.
- **Archivo:línea:** `src/lib/trainers/requests.ts:57`, `src/lib/fighters/proposals.ts:36`.
- **Qué falla y reproducción:** enviar `day=2026-11-31` con un día actual de 14-10-2026. Ambos validadores comprueban formato y `Date.parse`, que normaliza esa fecha; aceptan la solicitud y guardan `2026-12-01`. En una clase, el texto también cambia a «martes 1 de diciembre».
- **Arreglo:** comprobar que la fecha interpretada conserva exactamente el día enviado antes de validar el intervalo.
- **Estado:** **comprobado** ejecutando ambos validadores reales con datos ficticios; los dos devuelven `ok=true` y el 1 de diciembre. El selector normal reduce la probabilidad, pero el servidor debe rechazar un envío alterado.

### C4-04 — Las solicitudes de clases se cortan en 50 sin acceso al resto

- **Gravedad:** IMPORTANTE.
- **Archivo:línea:** `src/app/mis-clases/page.tsx:21`, `src/app/mis-clases/page.tsx:28`.
- **Qué falla y reproducción:** con más de 50 solicitudes pendientes del entrenador, la consulta devuelve solo 50, el aviso cuenta esas filas y no hay paginación ni enlace para llegar a las demás. Al responder algunas pueden aparecer otras, pero no se puede consultar directamente todo el trabajo pendiente ni su cifra real.
- **Arreglo:** paginar con recuento completo y orden estable conservando el acceso y respuesta de todas las solicitudes.
- **Estado:** **comprobado por lectura** de límite, recuento e interfaz; falta reproducción con PostgreSQL/navegador de 51 solicitudes.

**Lo revisado sin otro fallo demostrado:** categorías y medidas validadas; ficha y clases protegidas por titular; guardas y cambio condicional de respuestas de clases/propuestas; filtros por ciudad/gimnasio; cálculo compartido del récord que excluye declaraciones menores de 24 h y veladas no autorizadas; amateur privado por defecto en el modelo. Las pruebas unitarias de la frontera de 24 h, privacidad, categorías, rivales y autorización pasan. Rangos/escalera del equipo son herramientas de desarrollo, no permisos públicos de las cuentas. El pulido de paneles sigue en #56 y no se considera integrado.

## Parte 5 — Gimnasios, organizadores y veladas (revisada)

### C5-01 — Un organizador elude la autorización de veladas pasadas

- **Gravedad:** BLOQUEA EL LANZAMIENTO.
- **Archivo:línea:** `src/app/actions/events.ts:149`, `src/app/actions/events.ts:175`, `src/app/actions/events.ts:195`; `src/app/actions/shared.ts:120`.
- **Qué falla y reproducción:** con una entidad autorizada que sea titular de la velada, sin ser moderador:
  1. `setBoutResult` sobre un combate de una velada `PENDING_AUTHORIZATION` o `REJECTED` cambia siempre la velada a `COMPLETED`.
  2. Cancelar una velada pendiente y volverla a abrir cambia `PENDING_AUTHORIZATION → CANCELLED → COMPLETED`, perdiendo la obligación de autorización.
  3. Corregir una velada futura `SCHEDULED` y poner una fecha pasada conserva `SCHEDULED`: el control de `updateEvent` solo recalcula el estado si ya era pendiente/rechazada.
- **Arreglo:** centralizar y proteger en la transacción todas las transiciones de fecha/estado, manteniendo la autorización pendiente hasta una decisión moderadora, incluso tras cancelar/reabrir.
- **Estado:** **comprobado** ejecutando las acciones reales con un organizador y almacenamiento simulado: guardar resultado desde pendiente y rechazada termina `COMPLETED`; cancelar/reabrir termina `COMPLETED`; mover futura a pasada conserva `SCHEDULED`. La guarda `ownEvent` comprueba titularidad, pero no autorización de la velada. Las pruebas existentes de veladas pasadas cubren alta/decisión/visibilidad, no estas transiciones.

### C5-02 — No se aplica la exclusión de gimnasios de Cataluña

- **Gravedad:** BLOQUEA EL LANZAMIENTO según el requisito expreso de T-016.
- **Archivo:línea:** `src/app/gimnasios/page.tsx:29`, `src/lib/common/search.ts:23`, `src/app/actions/fighters.ts:62`, `src/app/actions/trainers.ts:46`, `src/app/gimnasios/[slug]/page.tsx:17`.
- **Qué falla y reproducción:** registrar una ficha/entrenador con gimnasio y provincia Barcelona, Girona, Lleida o Tarragona. Las acciones permiten crear ese gimnasio, y las consultas de lista, mapa, búsqueda y ficha no excluyen esas provincias. El selector también las ofrece. En la base oficial vacía no hay todavía ninguno, pero el código deja introducirlos y publicarlos.
- **Arreglo:** aplicar el criterio territorial común a las altas y a todas las lecturas/importaciones de gimnasios, con pruebas para las cuatro provincias antes de cargar datos de OpenStreetMap.
- **Estado:** **comprobado por lectura** de acciones, catálogo de provincias y consultas. No se han consultado ni borrado gimnasios reales; no se afirma que hoy existan en la base oficial/demo.

### C5-03 — La valoración de gimnasios suma aura de combates que no cuentan

- **Gravedad:** IMPORTANTE.
- **Archivo:línea:** `src/app/gimnasios/page.tsx:38`, `src/lib/common/mapa.ts:74`.
- **Qué falla y reproducción:** dar aura a un combate válido y cancelar después su velada, o ponerlo en revisión. La suma del mapa solo une Aura y Fighter: no consulta Bout/Event, estado ni plazo de 24 h. Esa aura sigue aumentando la valoración y el orden de «Los mejores de tu zona», aunque deja de contar en el ránking deportivo.
- **Arreglo:** usar el criterio común `boutsQueCuentan` al agregar aura por gimnasio, conservando también el filtro de comentarios ocultos.
- **Estado:** **comprobado por lectura** de la consulta y la fórmula; falta ejecución con PostgreSQL para cuantificar la diferencia en un conjunto real.

### C5-04 — El cartel de una velada sin autorizar publica fichas provisionales

- **Gravedad:** IMPORTANTE, vinculada a privacidad y a C5-01.
- **Archivo:línea:** `src/app/actions/events.ts:115`, `src/app/actions/shared.ts:139`.
- **Qué falla y reproducción:** añadir dos fichas provisionales a una velada pasada todavía pendiente. `addCartelBout` llama a `listFighters` sin comprobar el estado de la velada: marca las fichas `listed=true` y genera su URL con apellido completo. Aunque la velada aún está oculta, las fichas pasan a búsquedas/directorio/sitemap antes de que moderación autorice el hecho que las hace públicas.
- **Arreglo:** diferir la publicación derivada del cartel hasta que la velada sea pública y haya pasado la autorización correspondiente.
- **Estado:** **comprobado por lectura** de la llamada incondicional y sus escrituras; falta recorrido con PostgreSQL/navegador de fichas provisionales.

**Lo revisado sin otro fallo demostrado:** creación y edición de cartel/resultados comprueban titularidad; moderación es la única que usa la acción de autorización explícita; las inscripciones solo aceptan veladas programadas abiertas y validan disciplina/categoría y plazas; las fichas públicas de velada respetan el récord amateur privado; asignar edición de gimnasio/entrenador/federación corresponde a moderación y no concede permiso deportivo para respaldar. No existe importador OpenStreetMap ni recorrido autónomo de reclamación de gimnasio en esta base: el gimnasio se crea por ficha/entrenador y su edición se asigna manualmente por moderación. El bloque D y su recuento provincial previo siguen pendientes; no se han cargado datos reales.

## Resumen para decidir antes de la oficial

- **Bloquean:** tres vías de publicar veladas pasadas sin autorización; tres recorridos que revelan datos privados (seguidos, galerías y sparring mixto); política de menores y condiciones de uso pendientes; exclusión de gimnasios de Cataluña sin aplicar.
- **Importantes:** fechas inexistentes en solicitudes; listas de clases sin acceso a más de 50; valoración de gimnasios con aura excluida; publicación de fichas desde carteles pendientes.
- **Puede esperar a revisión/validación siguiente:** pulido F del PR #56 y G/D/H; comprobar en navegador los casos señalados como lectura, correos reales y tráfico de terceros. No equivale a autorizar el lanzamiento.
- **Restos de demo:** no se encontró marca antigua en textos públicos normales ni datos de seed incrustados en esos recorridos. Sí queda el agente de noticias `RingEspana/1.0` (`src/lib/news/refresh.ts:65`) y un ejemplo antiguo de dominio en el diagnóstico de entorno (`src/lib/common/env.ts:11`): menores, visibles solo en cabeceras/diagnóstico técnico. Las claves internas de base/navegador retiradas de la marca son excepciones técnicas ya aprobadas.

Las tres partes se han guardado y publicado por separado antes de seguir. Los hallazgos son propuestas de corrección; este PR no cambia producto, permisos ni datos.
