# Aportaciones de Codex y relevo para Claude

**Fecha:** 3 de octubre de 2026 (Europe/Madrid). **Autor:** Codex. **Proyecto:** Ring España, repositorio `romppao/MiClaude`.

## Leer primero al retomar

**Continuación:** el recorrido pendiente de récords profesional/amateur se prepara en `codex/validacion-records-2026-10-03`, partiendo de `e049fe4`. Ver la sección final para distinguirlo de los cambios de calendario y sus ejecuciones de CI.

Este documento es el relevo solicitado expresamente por el fundador para que Claude entienda las aportaciones de Codex. Se complementa con `TRASLADO.md`, `DIARIO.md`, `COMPETENCIA.md` y el mapa funcional; no sustituye las reglas de `CLAUDE.md`.

**Base examinada:** `f86e3347d0efadffa940f5cc91987c7abbdfa41c`, rama principal `claude/ring-espana-mvp`.
**Rama de aportaciones:** `codex/claridad-calendario-2026-10-03`.
**Estado:** cambios preparados y comprobaciones locales aprobadas; integración y pruebas completas de navegador sujetas al CI de la propuesta. No confundir esta rama con la demo desplegada. La documentación de relevo se publica también en la rama principal para que sea fácil encontrarla.

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

Rama: `codex/validacion-records-2026-10-03`, base `e049fe4`. Sintaxis y diferencias comprobadas localmente. El proxy no responde y faltan dependencias, por lo que la validación completa se hace en CI y sigue pendiente hasta consultar el resultado. Este bloque no completa la auditoría por personas ni integra o despliega la demo.


### Revisión de los guiones que siguen al primer flujo

La inspección encontró el mismo `body.includes(q)` en `integridad.mjs`, para una ficha provisional; se aplica la misma comprobación de listado vacío y ausencia de tarjeta. Además, la prueba de paginación en `busqueda.mjs` creaba 30 fichas sin `FighterDiscipline` pero filtraba por amateur; desde el último cambio de Claude, el nivel se filtra en la disciplina. Se crean también sus disciplinas amateur en los datos de prueba. Se mantienen las 30 fichas, la paginación y el filtro: no se relaja la prueba ni se cambia el producto.
