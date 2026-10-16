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

## Pulido funcional y diseño aplazado — 3 de octubre de 2026

Base `dbecb53281f9c265081749acbbb71fd232c486df`, rama `codex/pulido-funcional-2026-10-03`. Petición: «Que más queda por hacer? pulamos la aplicación hasta el más mínimo detalle […] el [diseño] que está no me gusta […] desorganizado y saturado». La composición actual es provisional; no se ha rediseñado en este bloque. El relevo vigente está en PULIDO-FUNCIONAL y CLAUDE.

Colas y seguimiento: paginación de avisos, reclamaciones, organizadores, gimnasios, señales, combates y suspensiones; títulos/resultados, acreditaciones e historial. Total real, 50 registros, desempate estable, parámetros independientes, búsqueda de acreditaciones y salidas vacías. Las decisiones conservan filtros/página y una sección validada por ruta; el aviso se enfoca y permite retomar la cola. Se corrigen etiquetas retiradas, categoría omitida y fuentes de solicitudes desplazadas por el límite global.

Integridad: verificación condicionada al resultado leído, resolución de avisos reservada en transacción, edición de evidencia condicionada al respaldo/estado/hechos, opciones desconocidas rechazadas. Sin migración, cambios visuales ni cambios de aura. Auditoría y traslado ya no presentan como sin empezar varias tareas con código/pruebas existentes; los parciales permanecen abiertos.

Validación local inicial: 405 unitarias, build y 26 nuevos checks E2E aprobados. La batería completa, axe, CI y demo se comprueban antes del cierre. Guion nuevo con más de 100 registros por cola, 351 solicitudes/cambios y pantallas antiguas; prefijos propios retirados al terminar. Base local de pruebas separada, sin borrar la anterior ni subir fixtures a Render.


### Cierre de validación local

El árbol final aprueba 406 unitarias y compilación de producción. Recorridos repetidos sobre el build final: 28 checks nuevos de volumen/integridad, 26 de trayectoria y 49 de usabilidad; axe en 37 pantallas, 0 incumplimientos. La regresión anterior pasó 389 de 391 y detectó dos mensajes de organizador bloqueados por validación nativa; los recorridos afectados pasan tras corregirlo. CI ejecutará la batería completa final (393 comprobaciones) antes de integrar. No se presenta la pasada anterior como completamente verde.

También se protege la restauración de títulos: solo procede para uno excluido y no puede retirar el respaldo de uno activo. La prueba de volumen ahora consulta los totales y el orden reales antes de comprobar la tercera página: funciona también al reutilizar la base con datos de otros guiones. La publicación y su comprobación pública se registran después de CI.


### Integración comprobada

Integrada [PR #15](https://github.com/romppao/MiClaude/pull/15) en `claude/ring-espana-mvp`, merge `0bf5b9399bb9f06f62a0e4fdf5e6c582c27a5634`. [CI #137](https://github.com/romppao/MiClaude/actions/runs/37158841984) aprueba migraciones/paridad, tipos, mapa, 406 unitarias, compilación, 393 comprobaciones de navegador y axe en 37 pantallas: 0 incumplimientos, 0 graves o críticos. Árbol probado e integrado idéntico: `812da937097a5362123cbb3bd8b73c9b3008f0b7`; head revisado `cc2e17987f56037f88b574f1b8740ab16c4fd247`, base `dbecb53281f9c265081749acbbb71fd232c486df`, ambos comprobados antes de fusionar. La prueba completa final supera también los dos recorridos que habían fallado en la regresión local anterior.


### Comprobación pública del primer despliegue

Render sirve el pulido #15: portada, ayuda, ránking y `/salud` responden 200 por HTTPS con verificación TLS. El bundle compartido cambia de `layout-c9e2e3184aacfcf6.js` a `layout-febc489e998a92be.js` y contiene sección, foco y enlace de vuelta; SHA-256 `ba2162b7780bac81eed6ff191289b1e7a6acc11b5fb2ac6d8a2a47ab60f1c473`. Es una comprobación de despliegue, no una prueba autenticada de las colas públicas; esas acciones se recorrieron en local/CI. Los datos de volumen no se subieron a Render.

La comprobación de acceso privado descubrió un detalle adicional: `/respaldar` pedía sesión sin recordar la ruta de vuelta, al contrario de las páginas de moderación. Se transmite la ruta a través de las guardas de sesión verificada y respaldo, sin conceder permisos. Dos checks nuevos comprueban el mensaje/destino y el regreso real tras entrar con una cuenta autorizada; tipos, unitarias, build, navegador y CI se vuelven a comprobar por este cambio de código.

Validación local del retorno: 406 unitarias, build de producción y 30 checks del guion de pulido aprobados; el guion también mide axe sobre las colas pobladas sin incumplimientos. CI comprobará el árbol completo con 395 comprobaciones de navegador antes de integrar esta continuación.


### Validación e integración final del retorno

[PR #16](https://github.com/romppao/MiClaude/pull/16) integrada con merge `d9fba959cfe79da379adab9f42237c7b2d73322c`. [CI #142](https://github.com/romppao/MiClaude/actions/runs/37159831793) aprueba migraciones/paridad, tipos, mapa, 406 unitarias, compilación, **395 comprobaciones de navegador** y axe en **37 pantallas, 0 incumplimientos**. Árbol comprobado e integrado `ae120c766bfc5761298bd9fa835e62c93a31915c`. Antes de fusionar se verificaron el head `0e094d62c95ee6e320f30280cec49cb8731ff823` y la base `0bf5b9399bb9f06f62a0e4fdf5e6c582c27a5634`. Las dos comprobaciones nuevas de acceso completan las 393 de #15; no se omiten ni sustituyen recorridos.


### Demo final comprobada

El 3 de octubre a las 23:03 UTC, Render sirve también #16: `/respaldar` sin sesión lleva a `/entrar?next=%2Frespaldar&problema=sin_sesion`; portada, ayuda y salud responden 200 por HTTPS con verificación TLS. El regreso autenticado se recorrió en navegador local y en CI; no se crearon cuentas ni fixtures en la demo para esta comprobación. Los datos existentes se conservan. Esta continuación de cierre modifica solo documentación.

Siguiente trabajo: resolver solapamientos del historial/registro inicial y catálogos IMMAF/IBJJF; herramientas de entidades; errores y recorridos con personas; preparación de correo, copias y privacidad/menores. No se declaran cerrados por las pruebas automatizadas. Diseño provisional, a retomar al final mediante briefing con el fundador; #13 sigue abierta, sin sobrescribir el trabajo de Work.


## 8 de octubre de 2026 — Documentación para transferencia a programadores humanos

**Pedido por el fundador:** «que absolutamente todo el código […] esté bien explicado» para que un programador pueda entender el proyecto, sus decisiones y procesos cuando ya no se utilicen asistentes de IA. Petición directa de mantenimiento documental; no es un intento nuevo de las pruebas de ingreso (las entregas de Codex ya tienen PR #21/#22).
**Base:** `claude/ring-espana-mvp`, `a34deabb856ff027d74bc15cce8b1abdd943611f`. **Rama de trabajo:** `codex/documentacion-mantenibilidad-2026-10-08`. **PR:** se enlaza tras publicar.
**Entorno y capacidad:** Node 24 disponible; sin dependencias npm instaladas ni PostgreSQL/Chromium local. El clon directo falló al conectar con el proxy; los textos se recuperaron por el conector de GitHub a un SHA fijo. La copia local es una instantánea de revisión, no un clon con toda la historia/recursos. No se consultaron claves de ingreso.
**Qué cambié y por qué:** manual en `docs/mantenimiento/` (módulos, flujos, datos, decisiones y operación); catálogo con responsabilidad individual de los 226 archivos mantenidos; generador Node sin dependencias y comprobación en CI; contratos comentados en sesión, imágenes/perfiles, escala de aura y ayudantes. Correcciones de documentación vigente: acciones modulares, guardas en accounts, entrenador/clases, v3, perfiles y enlace de baja reutilizable. Regla de transferencia en AGENTS y lista de revisión. Se mantienen historial y comportamiento del producto.
**Compartidos tocados:** `.github/workflows/ci.yml` para comprobar catálogo y su herramienta; `AGENTS.md`, guías y registro. No se modifican schema/migraciones, diseño, proveedores ni datos reales. Claude debe regenerar catálogo al integrar PR #23/#24/#26 o cualquier archivo nuevo, y añadir su responsabilidad explícita.
**Qué ejecuté yo:** generación y comprobación de catálogo; nueve pruebas Node de omisiones, bajas, duplicados, guías/rutas, cambios sin regenerar, salida manipulada, estabilidad y enlaces simbólicos. La ejecución directa `node tests/documentacion/catalogo.test.mjs` muestra 9/9; el runner aislado de este entorno resume el archivo como un único subtest, por lo que no se usa ese resumen para afirmar nueve pruebas. Comprobaciones finales y resultado CI se anotan después.
**Qué no ejecuté localmente:** tipos, vitest del producto, build, mapa AST y recorridos de navegador/axe por ausencia de dependencias/base/navegador; el CI conserva esos pasos. No se afirma escalabilidad medida ni transferencia humana validada.
**Qué salió mal:** proxy de clon inaccesible; dos parches fallaron antes de aplicar por no usar línea de contexto completa, corregidos sin cambios parciales. Una primera referencia al nombre de creación de ficha se contrastó con el export real y se corrigió a `createMyFighter` antes de publicar.
**Qué debe hacer Claude:** revisar exactitud/contratos y CI del último commit; contrastar límites de la base contra los PR funcionales aún abiertos; actualizar responsabilidad/guías y regenerar catálogo en sus cambios; pedir a un programador independiente que arranque, localice una regla y modifique un flujo usando solo estas guías, registrando cualquier atasco.
**Decisiones del fundador abiertas:** ninguna nueva para este bloque. Las decisiones anteriores siguen su protocolo. Integración y despliegue pendientes de revisión y autorización según EQUIPO; no se ha fusionado ni cambiado la demo.

### Comprobación local final del bloque documental

`node scripts/generar-catalogo.mjs --comprobar`: 226 archivos, aprobado. `node --test --test-isolation=none tests/documentacion/catalogo.test.mjs`: nueve pruebas, nueve aprobadas (Node 24); también pasan en ejecución directa. `node --check scripts/generar-catalogo.mjs` y `git diff --check`: aprobados. Contraste de 244 destinos locales del manual/catálogo contra el árbol remoto y los archivos nuevos: ninguna ruta inexistente. Comparación de los seis archivos del producto contra su base: solo inserciones de comentarios, sin cambios de sentencias. Base remota comprobada antes de publicar: permanece en `a34deabb856ff027d74bc15cce8b1abdd943611f`.

El control de catálogo alcanza código, pruebas, scripts, migraciones y configuración (incluidas nuevas configuraciones reconocidas en la raíz). Excluye recursos binarios, dependencias, resultados y exámenes aislados; no implica documentación línea a línea del código de terceros ni aprobación semántica automática. Contratos y contenido requieren la revisión del líder y la prueba humana de transferencia.

### Propuesta publicada para Claude

[PR #28](https://github.com/romppao/MiClaude/pull/28), en borrador, contra `claude/ring-espana-mvp`. El conjunto revisable contiene manual/catálogo, control y pruebas, comentarios y correcciones documentales. El resultado de CI del último commit se consulta en la pestaña Checks del PR y se registra en su descripción al terminar; no se afirma aquí que haya pasado antes de ejecutarse. Sin integración ni despliegue.

### Coordinación mientras Claude ejecuta cambios — 8 de octubre de 2026

El fundador indica que Claude está ejecutando otra tarea y pide a Codex «no editar nada del código ni nada. Simplemente documenta lo que está pasando». La actualización de las explicaciones afectadas queda pendiente de su señal explícita de que Claude ha terminado.

Durante este periodo, el alcance de Codex es exclusivamente documental: no modificar código, pruebas, scripts, configuración ni migraciones; tampoco integrar o desplegar propuestas. Esta anotación se añade únicamente al relevo de Codex en su rama de documentación, sin modificar la rama de trabajo de Claude.

El manual describe la base `a34deabb856ff027d74bc15cce8b1abdd943611f`; no se presenta como documentación de los cambios que Claude está realizando. Tras recibir la señal del fundador, contrastar el código final y sus diferencias, actualizar las explicaciones correspondientes e identificar el commit documentado y los puntos que sigan pendientes. No anticipar decisiones ni resultados de la tarea en curso.

El CI de la propuesta documental pasó sobre `a3a9f9b1688ddde61ffdfc32a414e434f9b4497e`: [ejecución del PR](https://github.com/romppao/MiClaude/actions/runs/37748009534). Ese resultado corresponde al bloque anterior, no valida los cambios en curso de Claude ni esta anotación posterior. La propuesta #28 quedó lista para revisión; su integración y despliegue siguen pendientes.


## 10 de octubre de 2026 ? Optimizar pantallas conservando el dise?o
Petici?n expl?cita del fundador: conservar el dise?o que le gusta, optimizar toda la p?gina sin orden de prioridad y dejar el logo para el final porque todav?a no lo ha elegido. Base d1e7ace, rama codex/optimizacion-visual-20261010, carpeta independiente MiClaude-codex-optimizacion.
Cambios compartidos: globals.css (archivo delicado), Foto y Pestanas; regresi?n de navegador independiente de PostgreSQL y paso de CI (archivo delicado). No se cambian logo, nombre, paleta, fuentes ni distribuci?n de navegaci?n. Detalle en OPTIMIZACION-PANTALLAS.md.
Ejecutado: TypeScript y compilaci?n Next correctos; 12 comprobaciones en Chrome; captura habitual en reposo id?ntica antes/despu?s; 647/649 unitarias correctas. Dos fallos locales de multimedia por rutas POSIX en Windows, en c?digo sin modificar; no se han relajado esas pruebas. No hay PostgreSQL local disponible; bater?a de usuarios/base y Safari real pendientes de CI/dispositivo.
Documentaci?n generada: cat?logo actualizado; mapa sin cambios funcionales, generado con una copia temporal que normaliza separadores de ruta en Windows, sin editar el generador. No se tocan carpetas o cambios de otros asistentes. Pendiente revisar CI y propuesta antes de integrar.

Correcci?n de verificaci?n (10 oct, Codex): el primer CI de la rama se detuvo porque el cat?logo conservaba huellas CRLF de render.yaml y vitest.config.mts. Se regener? desde una exportaci?n del commit con core.autocrlf=false para obtener exactamente los bytes de Git, sin cambiar esos archivos ni las comprobaciones. Las 9 pruebas documentales s? pasaron en Linux.


## 10 de octubre de 2026 — Experiencia gráfica y móvil (Codex)
Encargo explícito del fundador: rendimiento, interacción móvil, GSAP, shaders y Three.js conservando identidad; autorización para subir rama independiente y PR, sin desplegar. Implementación, límites y pruebas en [EXPERIENCIA-ELITE.md](EXPERIENCIA-ELITE.md). PR #41. Base de pruebas PostgreSQL propia disponible en esta sesión; no se reutilizan datos reales. Compilación y pruebas locales de navegador correctas; 647/649 unitarias Windows (dos fallos preexistentes POSIX). Validación completa de este bloque pendiente de CI Linux.


## 10 de octubre de 2026 ? Correcci?n de bienvenida y adaptaci?n (Codex)
El fundador rechaza el ring flotante de bienvenida y pide adaptaci?n real a escritorio. Se retira ese objeto y se conserva la composici?n m?vil; escritorio presenta fotograf?a y acciones lado a lado. Pantallas de datos m?s anchas, inicios a dos columnas y formularios con l?mite expl?cito de lectura. Detalle: ADAPTACION-DISPOSITIVOS.md. Build local correcto y 72 comprobaciones de adaptaci?n/accesibilidad correctas en Chromium; CI nuevo pendiente. Cambios publicados en la misma rama independiente por autorizaci?n previa, sin integrar ni desplegar.


## 13 de octubre de 2026 — Adaptación de móvil y escritorio
**Encargo:** revisar MiClaude y corregir móvil/escritorio con impeccable y break-ui; entregar nueva demo.
**Base:** d64de99, checkout limpio. **Rama propia:** codex/adaptacion-responsive-20261013. Sin PR, integración ni publicación remota; GitHub inaccesible.
**Cambios:** cabecera y distribución responsive, alturas flexibles, actualidad del visitante a ancho completo, noticias visibles, disciplinas en cuadrícula, cifras españolas, grafemas y alternativas de fotos. Archivo compartido delicado: globals.css. VistaVisitante separa consultas de presentación. /revision-ui solo desarrollo: fixtures ficticias por propiedades, sin base de datos. Detalle: REVISION-RESPONSIVE-20261013.md.
**Ejecutado:** 60 comprobaciones de navegador correctas en Chromium; tipos y build correctos; /revision-ui responde 404 en producción. Unitarias 650/652: dos fallos previos POSIX/Windows en multimedia sin modificar. Documentación 8/9: symlink EPERM de Windows. Catálogo de 327 fuentes comprobado desde copia temporal con LF, excluyendo next-env.d.ts generado. Mapa de 71 pantallas comprobado con copia temporal que normaliza rutas; generadores originales conservados.
**Límites:** base local detenida; sin batería completa de cuentas/escrituras ni Safari/teléfonos físicos. La demo es visual local: http://127.0.0.1:3137/revision-ui. Logs propios en docs/logs/. Sin migraciones ni cambios de datos o permisos.
**Siguiente:** revisión y CI Linux con base aislada antes de integrar/publicar con autorización específica.


## 13 de octubre de 2026 — Corrección de base oficial (Codex)
El fundador detectó que la revisión inicial usaba una copia antigua. Render confirma como live el commit 46c17253985aaf277b2801e41a80c81c2f386b16, Lona 0.9.0. Se importó el contenido oficial verificado y se conciliaron los ajustes en codex/adaptacion-lona-actual-20261013; no es un fetch de la ascendencia Git. Marca, foto, temas y funciones actuales conservados. Versión preparada 0.9.1, sin publicar.
Validación nueva: 106 comprobaciones visuales/interacción correctas en ambos temas y ocho anchos; unitarias 675/677, dos fallos previos POSIX/Windows. Faltan tipos/build completos por maplibre-gl no instalado y caché de npm incompleta. Catálogo 354 fuentes y mapa 74 pantallas comprobados. Sin migraciones, datos, publicación ni cambios en Render. Demo visual local http://127.0.0.1:3139/revision-ui con datos ficticios. Detalle y siguiente paso: docs/REVISION-LONA-ACTUAL-20261013.md. La validación build/tipos de la entrega anterior solo correspondía a la base antigua.


## Propuesta subida — espera indicada por el fundador
2026-10-13, Codex. El fundador autoriza subir la propuesta y pide esperar a que Claude termine sus revisiones antes de aplicarla. PR en borrador: https://github.com/romppao/MiClaude/pull/47, rama codex/responsive-lona-20261013, desde la base oficial 46c17253985aaf277b2801e41a80c81c2f386b16. Se verificó que la diferencia contiene solo los 23 archivos previstos (402 líneas añadidas/42 retiradas antes de esta anotación). El commit inicial de propuesta es f8c0dc7e9765940bb8d25248add7ccebf2af3e57; las anotaciones de entrega se añaden después. Sin integración, auto-merge ni despliegue. CI pendiente de resultado; no se ha confirmado que Claude termine. Siguiente paso: esperar confirmación, contrastar sus cambios finales y validar la propuesta actualizada antes de integrar.


## 14 de octubre de 2026 — Corrección autorizada de la pila #48/#50/#51
**Pedido:** encargo explícito del fundador para corregir las tres ramas y rebasar las siguientes; esta autorización permite actualizar #48 de Claude y reescribir B/C con comprobación del SHA remoto, excepcionalmente al protocolo normal de ramas propias.
**Base de A:** 03233fc7878bcf4c9cba9706e0efbd193b67d241. **B original:** d785699575dea02bc3c9ee47125090912f29993a. **C original:** 73d73aa2b00f5914ddb693e3d989ea828dc1b8ad (basado en B antiguo 8420ed1).
**Cambios:** catálogo, mapa, pruebas y trámites; normalización y protección del campo method de B trasladadas a su origen A. Sin alterar las reglas de negocio. Cuenta abre Datos y espera los tres textos; rival mantiene dirección, datos y botón. Las notas responsive pasan a 0.10.0 y revision-ui usa --acc-ink.
**Capacidad actual:** clon real e instalación npm disponibles con permiso de red y caché escribible; PostgreSQL 16 en contenedor propio, base aislada y Chromium real. Esto sustituye para este encargo los límites locales de sesiones anteriores.
**Evidencia:** 11/11 documentales, catálogo 360, mapa 74/82/29, tipos, 697 unitarias, build; reproducción y comparación de navegación, con un POST y pushState/replaceState, incluidos pre-A3 y 0.9.0. Resultados definitivos de recorridos y CI se registran por head en el traspaso/PR.
**Errores:** primeros comandos sin permiso de red/caché npm fuera del área escribible; datos E2E sin nivel tras A7. Corregidos sin ocultar comprobaciones. La traza de 0.9.0 solo compara navegación, no valida expectativas de B.
**Relevo:** [traspaso de correcciones](ecosistema/traspasos/2026-10-14-codex-ci48-51.md). Mantener borradores y no integrar/desplegar. Esperar la descripción del fallo de sparring antes de escribir su reproducción, arreglo y versión parche en una nueva rama apilada.

### Rebase de B (14 oct)
Rebase completado sobre A corregida, preservando B1–B3. Se regeneraron catálogo (368) y mapa (75/83/29). Los commits de correcciones ya incorporadas en A quedaron vacíos y se omitieron. Tras resolver conflictos, contraste contra el B original: src conserva todo su comportamiento; solo cambia el token de revision-ui. Pruebas conservadas completas, incluidas las tres exigencias de cuenta y rival. Una resolución local recortó temporalmente guiones por un patrón demasiado amplio; detectado y restaurado antes de publicar. El resultado de la batería de B y de CI se informa por head en los PR.

### Rebase de C (14 oct)
C queda sobre B corregida 56ddb92 y A f7937e1. Se conservó su entrada de versión 0.11.1 y todo el traspaso anterior, resolviendo el diario por bloques sin reescribir las entradas. Catálogo 368 y mapa 75/83/29 regenerados y comprobados; versión mayor que B 0.11.0. Su diferencia respecto a B es documentación y versión, sin src ni pruebas adicionales. CI de los tres heads se informa en la entrega y en cada PR; no se integra ni despliega. Sparring sigue pendiente del caso que falta en el encargo.
14 oct, continuación de CI #48: la ejecución 38525216311 aprobó catálogo, mapa, tipos, 697 unitarias y build, pero falló en respaldo.mjs porque sus dos combates profesionales no elegían nivel después de A7. Se exige PRO explícito para ambos, conservando amateur, NC, categorías históricas y todas sus comprobaciones. No se presenta esa ejecución como verde; el head siguiente se comprueba de nuevo.

14 oct, entorno de pruebas: la batería local larga de C se interrumpió al leer un ayudante de un estado intermedio mientras se rebasaba ese mismo directorio. No era un fallo de la aplicación ni se declara esa pasada como verde. Las pasadas largas requieren un checkout estable o un worktree separado; comprobar todos los .mjs y reiniciar sobre el head final.
14 oct, segunda revisión de CI: categorias.mjs perdía división/peso al elegir de nuevo el mismo nivel, porque SelectorCategoria reinicia sus dependientes en change. Elegir nivel antes de división/peso, evitar change redundante en el ayudante y poner rivalId después de rellenar; se traslada la preparación de edad de B a A. El artefacto de #51 (11876608015, head 0667240) confirma alias/presentación pero altura ausente en HTML. Cuenta ahora espera la URL del rechazo y exige los tres valores en el formulario antes de enviar, escribiendo altura al final; mantiene los tres seen() públicos y añade diagnóstico por dato si falla. Pasadas locales completas: categorías 18/18; cuenta 33/33 y otra 33/33 con CPU ralentizada seis veces. Sin cambios de src ni reglas de producto; el vaciado anterior no se atribuye sin evidencia a una causa distinta del estado de formulario durante la transición.

14 oct: continúa la revisión de A7, preparando nivel explícito en las cinco creaciones directas de velada que faltaban; diagnóstico de residuos en la base local desechable y CI 38530144100. Sin cambios de producto.

14 oct: diagnóstico y corrección de doble envío real en A3 por method ausente en acciones React hidratadas; prueba de componentes con reset inmediato, campo method y siguiente clic. Se mantiene separado de las dos notificaciones normales del router. Dependencias Prisma de A aisladas de B/C y pruebas afectadas registradas como fallidas.
## Estado del rebase final, 14 de octubre

A 0da663b y B 01bb8bd incorporan las correcciones de preparación de cuenta/categorías y mantienen las exigencias públicas. C está nuevamente sobre esa B (0.11.1). Frente a la pila anterior, src, prisma, scripts y unitarias de B/C son idénticos; cambian los guiones indicados y documentación generada. Se valida el CI de estos heads, no el de sus predecesores fallidos. Las pruebas dirigidas pasan: cuenta 33/33, cuenta CPU ×6 33/33, categorías 18/18 y respaldo 22/22. La descripción de sparring sigue pendiente; no hay PR ni versión ficticios para ese caso.

14 de octubre: el fundador concretó la búsqueda local de rivales; reproducción E2E primero, ciudad/gimnasio por opciones compatibles y nombre opcional para reto oficial y sparring, versión 0.11.2. Detalle en el traspaso 2026-10-14-codex-ci48-51.md; sin fusión ni despliegue.

14 oct, entrega de la pila en borrador #48/#50/#51/#52: búsqueda local 0.11.2 con reproducción roja, 33/33 en verde y capturas móviles en ambos temas; A usabilidad 52/52 y siete guiones 154/154; B usabilidad 52/52 con privacidad respetada. Cierre y distinción local/CI en el traspaso 2026-10-14-codex-ci48-51.md.


## 2026-10-14 — Bloque F de paneles
**Base:** 8146d0f (#55); **rama:** codex/paneles-f-pulido. El fundador autoriza avanzar sobre esta base antes de su integración.
**Cambios:** componentes TeToca/CompletaPerfil; cuatro paneles; selección de disciplina; alta de intereses en dos pasos; aura sin JavaScript; respuestas del entrenador y editor de su gimnasio; menú y tarjetas de seguidos.
**Comprobaciones:** tipos, 741 unitarias, build inicial. CI pendiente; sin PostgreSQL/Docker disponible localmente. No se ha desplegado.
**Relevo:** revisar PR F antes de integrar; continuar G y H en PR separados. H4 conserva revisión de modelo previa a interfaz.

## 2026-10-14 — Continuación del encargo de paneles
F incorpora la principal 8f07985 sin borrar aportaciones. Pasa de 0.12.2 a 0.13.2 y su PR #56 se dirige a la principal. El CI anterior 38567763298 falló en la comprobación inmediata de inputs del segundo paso de intereses; los datos se guardaron correctamente según el mismo guion. La prueba espera ahora el formulario del segundo paso y comprueba los dos valores exactos. Tipos y 741 unitarias pasan localmente. Docker/PostgreSQL inaccesibles; navegador completo y revisión de Claude pendientes. G queda conservado en 944ee56 hasta actualizarlo. No se despliega.

## 2026-10-14 — Bloque G de paneles
Implementa G1–G6 sobre F actualizado: provincia opcional, actividad local, Voy a ir, ICS, agenda, disponibilidad con filtros y caducidad, agenda del entrenador y preparación de veladas. Migración solo aditiva. Tipos y 761 unitarias aprobados; navegador, migración en base vacía y paridad de esquema se comprueban en CI, no disponibles localmente. Las clases no tienen fechas de oferta: se muestran como ofertas para solicitar esta semana, sin inventar confirmaciones. Aviso de caducidad en Mi ficha y Mi panel; el peso deja de publicarse inmediatamente al vencer aunque la limpieza aún no haya corrido. No hay carga real ni despliegue.

## 2026-10-14 — Gimnasios reales, bloque D
Modelo aditivo de procedencia, contacto profesional, disciplinas, propiedad revisada, publicación y ficción. Directorio/mapa/fichas/búsqueda excluyen Cataluña con una sola constante; las altas excluidas permanecen por revisar. Reclamación, conflicto, edición, cesión, miembros y aviso de corrección quedan auditados. El titular natural del gimnasio es la fuente de permisos; se preservan los titulares anteriores del perfil visual mediante migración. El importador reutilizable hace recuento por defecto, consulta áreas OSM para provincia ausente, conserva caché y protege gimnasios corregidos/reclamados. Una carga real requiere plan comparado con esa base, hash presentado e IMPORTAR_EN_REAL=si. Nunca usa seed o crea campañas.
Validación local: 785 unitarias y tipos; esquema y migración generada con diff sobre G. Fixture sintético del importador: Madrid 1, Valencia 1, cuatro provincias excluidas descartadas; NO es un inventario real. Consulta real de Overpass falla por EACCES de red: no hay recuento real ni carga en demo/producción. Navegador, migración vacía/paridad y revisión pendientes de CI/Claude.


## 2026-10-15 — F sobre los textos legales de Claude
Se conserva la versión legal 0.14.0 y sus cuatro entradas de catálogo al actualizar F a 0.14.1. La resolución inicial de conflictos documentales falló por una expresión regular y finales de línea Windows; se reconstruyeron los documentos desde los padres y su ancestro, comprobando JSON y ausencia de marcadores. Los cuatro ajustes móviles quedan reservados a Antigravity por encargo de Claude. Sin integración ni despliegue.


## 2026-10-15 — Paneles H preparados para revisión (Codex)
Avisos personales con retención de doce meses y exportación; vídeos del público añadidos por referencia a highlights y aviso al autor; seguidores y comentarios recientes; peleadores del gimnasio del entrenador; pendientes de federación con acreditación; moderación en lista única. Contratos en AVISOS.md y traspaso 2026-10-15-codex-paneles-h.md. H4 solo tiene propuesta RFC-002 y espera revisión de Claude. Los cuatro ajustes móviles quedan asignados a Antigravity. No equivale a validación completa ni despliegue.


15-10-2026: el fundador reanuda Codex. Se incorpora #68 (T-016, 0.15.0) en toda la pila F/G/D/H y se renumera 0.15.1–0.15.4. Se conserva la privacidad en las tarjetas de seguidos y se unifica la fuente territorial de gimnasios. H está en #71. Tipos aprobados; 806/807 unitarias y la única que agotó el tiempo pasa aislada. Catálogo 425, mapa y versión comprobados. CI final y revisión de Claude pendientes; sin despliegue.
## 15 de octubre de 2026 — T-013: avisos de enlaces externos (Codex)

**Encargo:** «T-013 enlaces externos»; partir de la demo con #73 fusionado; no tocar F/G/D/H (#56/#62/#64/#71), y después agrupar Dependabot en T-002. Reserva publicada con `node scripts/estado.mjs reservar codex "T-013 enlaces externos"`, desde 8c789bc (0.16.0).

**Cambios:** reglamento y cuatro ramas de enlaces de moderación anuncian otra pestaña; la galería anuncia visiblemente la salida a vídeos externos. Condiciones y privacidad explican la salida y las políticas ajenas. La auditoría exige aviso y `noopener` o `noreferrer` en cada pantalla; prepara división y avisos con foto, vídeo externo, vídeo subido y página. Se actualiza la ficha histórica al encargo vigente. Archivo compartido delicado: `package.json`, solo versión 0.16.1; sin dependencias nuevas.

**Validación en curso:** 21 migraciones sobre PostgreSQL 16 propio y paridad de esquema correctas; tipos y 754 unitarias correctas. Chromium local disponible. Reproducción roja, compilación y batería final se registrarán antes de entregar. No se ha comprobado Safari ni dispositivos físicos ni se ha desplegado.

**Siguiente:** revisión del PR por Claude y decisión del fundador; conservar las ramas de paneles sin actualizarlas. T-002 va en otro PR.

**Continuación de validación (15-10-2026):** las dos compilaciones finales, tipos y 754 unitarias por rama estaban correctas al perderse la conexión del entorno. La batería completa de navegador quedó interrumpida con tiempos de espera en el registro, no aprobada. Recuperado el acceso, se guardaron los avances en las ramas propias antes de continuar. La reproducción roja de T-013 sí detectó el reglamento y los enlaces de foto, vídeo y página en moderación (los dos vídeos comparten mensaje y se agrupan).

**Enlaces del mapa:** la autoría de MapLibre y del estilo crea `target="_blank"` fuera de React, sin aviso ni `rel`. Se normalizan en `components/mapa/base.ts` al cargar y actualizar el mapa, sin cambiar textos visibles ni destinos. La auditoría espera al mapa o a la alternativa sin WebGL. Son controles compartidos existentes; no se actualizan ramas ni implementaciones de F/G/D/H. Se recompila y valida esta corrección antes de darla por terminada.

**Actualización de base:** el PR #74 entró durante las pruebas (demo 543a2a7, 0.16.1). Se integra en esta rama propia con un merge, sin reescribir ramas; se conservan completos sus cambios de fotos y sus registros. La versión actual de esta entrega pasa a **0.16.2** mediante `scripts/version.mjs`. Las baterías de los heads anteriores quedan sustituidas por las del head nuevo; no se presentan como validación de la base nueva. F/G/D/H siguen sin actualizarse.

**Resultados locales adicionales de T-013:** la reproducción roja acotada (`ENLACES_MAX=1`, más división y avisos preparados) detectó los avisos ausentes en reglamento, foto, vídeo y página de moderación. El rastreo posterior con Chromium y mapa por software recorrió 414 pantallas por cinco papeles y ejecutó los casos dirigidos: no encontró defectos de aviso o `rel`, pero el resultado global fue **fallido** por 10 autoenlaces anteriores, ajenos a los cambios de T-013: `/veladas?past=todas` (cinco papeles), el acceso «Buscar en mi ciudad» ya filtrado (peleador) y los cuatro estados de `/moderacion/fallos` (moderador). Esas tres pantallas y la comprobación de autoenlaces no se han modificado. No se oculta ni relaja ese fallo. La ejecución usó la compilación f26ec14 anterior al merge de #74; la base final la valida el CI de 33398e6.

**Mapa dibujado, comprobación independiente:** con un punto GeoJSON y el estilo servido desde la propia prueba, Chromium dibujó el mapa y el enlace «OpenFreeMap» tuvo `aria-label="OpenFreeMap (se abre en otra pestaña)"` y `rel="noopener noreferrer"`. La primera sonda no esperó a la autoría y no la contó; la segunda esperó al enlace real antes de comprobarlo.

**Base vigente tras #75:** la demo pasó a d6a63d5 (0.17.0) al integrar Claude los F/G elegidos en ESTADO.md. Se incorpora ese resultado en esta rama propia; no se actualiza ninguna rama ni PR de F/G/D/H. Se conservan íntegros sus ficheros y pruebas. T-013 queda en **0.17.1** usando el script de versión. Las pruebas anteriores se identifican por su SHA; la validación actual se consulta en los checks del PR de esta entrega. Revisión de Claude e integración del fundador pendientes.

**Entrega T-013:** [PR #77](https://github.com/romppao/MiClaude/pull/77), versión 0.17.1, sobre la demo 0.17.0 elegida en #75. Las comprobaciones de esta base se consultan en [el CI del PR](https://github.com/romppao/MiClaude/pull/77/checks). Los CI completos anteriores a #75 terminaron en verde: [T-013, 33398e6](https://github.com/romppao/MiClaude/actions/runs/38706572484) y [T-002, d62b8d1](https://github.com/romppao/MiClaude/actions/runs/38706575120), incluidas accesibilidad y experiencia gráfica; su alcance no se confunde con el de la base nueva. Los PR originales de Dependabot y los de paneles quedan abiertos sin modificaciones por Codex. Primero se integra T-013; después, T-002. Claude revisa y el fundador decide la integración.
## 15 de octubre de 2026 — T-002: cinco actualizaciones en un PR (Codex)

**Encargo:** agrupar Dependabot #17 (Vitest 5.0.3), #18 (Sharp 0.35.5), #19 (Next 15.5.27), #65 (MapLibre 6.14.0) y #66 (tipos de Node 26.6.5), después de T-013. Reserva publicada `codex/t-002-dependabot-agrupado-20261015`, base 8c789bc. Se actualiza la ficha histórica T-002 para reflejar la autorización de actualizar dependencias.

**Cambios:** cinco declaraciones y una resolución conjunta de `package-lock.json`; MapLibre sigue fijado. No se adoptan Next 16, Prisma 7 ni TypeScript 7. Archivo compartido delicado: `package.json`. Versión 0.16.2, reservada para integrar después de T-013 (0.16.1); se usó el script de versiones, sin alterar a mano el campo. No se publican versiones intermedias. No hay cambios de aplicación ni de paneles ni se cierran PR ajenos. Tras integrar, el fundador puede cerrar #17/#18/#19/#65/#66 por sustitución; #20 no forma parte de este encargo.

**Incidencia de preparación:** una resolución inicial por rangos eligió Next 15.5.28 y Vitest 5.0.4. Se rehace con las versiones explícitas de los PR para que esta entrega corresponda al encargo, manteniendo los rangos originales y MapLibre fijado.

**Validación parcial:** instalación reproducible con las cinco versiones exactas; 21 migraciones y paridad del esquema; tipos; 754 unitarias con `npm test -- --maxWorkers=1`; catálogo, mapa y 15 documentales correctas. Las dos pasadas simultáneas con navegador (trabajadores automáticos y dos trabajadores) terminaron con 752 correctas y dos tiempos de espera de 5 segundos en contraseñas. La pasada aislada no cambia límites, pruebas ni parámetros de seguridad. Chromium y Node 24 locales (el CI usa Node 22). Compilación y navegador pendientes de cierre. Sin integración ni despliegue. El segundo PR que se integre debe comprobar de nuevo su número frente a la demo.

**Actualización de base:** el PR #74 entró durante las pruebas (demo 543a2a7, 0.16.1). Se integra en esta rama propia con un merge, sin reescribir ramas; se conservan completos sus cambios de fotos y sus registros. La versión actual de esta entrega pasa a **0.16.3** mediante `scripts/version.mjs`. Las baterías de los heads anteriores quedan sustituidas por las del head nuevo; no se presentan como validación de la base nueva. F/G/D/H siguen sin actualizarse.

**Base vigente tras #75:** la demo pasó a d6a63d5 (0.17.0) al integrar Claude los F/G elegidos en ESTADO.md. Se incorpora ese resultado en esta rama propia; no se actualiza ninguna rama ni PR de F/G/D/H. Se conservan íntegros sus ficheros y pruebas. T-002 queda en **0.17.2** usando el script de versión. Las pruebas anteriores se identifican por su SHA; la validación actual se consulta en los checks del PR de esta entrega. Revisión de Claude e integración del fundador pendientes.

**Entrega T-002:** [PR #78](https://github.com/romppao/MiClaude/pull/78), versión 0.17.2, sobre la demo 0.17.0 elegida en #75. Las comprobaciones de esta base se consultan en [el CI del PR](https://github.com/romppao/MiClaude/pull/78/checks). Los CI completos anteriores a #75 terminaron en verde: [T-013, 33398e6](https://github.com/romppao/MiClaude/actions/runs/38706572484) y [T-002, d62b8d1](https://github.com/romppao/MiClaude/actions/runs/38706575120), incluidas accesibilidad y experiencia gráfica; su alcance no se confunde con el de la base nueva. Los PR originales de Dependabot y los de paneles quedan abiertos sin modificaciones por Codex. Primero se integra T-013; después, T-002. Claude revisa y el fundador decide la integración.

## 2026-10-15 — T-009, todos los tipos de cuenta
**Pedido:** después de los cuatro puntos D/H, ampliar T-009 para las pruebas definitivas antes del lanzamiento.
**Base:** demo `059abd9` (0.18.6). **Rama:** `codex/t-009-escenarios-de-todos-los-tipos-de-c-20261015`.
**Cambios:** 16 personas/recorridos, con pasos visibles y datos propios. Incluye rival que confirma y solicita revisión, reclamación provisional, entrenador y gimnasio con titular asignado por moderación, todas las colas de moderación, Carmen al 150/200 %, recuperación/cambio/descarga/eliminación de cuenta, foto/banner/título/respaldo, club y creador con el segundo paso real. Se actualiza el registro opcional para la pantalla actual. Los recorridos se interrumpen al fallar un paso y conservan el fallo y captura, para evitar errores en cascada.
**CI:** tarea independiente con PostgreSQL y servidor propios y semilla ficticia en base vacía; no cambia el producto ni usa cuentas reales. El artefacto incluye capturas y JSON, incluso en fallos.
**Compartido:** .github/workflows/ci.yml y versión de package.json/lock. No se han cambiado dependencias.
**Validación y revisión visual:** en curso; los resultados y límites se documentarán por persona en docs/pruebas/escenarios-2026-10-15.md. Los hallazgos fuera de alcance se dejan para Claude, sin cambiar el producto.

## 2026-10-16 — T-009: evidencias del CI y selectores de veladas
**Pedido:** continuar los encargos de Claude; revisión previa de los selectores de #91.
**Base:** b1597d4e, demo 0.18.7. **Rama local:** codex/revision-pr91-20261016.
**Resultado:** el CI 38748985341 tiene correctos test y escenarios; su registro confirma 16 personas, 93 pasos y cero pasos fallidos. Ningún recorrido de /veladas depende de .card. Las referencias restantes son de peleadores o moderación y se conservan.
**Límites:** React #418 registrado en rival, persona mayor y peleador completo; causa pendiente. No se ejecutan pruebas de nuevo ni se revisan capturas nuevas: el artefacto existe, pero la descarga local no conecta. Evidencias y pendientes en docs/pruebas/escenarios-2026-10-16.md.
**Siguiente:** revisión de Claude. Esperar #93 → #88 → #89 → #90 antes de actualizar y renumerar #91. No se inicia agenda ni se fusiona nada.

## 2026-10-15 — Gimnasios aportados desde fichas, pendientes de revisión
**Pedido:** cuarto punto del relevo: PENDING si no lo hace moderación.
**Base:** demo `059abd9` (0.18.6). **Rama:** `codex/gimnasios-desde-fichas-en-revision-20261015`.
**Cambios:** política de altas indirectas común en fighters.ts (alta y edición), profiles.ts (edición de entrenador) y trainers.ts (alta de entrenador, también publicaba por defecto). Solo moderación y con provincia admitida publica; los upsert existentes mantienen update vacío, sin cambiar estados ya revisados/retirados. Sin migración. El recorrido flujo revisa y publica expresamente su gimnasio antes de comprobar el sello, que sigue siendo independiente.
**Pruebas:** matriz de roles y territorio; nuevo recorrido real de alta/edición de peleador y entrenador, moderación y conservación del estado existente. Validación en curso.
**Siguiente:** revisión de Claude y T-009 en PR separado. No se cambia el estado histórico de gimnasios ya existentes.

**Revisión de #90:** tipos, 15 unitarias específicas, documentación y controles locales pasan. El CI detectó dos expectativas de búsqueda que daban por publicado el gimnasio de una ficha; el guion comprueba ahora que permanece fuera de la búsqueda antes de revisión y lo publica desde moderación antes de comprobar búsqueda y metadatos. No se cambia la política ni se rebaja ninguna afirmación de búsqueda.

## 2026-10-16 — Corrección del recorrido de altas de gimnasios (#90)
**Pedido:** continuar las tareas de Lona según el encargo del 15 de octubre.
**Cambio:** `gimnasios-altas.mjs` abre «Mis datos» y «Corregir los datos de mi ficha» antes de localizar el formulario, en las tres ediciones. El campo `gym` existe; el selector por botón no encontraba el formulario porque el desplegable cerrado oculta ese botón. Se mantienen las comprobaciones de revisión y estados, sin modificar el producto.
**Validación:** sintaxis JavaScript correcta; catálogo y mapa se comprueban al cerrar esta entrega. Recorrido completo de navegador pendiente de CI; las ayudas utilizan psql con sintaxis de shell Unix. No se usa la base real para probar.
**Siguiente:** esperar a #93, después #88 y #89; actualizar y renumerar #90 a 0.20.3 cuando le corresponda. No se fusiona nada.

**Cierre de validación local (16-10):** `node --check tests/e2e/gimnasios-altas.mjs`, TypeScript (`node node_modules/typescript/bin/tsc --noEmit`), catálogo (445 archivos) y mapa comprobados correctamente. Las pruebas del catálogo dan 10 correctas y 1 bloqueada por EPERM al crear un enlace simbólico en Windows; no se modifica esa prueba. Recorrido real pendiente del CI.

## 2026-10-15 — Cesión de gimnasio con aceptación
**Pedido:** tercer punto del relevo: invitación, misma respuesta tenga o no cuenta el correo, hayBloqueo y correo a las dos personas.
**Base:** demo `059abd9` (0.18.6). **Rama:** `codex/cesion-de-gimnasio-con-aceptacion-20261015`.
**Cambios:** GymTransferInvitation con FK de gimnasio/remitente, correo destinatario sin requisito de cuenta previa y hash del enlace. Caduca en 14 días. Una nueva invitación cancela la anterior; máximo cinco al día por titular/gimnasio. Se acepta con correo confirmado coincidente, vuelve a comprobar propiedad y bloqueos y cambia Gym/Profile en la misma transacción. Confirmaciones a ambas personas por sendMail. Los bloqueos cancelan las cesiones pendientes; copia y eliminación de datos incluyen el correo destinatario. Se conserva la intervención directa de moderación.
**Compartidos:** esquema, migración aditiva, package.json (se conserva y amplía el guion e2e).
**Validación:** tipos aprobados; pendientes migraciones/paridad, pruebas unitarias y recorrido real de correo con/sin cuenta, repetición, cancelación, caducidad y bloqueos.
**Siguiente:** revisión de Claude y cuarto punto en PR separado. No hay cambios de proveedor ni dominio.

**Resultado local de #89:** migraciones en base vacía, paridad, tipos, compilación y 15 comprobaciones documentales aprobados. El recorrido completo de cesión pasa: ambos tipos de destinatario, enlace ajeno y repetido, dos correos de confirmación, ambos sentidos de bloqueo, cancelación y caducidad. Las unitarias locales detectaron un código de error en AVISOS: corregido a PROBLEMAS y prueba de mensajes aprobada. Cuatro comprobaciones de contraseña siguen agotando 5 segundos en esta máquina, incluso en una repetición sin otras compilaciones; no se atribuye todo a la carga ni se alteran los límites. El CI 38743105233 sí ha pasado las unitarias sobre la corrección y está recorriendo navegador.

## 2026-10-15 — Vinculación a gimnasios por invitación
**Pedido:** segundo punto del relevo: el titular invita y la persona acepta, con hayBloqueo. Se mantiene la vinculación directa de moderación.
**Base:** demo `059abd9` (0.18.6). **Rama:** `codex/invitaciones-de-miembros-de-gimnasio-20261015`.
**Cambios:** GymMemberInvitation con claves foráneas y una sola ficha por invitación, caducidad de 14 días, aceptación/rechazo/cancelación, bandeja privada paginada y avisos dentro de la aplicación. Se revalidan propiedad, cuenta destinataria, bloqueos y gimnasio anterior. Los bloqueos cancelan invitaciones pendientes. La copia de datos incorpora las invitaciones propias. Entrenadores con titular de Profile también pueden aceptar.
**Archivos compartidos:** esquema y migración aditiva; package.json conserva todos los scripts y añade el nuevo recorrido.
**Pruebas:** autorización y recorrido real de peleador/entrenador, rechazo, cancelación, bloqueo y cesión posterior; validación en curso.
**Siguiente:** revisión de Claude; cesión de gimnasio en PR separado. No se toca RFC-002.

**Validación local de #88:** migraciones y paridad, tipos, 15 comprobaciones documentales y compilación aprobados. 849/851 unitarias pasaron en la ejecución con carga; las dos agotadas por tiempo pasan aisladas junto con autorización: 287/287. En navegador pasan invitación, duplicado, aceptación de peleador y entrenador, rechazo y cancelación. La prueba de bloqueo conserva la pantalla anterior a bloquear para verificar también la guarda del servidor, ya que la lista oculta las invitaciones bloqueadas al recargar. El recorrido completo posterior pasa: invitación, duplicado, ambas fichas, rechazo, cancelación, bloqueo posterior/inverso, cambio de titular y copia de datos. Un intento intermedio no llegó a registrar por pérdida temporal de conexión a Postgres; el contenedor seguía activo y la repetición completa pasó.

## 2026-10-15 — Bandeja única de moderación, rehecha sobre 0.18.0
**Pedido:** puntos 1–4 del relevo de Claude y después T-009, cada uno en su PR. No actualizar T-013 ni T-002.
**Base:** `claude/ring-espana-mvp`, `5995bd7`. **Rama:** `codex/bandeja-unica-de-moderacion-20261015`.
**Cambios:** bandeja por urgencia con paginación independiente, decisiones de combate válidas, contratos actuales de avisos sin cuenta y PAGINA. Se adaptan los ocho guiones solicitados y se recuperan las comprobaciones de la bandeja en paneles-avisos. Fichero compartido: package.json y lock solo por versión.
**Validación inicial (0.18.0):** tipos, 827 unitarias, 15 comprobaciones de documentación, compilación, catálogo y mapa aprobados. La prueba de bandeja y pulido pasan en navegador. Al publicar, la demo había avanzado a 0.18.6: se incorpora, se conservan los avisos de enlaces y se renumera a 0.18.7; validación de esa base en curso. No se modifican ramas sustituidas ni los PR #77/#78.

**Revisión de #86:** el CI 38739924528 pasó tipos, unitarias, compilación, flujos y auditoría de enlaces, pero detectó el acceso de gimnasio con altura táctil insuficiente. Se corrige usando el botón de enlace compartido; nuevo CI pendiente. La ejecución local simultánea de flujo agotó 30 s al navegar a Mi ficha; no se alteran esperas ni afirmaciones.

**Revisión de contratos de la bandeja:** se mantienen también los accesos a la velada del combate, la ficha reclamada y la web profesional del gimnasio, con zona táctil suficiente. El CI anterior ya había superado e2e y accesibilidad; esta conservación de accesos vuelve a validarse sobre el nuevo commit.

**Comprobación de etiquetas por entidad:** el caso GYM heredaba el texto de retirar comentario de la demo; ahora dice «Resolver y retirar el gimnasio» y el recorrido pulsa ese botón y comprueba REMOVED en ese gimnasio. El CI 38745856730 pasó completo sobre b9cc10f; este ajuste de etiqueta y su recorrido añadido vuelven a validarse en el siguiente CI.

## 16 de octubre de 2026 — T-017: correcciones de reservas de entradas (#93)

**Pedido:** ejecutar las cinco correcciones verificadas por Claude en `flota/entradas-correcciones`, dejando los cambios sin commit y sin cambiar de rama. Sin red ni instalaciones. El fundador reserva a Claude la versión, CHANGELOG, DIARIO, ESTADO, catálogo y mapa: no se modifican ni se ejecutan sus generadores; tampoco se hace fetch ni se ejecuta el script de estado, que consulta la red.

**Qué cambié y por qué:** las acciones de entradas releen reserva y condiciones de venta bajo el bloqueo de la velada, comprueban aforo y ausencia de otra activa al confirmar tarde y guardan el aforo dentro de ese bloqueo. El correo usa los datos releídos. Editar fecha u hora acorta pendientes al nuevo cierre en la misma transacción; se conserva la hora actual si el formulario no la envía, también al guardar el cartel. La biblioteca de entradas incorpora reglas puras de ocupación/confirmación y convierte la hora de Madrid en dos pasadas; el nuevo problema `entradas_otra_activa` explica cómo resolver el conflicto. El flujo de mantenimiento documenta estos contratos.

**Pruebas añadidas:** 34 casos en `tests/unit/entradas.test.ts`: inicio, cierre y señal en los cambios de horario de 2026 y en verano/invierno; hora inexistente/repetida; límites de ocupación y confirmación; acciones con lecturas distintas antes y después del bloqueo, aforo, duplicados activos, precio/Bizum/plazo actualizados, orden del cartel y acortamiento de pendientes con cierre futuro o pasado. Transacciones simuladas, sin PostgreSQL ni navegador: no se acredita concurrencia real.

**Qué ejecuté:** `npx.cmd tsc --noEmit`: salida vacía, código 0. `npx.cmd vitest run tests/unit/entradas.test.ts tests/unit/messages.test.ts`: 2 archivos y 46 pruebas correctas, código 0. `npx.cmd vitest run`: 59 archivos y 887 pruebas correctas, código 0. npm en modo sin conexión y sin instalación. PowerShell rechazó inicialmente `npx` por bloquear `npx.ps1`; se usó `npx.cmd` sin cambiar la política. La primera batería completa falló en una prueba de autorización por una lectura nueva anterior al rechazo de disciplina; se corrigió el orden y la batería completa posterior pasó. Ninguna prueba se relajó.

**Relevo:** Claude revisa y guarda los cambios y completa los archivos reservados. No hay commit, cambio de rama ni despliegue. Comportamiento visible previsto: una señal tardía puede rechazarse por aforo o por otra reserva activa; adelantar el inicio puede vencer inmediatamente un plazo. La subida del cartel sigue precediendo a la transacción: un rechazo posterior puede dejar la imagen nueva sin asociar (el cartel anterior no se borra).


## 2026-10-16 - Codex - Revisión de los ajustes móviles #94 (0.20.2)

**Encargo:** seguir el comentario de Claude en #94 y el orden de relevo de #95. Rama propia `codex/pr94-ajustes-movil-20261016`; no se modifica la rama de Antigravity.

**Cambios:** retirado el ajuste 3 completo (regla global `.card>strong`, estilo en veladas y su prueba). Se conservan portada, mapa/buscador y botón de filtros. El merge incorpora la base exacta candidata de #95, `545018b`; se conservaron ambas entradas del diario y el historial completo de 0.20.0/0.20.1. La entrada histórica de Antigravity describe su entrega original, no los tres ajustes finales.

**Validación local:** tipos, 891 pruebas unitarias, versión, catálogo (470 archivos) y mapa correctos. Documentación: 33 de 34 comprobaciones correctas; la restante no puede crear un enlace simbólico en Windows (EPERM). No se cambia esa prueba: debe pasar en el CI de Linux. Next completó compilación, generación y tabla de rutas; PowerShell devolvió 1 por una advertencia de Prisma tratada como NativeCommandError, por lo que no se acredita código 0. CI remoto pendiente. Las capturas originales de Antigravity y las pruebas de #95 no acreditan el resultado integrado. No se fusiona mientras falten CI completo y revisión independiente.


## 2026-10-16 - Codex - Actualización de #88 sobre la base candidata 0.20.2

**Encargo:** relevo de Claude en #95 y aprobación de #88 (comentario6195353236). Rama propia `codex/pr88-integracion-20261016`, sin rebase. Preparación local mientras termina el CI de #96; no se publica hasta que el anterior esté fusionado.

**Integración:** se conservan las invitaciones originales y las entradas/carteles de la principal. El esquema mantiene ambos modelos y los avisos admiten GYM_MEMBER y TICKET. El nuevo recorrido `gimnasios-invitaciones` entra en `tests/e2e/orden.json`; se conserva el ejecutor nuevo que completa todos los recorridos. Historial de documentos preservado; versión 0.20.3 por el script oficial. No se modifican las reglas de permisos aprobadas por Claude.

**Validación:** esquema Prisma válido; tipos, 901 unitarias, versión, catálogo y mapa correctos. Compilación completa con BUILD_EXIT=0. Documentación33/34 por EPERM de enlaces simbólicos en Windows, sin alterar la prueba. No se ejecutan migraciones ni se alteran datos locales o remotos. CI con base vacía requerido antes de fusionar.


## 2026-10-16 - Codex - Integración local de #89 (0.20.4)
**Encargo:** relevo de Claude en #95; cesión consentida aprobada por Claude comentario6195354039. Rama propia `codex/pr89-integracion-20261016`; merge de la base candidata0.20.3. Publicación después de fusionar #88.
**Integración:** conserva modelos, acciones y pruebas de miembros, cesiones y entradas. Se unifican imports y las dos paginaciones de Mis gimnasios usan variables independientes. El recorrido gimnasios-cesion entra en orden.json sin quitar los anteriores. Migraciones originales intactas. Versión por script, ambas historias documentales conservadas.
**Validación:** Prisma válido y generado; tipos, 910 unitarias, versión, catálogo y mapa correctos. Compilación completa BUILD_EXIT=0. Documentación33/34 por EPERMWindows al crear enlace simbólico, prueba intacta. Sin migraciones ni datos reales alterados; CI remoto pendiente.


## 2026-10-16 - Codex - Integración local de #90 (0.20.5)
**Encargo:** relevo de Claude en #95 y corrección del campo gym en Mi ficha. Se conserva la apertura de la pestaña y el desplegable antes de buscar el formulario, ya publicada en6b62681.
**Integración:** merge de base candidata1174eac (invitaciones, cesiones y entradas) en rama propia codex/pr90-integracion-20261016. Traspaso remoto anterior preservado. El recorrido gimnasios-altas entra en orden.json. Sin cambios en las reglas de alta aprobadas por Claude, sin rebase.
**Validación:** tipos, 915 unitarias, versión, catálogo y mapa correctos. Compilación BUILD_EXIT=0. Documentación33/34 por EPERMWindows, prueba intacta. Sin migraciones ni cambios de datos reales. CI remoto pendiente; publicación después de fusionar #89.


## 2026-10-16 - Codex - Integración T009 y comentarios de Claude (0.20.6)
**Encargo:** comentarios6216529851 y6216656220 de #91 y relevo de #95. Merge de base candidata f495208, sin rebase, en codex/pr91-integracion-20261016. Traspaso remoto previo preservado.
**Cambios:** caret:initial en ambas capturas, lección y causa actualizadas con atribución a la reproducción de Claude; escenarios solo manual/al fusionar/PR etiquetado. Etiqueta escenarios añadida a #91 antes de actualizarlo para comprobarlo completo una vez. Se retira encType redundante en Mi ficha como indicó Claude; sin cambio de acción ni permisos. Todos los recorridos de la base conservados.
**Validación:** tipos, 915 unitarias, versión, catálogo y mapa correctos; compilación BUILD_EXIT=0. Documentación33/34 por EPERMWindows, caso intacto. Ejecución de los dieciséis escenarios pendiente del CI completo tras #90. Sin datos reales alterados.

## Corrección del recorrido tras CI 38942511433
- El CI terminó con 40/41 recorridos correctos. Solo falla gimnasios-altas al seleccionar Boxeo: el input transparente con pointer-events:none está dentro de label.chip; .check() intenta pulsar el input y la etiqueta intercepta el clic (línea 37).
- Se pulsa la etiqueta visible mediante label.chip:has(input[name=disciplina][value=BOXEO]) y se añade comprobación explícita de isChecked. Todas las afirmaciones de publicación, estados, moderación y territorio siguen intactas. No cambia código de aplicación, permisos ni CSS.
- Sintaxis correcta. Interacción aislada con Chromium y CSS real correcta: el clic normal en la etiqueta selecciona Boxeo. No se atribuye al recorrido Next completo; sin base local accesible. Catálogo y mapa se regeneran/comprueban para la nueva entrega. Repetición completa pendiente de CI.

## Nuevo orden autorizado comunicado por Claude
- Comentario6221715692 de #97: Claude incorporó las correcciones de Luna en26bffc4 y comunica autorización del fundador para adelantar los listados. Los archivos de CSS, navegación, filtros y regresiones son idénticos a los de nuestra rama revisada f5cdd1b; verificado con git diff sin diferencias.
- Se prepara #90 sobre26bffc4 para publicarlo tras la fusión apta de #97. Se conservan todas las reglas de alta y el clic visible de Boxeo. La versión pasa a0.21.1 mediante el script; #91 deberá renumerarse después.
- No se requiere el PR corrector de listados: Claude ya incorporó esos cambios. La rama propia publicada a3b224d3 queda como evidencia sin PR, evitando una entrega duplicada.
- Esta preparación todavía no se ha publicado ni fusionado. Se comprobarán versión, catálogo, mapa, tipos, unitarias y compilación sobre la combinación nueva; el CI completo final sigue siendo necesario.

## Actualización tras adelantar listados (#97)
- Claude comunicó en comentario6221715692 la autorización del fundador para adelantar #97 e incorporó las correcciones en26bffc4. #90 se prepara sobre esa base como0.21.1 (3812d33), conservando la corrección visible de Boxeo.
- #91 integra esa candidata con merge y se renumera con el script a0.21.2. Se conservan ambas capturas caret:initial, condición de escenarios manual/push/etiqueta, guarda de las dieciséis personas y retirada de encType redundante. No se modifica la lógica de listados ni de altas.
- Esta combinación pasa tipos,920 unitarias, versión, catálogo478 y mapa. Documentación33/34 por EPERM Windows, caso intacto. Compilación nueva en curso al registrar. Sin navegador con DB local; CI definitivo pendiente.
- La candidata es preparatoria, sin actualizar todavía el PR91 remoto. Esperar #97 apto y fusionado, publicar #90 actualizado, y después #91 cuando #90 esté apto.
