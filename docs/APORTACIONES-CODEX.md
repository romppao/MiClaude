# Aportaciones de Codex y relevo para Claude

**Fecha:** 3 de octubre de 2026 (Europe/Madrid). **Autor:** Codex. **Proyecto:** Ring España, repositorio `romppao/MiClaude`.

## Leer primero al retomar

**Continuación validada:** el recorrido de récords profesional/amateur está en [la propuesta #9](https://github.com/romppao/MiClaude/pull/9), rama `codex/validacion-records-2026-10-03`, partiendo de `e049fe4`. Ver la sección final para distinguirlo de los cambios de calendario y sus ejecuciones de CI.

Este documento es el relevo solicitado expresamente por el fundador para que Claude entienda las aportaciones de Codex. Se complementa con `TRASLADO.md`, `DIARIO.md`, `COMPETENCIA.md` y el mapa funcional; no sustituye las reglas de `CLAUDE.md`.

**Base examinada:** `f86e3347d0efadffa940f5cc91987c7abbdfa41c`, rama principal `claude/ring-espana-mvp`.
**Rama de aportaciones:** `codex/claridad-calendario-2026-10-03`.
**Estado:** la continuación de #9 pasa CI completo (tipos, migraciones, mapa, 313 unitarias, compilación, E2E y axe). Integración pendiente: #9 está encadenada sobre la rama de #8. La demo sigue siendo una versión distinta hasta integrar y desplegar. El relevo inicial también está en la rama principal.

## Peticiones y decisiones del fundador

- Autorización: «Adelante hazlo lo que creas conveniente», comparando Raunder y BoxRec para aprender de lo que hacen bien y evitar sus fricciones.
- Prioridad reiterada: «El diseño gráfico de la aplicación lo dejaremos para lo último, primero quiero centrarme en que la aplicación funcione como quiero».
- Continuidad: «debes comunicar a Claude de todos los cambios […] debe haber una comunicación efectiva» y «Sube un documento Markdown en el repositorio de GitHub para documentar todas tus aportaciones».
- Este bloque trabaja comportamiento, orientación y exactitud. No rediseña la identidad visual ni cambia permisos, regla de aura, modelo de datos, categorías oficiales o monetización.

## Qué se examinó realmente

1. Instrucciones, traslado, diario reciente, desarrollo, arquitectura, competencia, guiones por personas y código de las pantallas afectadas.
2. Demo pública: `https://ring-espana-demo.onrender.com/`, portada y calendario con navegación real. Render inicialmente mostró arranque y después cargó. No se creó cuenta ni se completaron recorridos privados.
3. Raunder: portada y respuesta desplegada sobre el récord en navegador, más directorio y clasificación públicos recuperados por búsqueda.
4. BoxRec: portada, ficha y ayuda oficial recuperadas por búsqueda; su navegador quedó en verificación contra bots tras una recarga. No se sorteó. Esto no demuestra que falle a usuarios normales.

El análisis actualizado en `COMPETENCIA.md` sustituye hipótesis antiguas: BoxRec tiene registros de varios deportes, idiomas y participación del público; Raunder también incluye Madrid. No se mantienen acusaciones no comprobadas sobre manipulación de datos.

## Cambios de código, motivo y comportamiento

| Archivo | Antes / problema | Aportación |
|---|---|---|
| `src/lib/common/dates.ts` | Consultas de calendario usaban instantes diferentes pese a guardar días a las 12:00 UTC | `calendarDayStart()` obtiene un límite UTC basado en el día de Madrid; para estos datos guardados es un límite de consulta, no la medianoche física de Madrid |
| `src/app/page.tsx` | Una velada de hoy desaparecía de la portada después de las 12:00 UTC | Incluye hoy durante todo el día de Madrid; aclara zona; añade Muay Thai al texto y consulta sin cuenta |
| `src/app/page.tsx` | El visitante debía deducir dónde empezar | Sección por objetivos con enlaces a funciones existentes: peleadores, gimnasios, veladas, ficha y organizador; no añade roles ni un nuevo selector de registro |
| `src/app/veladas/page.tsx` | Una ventana móvil de 24 h en próximas se solapaba con pasadas | Hoy/próximas usa `gte` del límite; pasadas usa `lt`; todas no filtra fecha; periodo desconocido vuelve al valor por defecto |
| `src/app/veladas/page.tsx` | Filtros sin resumen ni salida directa de un resultado vacío | Reutiliza `FiltrosActivos` para quitar uno conservando los demás y quitar paginación; enlace claro a todas las fechas |
| `src/app/ranking/page.tsx` | La fórmula y los límites del reconocimiento eran poco visibles | Explica puntos, empates, provincia de la ficha, periodo por fecha de aura, categoría/nivel actuales, exclusiones y ausencia de normalización por actividad; distingue reconocimiento y clasificación oficial |
| `src/app/ranking/page.tsx` | Resultado vacío sin acción directa | Enlaces a ampliar a toda España/todo el tiempo o buscar peleador |
| `src/app/ayuda/page.tsx` | Se decía que un combate pendiente contaba en el récord sin distinguir autor y rival | Explica el comportamiento real de `computeRecords`: pendiente solo cuenta al autor; al rival tras confirmación/verificación |
| `src/app/ayuda/page.tsx` | Un enlace de evidencia se describía como prueba automática; récord de partida impreciso | Evidencia aportada no equivale a verificación; récord anterior detallado se suma con desglose y total sin detallar va aparte |
| `src/app/components/RecordCards.tsx` | Categoría de peso del nivel actual se repetía en la tarjeta histórica de otro nivel | Solo muestra categoría cuando coincide el nivel de la disciplina con el de esa tarjeta |
| `src/app/components/RecordCards.tsx` | `NC` podía resultar opaco | Explica «sin decisión» cuando existe y enlaza desde cada tarjeta a `/ayuda#respaldo` |
| `tests/unit/dates.test.ts` | Sin regresión de las consultas durante la tarde y medianoche | Seis casos de verano/invierno, hoy/ayer/mañana y cambio de día |
| `tests/e2e/calendario.mjs` | Sin prueba específica de filtros/días de calendario | Datos ficticios únicos de ayer/hoy/mañana; comprobaciones de conjuntos, filtro individual, periodo desconocido y explicaciones públicas |
| `tests/e2e/accesibilidad.mjs` | Elegía ficha de una velada de hoy mediante filtro de pasadas | Usa todas las fechas para seguir midiendo la ficha tras corregir el calendario |
| `package.json` | Nuevo guion fuera del conjunto de CI | Añade `calendario.mjs` a `test:e2e`; sin dependencias nuevas |
| `docs/MAPA-FUNCIONAL.md` | Faltaba el nuevo export de fechas | Regenerado con `npm run mapa` |

## Validación local

- `npm ci`: correcto.
- `npm run typecheck`: correcto.
- `npm test`: **313 pruebas / 25 ficheros aprobados** (la base tenía 307; no el número antiguo de 266 del traslado).
- `npm run mapa` y `npm run mapa:comprobar`: correctos.
- `npm run build`: compilación de producción correcta con Next.js 15.5.26 y Prisma 6.19.3.
- `node --check tests/e2e/calendario.mjs` y `git diff --check`: comprobaciones de sintaxis y diferencias.

**Límite:** no se ejecutaron localmente las pruebas E2E ni axe del código modificado. No había PostgreSQL y el intento de instalación falló por permisos del entorno. La demo navegada es la versión previa. No presentar el recorrido de todos los roles ni la accesibilidad como aprobados sin consultar el CI.

## Qué debe hacer Claude después

1. Localizar la propuesta de la rama `codex/claridad-calendario-2026-10-03` y comprobar qué se integró; no repetir ni sobrescribir el trabajo de otra rama sin comparar.
2. Revisar `npm run test:e2e` y `npm run test:a11y` en CI, reproducir cualquier fallo y registrar causa y corrección. Para la prueba de calendario, usar una base local/de CI; nunca ejecutar sus inserciones en la demo o en producción.
3. Confirmar portada y calendario con una velada de hoy antes y después de las 12:00 UTC, y el cambio de día de Madrid. La portada filtra amateur/Madrid y solo seis eventos: acotar cualquier prueba al conjunto correcto.
4. Probar una ficha con combates PRO y AMATEUR: cada tarjeta debe usar únicamente su categoría correspondiente; el récord anterior sigue como antes.
5. Recorrer las personas pendientes: moderación, seguridad/cuenta, móvil/teclado, persona mayor y exploración destructiva. Las revisiones de este bloque **no completan** esa auditoría.
6. Seguir `COMPETENCIA.md`: mejorar información práctica de gimnasios y trayectoria por disciplina con datos mantenibles antes de añadir reservas, sparrings o un CRM amplio.
7. Mantener abiertas las decisiones del fundador: unidad de aura, menores, privacidad y fichas de terceros, sexo/edad/categorías, etc. No se resolvieron aquí.
8. Comprobar qué rama despliega Render antes de esperar cambios en la demo. Este bloque no cambia configuración ni credenciales de Render.

## Comunicación y documentación

Se actualizan `CLAUDE.md`, `TRASLADO.md`, el índice, `COMPETENCIA.md`, `DIARIO.md`, `IDEAS.md`, `LECCIONES.md` y `ARQUITECTURA.md`, además del mapa generado. Este documento sirve como comunicación persistente por GitHub; no se afirma haber enviado un mensaje a la sesión privada de Claude.


## Validación en GitHub — primera ejecución

El CI 77 de la propuesta #8 superó instalación, migraciones/paridad, TypeScript, mapa, unitarias, compilación y arranque. Falló en `flujo.mjs:232`: el ayudante `registrar()` usaba un selector global de disciplina y Playwright elegía el primero de cuatro, oculto dentro de otro formulario. El log muestra `element is not visible` en `ayudas.mjs:50`. No llegó a la nueva prueba de calendario ni a axe.

Se corrige `tests/e2e/ayudas.mjs` acotando el selector al formulario que contiene el botón «Registrar este combate». Se conserva la misma acción y sus comprobaciones: no se salta la prueba ni se amplía el tiempo de espera. Siguiente ejecución pendiente; no integrar hasta comprobarla.


## Segunda ejecución del CI

CI 79: se completó el recorrido de `flujo.mjs`, incluido el registro de MMA. Quedó una comprobación negativa incorrecta: «y excluye a quien no» buscaba el nombre en todo `body`, donde también aparece en el resumen del filtro `q`. Se cambia a comprobar la tarjeta de resultado y, para la exclusión, el mensaje visible de cero resultados más ausencia de esa tarjeta. La inclusión ahora también exige tarjeta visible, evitando que el propio filtro la haga pasar. No se modifica el filtro de producto. Se repite CI; aún no se declara E2E/axe aprobado.

## Continuación: récords profesional y amateur

Petición del fundador: «continua el trabajo». Este bloque conserva las correcciones recientes de #8 y añade `tests/e2e/respaldo.mjs` al conjunto de CI. Mediante la web crea su propio peleador ficticio, registra resultados amateur y profesionales (incluido NC), cambia la categoría en ambos sentidos y comprueba ficha privada, ficha pública y ayuda.

La categoría actual debe aparecer únicamente en su tarjeta; la histórica no hereda una categoría de otro nivel. El récord profesional queda `1-0-0 (1 NC)` y el amateur `1-0-0` tras ambos cambios. Todos los campos de `registrar()` quedan acotados a su formulario, conservando doble clic y caminos de error.

Se corrige también el bloqueo observado en la ejecución `37109729125`: la expresión `peleadores?` de `tests/e2e/filtros.mjs` no acepta «1 peleador encontrado». La comprobación ahora exige las frases españolas completas, singular o plural, conservando la comprobación de categoría y recuento. No cambia el producto ni se omite la prueba.

Rama: `codex/validacion-records-2026-10-03`, base `e049fe4`. Sintaxis y diferencias comprobadas localmente. El proxy no responde y faltan dependencias, por lo que la validación completa se hizo en GitHub Actions.

**Resultado aprobado:** commit `233420c41702c159938fb1f2a3c402ddc555117d`, [ejecución de la propuesta #9 `37110167176`](https://github.com/romppao/MiClaude/actions/runs/37110167176): instalación, migraciones y paridad del esquema, tipos, mapa, 313 unitarias, compilación, conjunto E2E completo y axe correctos. El nuevo guion aprobó sus 17 comprobaciones; axe midió 0 incumplimientos, 0 graves o críticos. El código probado incluye también el calendario de #8. Esto no convierte las ejecuciones fallidas anteriores de #8 en aprobadas: consultar cada commit y su CI.

Este bloque no completa la auditoría por personas ni integra o despliega la demo. Siguiente trabajo: revisión e integración de las propuestas, recorridos de seguridad/móvil/persona mayor y paginación real de moderación.


### Revisión de los guiones que siguen al primer flujo

La inspección encontró el mismo `body.includes(q)` en `integridad.mjs`, para una ficha provisional; se aplica la misma comprobación de listado vacío y ausencia de tarjeta. Además, la prueba de paginación en `busqueda.mjs` creaba 30 fichas sin `FighterDiscipline` pero filtraba por amateur; desde el último cambio de Claude, el nivel se filtra en la disciplina. Se crean también sus disciplinas amateur en los datos de prueba. Se mantienen las 30 fichas, la paginación y el filtro: no se relaja la prueba ni se cambia el producto.

## Divisiones deportivas por edad — 3 de octubre de 2026

Rama `codex/categorias-edad-reglamentos-2026-10-03`, partiendo de la continuación de #9. Petición del fundador: incluir las categorías de boxeo desde escolares hasta élite y comprobar las otras disciplinas. Fuentes primarias, tablas, cobertura y límites en `DISENO-PESOS.md`.

Incluye todas las edades y pesos de boxeo amateur RFEBoxeo 2026; tablas IFMA y WAKO ring/tatami; edades IMMAF 2026 e IBJJF con sus pesos aún pendientes de contraste completo. Añade división versionada en ficha y combate, guardas de edad y combinación en servidor, selección histórica independiente, búsqueda y ránking por división del combate. Benjamín/prebenjamín permiten ficha formativa, pero no combates. Los registros anteriores no se convierten automáticamente en élite ni masculino. Se actualiza la ayuda y el texto de privacidad para explicar la información deportiva declarada.

La propuesta incluye los cambios funcionales anteriores de #8/#9 y conserva la documentación posterior de ambas ramas y de la principal (color oficial #BE33F5 y referencias). No altera el diseño ni publica la demo. Validación local final aprobada: migraciones desde base vacía/paridad, tipos, mapa, 327 unitarias, compilación y 289 comprobaciones E2E, incluidas las 18 del nuevo recorrido de categorías. Axe: 0 incumplimientos, 0 graves o críticos. La propuesta apunta directamente a `claude/ring-espana-mvp`; permite revisar e integrar el conjunto sin depender de resolver primero las propuestas encadenadas. La integración y el despliegue siguen pendientes.


## Estado del CI 83 y relevo honesto

La ejecución 83 (run `37109604469`, commit `e049fe4f83bcf63a2fe1dd7772f5b5147f893c5f`) vuelve a fallar en la comprobación del aviso de ficha sin titular con el mismo nombre, un fallo intermitente previamente documentado. Se descargó e inspeccionó el artefacto `11269835165`: la captura de Nuria muestra ya la ficha creada. Esa captura posterior no permite demostrar qué estado exacto había al comprobar el aviso; no se atribuye sin evidencia a un problema de espera ni se modifica el producto a ciegas. Sigue pendiente reproducir esa comprobación y completar los guiones posteriores, la nueva prueba de calendario y axe. La propuesta #8 sigue en borrador y no se ha integrado ni desplegado.

## Propuestas visuales solicitadas después

El fundador pidió propuestas de aspecto en paralelo al desarrollo y añadió: «Debemos tener una gama de colores opuesta a la competencia que es Raunder». Se mostraron tres direcciones iniciales y se revisó la segunda para recomendar petróleo `#083D3B`, marfil `#F2EFE7`, pizarra `#152526` y menta `#BFE6D8`, tras observar los rojos de Raunder. Se descartaron rojo y naranja como propuestas de marca. También se corrigió la maqueta para no inventar porcentajes de aura ni una confirmación de toda la ficha. Detalles y estado de elección en [DISENO.md](DISENO.md). Son propuestas, sin cambios visuales aplicados a la demo.


### Ajuste tras el comentario sobre garra y valentía

El fundador no se mostró convencido con petróleo/marfil y pidió que la marca represente a la comunidad española de deportes de contacto con más garra. Se mostró una segunda revisión con azul noche `#0B1F3A`, amarillo oro `#F3C316` y blanco cálido `#F5F4EE`, títulos deportivos contundentes y fotografía de mujeres y hombres entrenando. Esta es la recomendación actual de Codex, pendiente de elección; la anterior no estaba aprobada. No se ha implementado ni desplegado ninguna de las dos.


### Valoración posterior del diseño

El fundador valora mejor azul noche/amarillo oro, pero considera la composición pobre y con aspecto de IA. Se conserva la paleta como base de exploración y se rehace la propuesta visual de veladas con referencias de cartelería deportiva, cuerdas del ring, listados editoriales y amarillo más contenido. Diseño sin aprobar ni implementar. Detalle del comentario y pendientes en DISENO.md.


## Decisión vigente de color y recursos de diseño

El fundador ha elegido `#BE33F5` como color oficial. Se mantiene su petición de una aplicación más juvenil y llamativa que las propuestas anteriores. Se consultaron los quince recursos de su imagen, con límites de acceso documentados, y se revisaron visualmente ejemplos deportivos de Landbook. Se mostró una nueva portada violeta de comunidad. Solo el color está aprobado; diseño, logotipo y tipografía siguen abiertos. No hay cambios gráficos aplicados a la demo. Fuentes y decisiones en DISENO.md y aviso explícito en CLAUDE.md.

## Aplicación de los diseños aprobados — 3 de octubre de 2026

Origen: el fundador pidió «ya puedes aplicar todo esto a la aplicación en GitHub» para verlo en Render. Se implementa #BE33F5 con brillo, esquinas redondeadas, portada de comunidad adaptable y la misma cabecera para peleadores, gimnasios, entrenadores, promotores y federaciones. Las fotos y banners son independientes, con encuadre horizontal/vertical y eliminación. La imagen de portada es ilustrativa y sus personas ficticias.

Los peleadores conservan nivel amateur/profesional y categoría por disciplina. Jiu-jitsu incorpora cinturón y grados opcionales, marcados como declaración del deportista; no son una acreditación federativa. Se conservan récords por disciplina y aura por combate.

### Implementación y permisos

Nuevo módulo `src/lib/profiles`, componentes ProfileHeader/ProfileEditor y editor `/perfiles/[kind]/[id]/editar`. Peleadores y promotores editan su propio perfil; moderación puede editar todos. Moderación asigna gimnasios, entrenadores y federaciones a cuentas con correo confirmado; el titular encuentra sus perfiles en Mi cuenta. Las federaciones se crean desde el directorio por moderación y no llevan acreditación automática. No se inventan perfiles de entidades ni se asigna su control automáticamente.

La migración `20261003140000_identidad_perfiles` añade Profile y cinturón/grados; no borra registros existentes. Fotos WebP en PostgreSQL para persistir entre despliegues de Render sin disco persistente. Sharp comprueba formato real, tamaño máximo 4 MB por imagen, máximo 25 millones de píxeles, descarta animaciones, retira metadatos y reduce dimensiones. La ruta de imágenes verifica visibilidad y permisos; no publica imágenes de fichas ocultas. La exportación de cuenta incluye las imágenes; anonimizar un peleador retira su personalización y graduación.

### Validación y despliegue

339 pruebas unitarias pasan y la compilación de producción pasa. Nueva prueba de navegador `tests/e2e/perfiles.mjs`: subida real, persistencia, encuadre, cinturón visible, otra cuenta rechazada, eliminación e imágenes ocultas. La validación completa de PostgreSQL, migraciones, navegador y accesibilidad se ejecuta en CI antes de integrar. No hay PostgreSQL disponible en este entorno local. Se incorporan correcciones verificadas de los selectores y datos de las pruebas antiguas; no se desactiva ninguna prueba. El estado final de CI y publicación se registrará en el PR.

Render está configurado en `render.yaml` para la rama `claude/ring-espana-mvp`; `scripts/arranque-demo.sh` aplica migraciones. La actualización se ha combinado con la rama vigente de la demo (7580902), preservando las categorías por edad, la comunicación inclusiva y el calendario incorporados durante el trabajo.
## Continuación urgente — Comunicación inclusiva, 3 de octubre de 2026

Petición del fundador: no dar a entender que Madrid y boxeo son la prioridad pública, para que otras ciudades y disciplinas no se sientan excluidas. Portada nacional sin filtro de nivel o disciplina, consultas y contadores acordes, disciplinas alfabéticas con igual énfasis. Ránking inicial nacional con todas las disciplinas, agrupadas por sus propias categorías y posiciones. Altas de fichas/veladas sin ciudad, provincia ni disciplina asumidas, con selección y validación explícitas; edición conserva lo guardado. Ayuda, metadatos, búsqueda y README coherentes. «Hora de Madrid» se explica como hora peninsular del calendario, sin cambiar la zona técnica ni las ubicaciones reales. La norma editorial está en `CLAUDE.md`; las entradas históricas del diario se conservan. Se añaden comprobaciones de datos de varias disciplinas y provincias y se actualizan los datos explícitos de los guiones anteriores. Esta continuación conserva las categorías por edad y todo el trabajo de #10. Integración y despliegue pendientes.

Validación local de esta continuación: tipos, mapa, 327 unitarias, compilación, 307 comprobaciones E2E y axe con 0 incumplimientos (0 graves o críticos). Los 18 casos nuevos se ejecutaron también dentro de la batería completa.

## Integrado y publicado en la demo — 3 de octubre de 2026

Por autorización expresa del fundador, se integró [#11](https://github.com/romppao/MiClaude/pull/11) en `claude/ring-espana-mvp`, commit `7580902d63f4deec42c41f1cb29c5b913e009451`. Incluye #8/#9/#10: no hace falta integrar esas propuestas por separado para tener los cambios funcionales. Su árbol coincide con el probado. CI de #11 aprobado (ejecución 99); CI de integración también aprobado: <https://github.com/romppao/MiClaude/actions/runs/37127024537>.

[Demo actualizada](https://ring-espana-demo.onrender.com/): se comprobaron respuestas 200 de portada (título de toda España), ránking (todas las disciplinas/niveles y España), ayuda inclusiva con divisiones por edad y salud con base conectada. La actualización automática de Render tardó unos minutos. Los datos existentes se conservan. Las anotaciones anteriores de integración/despliegue pendientes describen estados previos, ya superados para este bloque. Los pendientes normativos y visuales siguen siendo los de sus documentos.

### Resultado de CI #107
Migraciones y equivalencia de esquema, tipos, 339 tests y build correctos. Pasaron todas las comprobaciones de personalización de los cinco tipos. Se actualiza el selector del sello de gimnasio al cambiar su ubicación en la cabecera; la prueba sigue verificando la marca y que su nota interna no se publica. Se amplía la medición de accesibilidad a los editores de entidades. El siguiente CI debe completar todos los guiones antes de desplegar.

CI #109 confirmó la accesibilidad de los editores de gimnasio, entrenador y federación. La prueba intermitente de reclamación ahora espera tanto el aviso como el botón y finaliza el diagnóstico antes de continuar, para no confundir la segunda creación con el estado comprobado. Las exigencias funcionales no se reducen.

## Resultado final: publicado y comprobado en Render

3 de octubre de 2026. PR #12 integrada mediante el commit `8a861e7ba90b45e2417e6c8c77c696934b20f770` en `claude/ring-espana-mvp`. CI #111 completamente correcto: https://github.com/romppao/MiClaude/actions/runs/37128631610 (migraciones y equivalencia de esquema, tipos, mapa funcional, 339 pruebas unitarias, build, todos los guiones de navegador y accesibilidad WCAG 2.2 AA).

Comprobación pública después del despliegue: portada `https://ring-espana-demo.onrender.com/`, listado de boxeo amateur enviado por el fundador y ficha `/peleadores/sergio-demo-molina`. Se observaron el violeta, el glow, las esquinas redondeadas, la fotografía ilustrativa de portada, las tarjetas y la cabecera de perfil. El archivo de portada también se sirve correctamente; puede tardar en cargar la primera visita. No se resetearon los datos de la demo ni se trasladaron los usuarios ficticios del CI.

Para personalizar: peleador → Mi ficha → Editar foto y banner; promotor o titular de una entidad → Mi cuenta → su perfil. Moderación puede asignar titulares con correo confirmado desde el editor y crear federaciones desde su directorio. Sin foto aparece una identidad con iniciales; sin banner, el fondo violeta. La demo no atribuye fotografías ficticias a los peleadores.

Este resultado sustituye los estados «pendiente de elección», «sin modificar la demo» y «pendiente de comprobar CI» de las entradas históricas de diseño. Las categorías por edad y la comunicación nacional incorporadas previamente se mantienen.

## Continuación — Trayectoria, respaldo opcional y menú, 3 de octubre de 2026

Base: `6670b357cf4125dcec8179e397a120b04b68e588`, posterior a #12 y su documentación de despliegue. Rama `codex/trayectoria-respaldo-aura-2026-10-03`. Se conservan la identidad violeta, perfiles, fotos, banners, categorías deportivas, calendario e inclusión nacional.

El fundador autoriza configurar trayectoria y aura con honestidad declarada, sin verificación obligatoria de rivales/entrenadores/federaciones. Rival pide revisión; no suspende ni elimina puntos. Nuevas rutas `/mi-ficha/trayectoria`, `/respaldar`, `/moderacion/acreditaciones`. Acreditación separada de perfiles y rol de cartel, fuente/nota de hechos, límites de disciplina y prohibición de autoaval, versiones concurrentes, retirada/reactivación. Migración aditiva `20261003160000_trayectoria_respaldo_aura`, sin reset ni avales ficticios de datos anteriores.

Política v1 en `lib/aura/trajectory.ts`: título regional/nacional/internacional 20/50/80; documento +25 %, entrenador/organizador +50 %, federación +100 %. Mayor aporte de un título por categoría; niveles sustituidos, no acumulados. Bonus por combate 1/2/3 con máximo 40 por categoría; voto elegible +1. La categoría es histórica, no la actual de la ficha. 90 días limita los votos, manteniendo trayectoria. Los títulos retirados/excluidos no cuentan; retirar acreditación elimina bonus. Cambios de hechos/fuentes retiran el respaldo; una solicitud no reemplaza la fuente ya comprobada. La puntuación deportiva estadística y la calibración de escala quedan para datos reales.

Exportación y eliminación contemplan títulos, acreditación y copias en auditorías. El menú toma la distribución de la captura del fundador: deportistas, clubes/entrenadores, promotores, cuenta/ayuda. Usa diálogo nativo con foco/Escape, cierre al navegar o salir y permisos reales. Compartidos sin importaciones de acciones; el formulario de salir se pasa desde layout.

Validación local: migraciones/paridad, tipos, mapa y compilación aprobados; 393 pruebas unitarias. Batería completa de 364 comprobaciones E2E aprobada y repetición final de las 26 de trayectoria, incluida una adicional de privacidad (365 comprobaciones en la batería actual). Axe final: 0 incumplimientos, 0 graves o críticos. CI comprobará el árbol final completo antes de integrar. El resultado público se registrará tras el despliegue.

### Publicación comprobada

Integrada [#14](https://github.com/romppao/MiClaude/pull/14) en `claude/ring-espana-mvp`, commit `0c3fde6c2f0ebb68bdbc0b2b8778a9c3d6765d5b`. [CI #131](https://github.com/romppao/MiClaude/actions/runs/37147966389) aprobó migraciones/paridad, tipos, mapa, 393 unitarias, build, 365 comprobaciones E2E y axe sobre 37 pantallas con 0 incumplimientos. Árbol integrado idéntico al comprobado: `3aa7058c31d970231577a075e55e5bcd414bc664`.

Render ya sirve portada con Menú, ayuda con fórmula/bonificaciones, ránking con la nueva explicación y salud 200. La comprobación pública usa HTTPS con confianza TLS del entorno. Los datos existentes se conservan. Se precisa una frase antigua de ayuda: es el reconocimiento de comunidad el que se liga a un combate; el aura total incluye títulos. Esta continuación de documentación y texto no modifica las reglas probadas.

Relevo para Work: la propuesta móvil #13 sigue abierta y comparte layout/CSS con #14. Antes de integrarla, conciliar sus mejoras adaptables y MobileNav con NavigationMenu; evitar dos controles de menú o sustituir los grupos por actividades. No se ha integrado ni descartado el trabajo de esa rama.
