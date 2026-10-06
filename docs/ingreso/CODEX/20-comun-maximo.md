# Parte 2 — prueba común MÁXIMO: T-005, caché de lecturas públicas

## Resultado honesto

La ficha T-005 **no está completada**. He implementado y validado dos porciones acotadas: el cálculo del ránking público de aura y el listado público paginado de peleadores se sirven mediante `unstable_cache`, con claves que incluyen sus filtros normalizados, una caducidad de 60 segundos y etiquetas explícitas. Dar o retirar aura invalida `ranking`; crear o actualizar una ficha invalida `fichas` y, si procede, `gimnasios`.

No afirmo que esto cubra todos los criterios de T-005 ni que el proyecto entero esté libre de datos desactualizados: aún faltan la ficha individual, portada, veladas, gimnasios y entrenadores; sus etiquetas de escritura; la medición de consultas; y las pruebas de navegador con base vacía.

## Qué hice

- Creé `src/lib/common/cache.ts` con `leerCacheado(clave, etiquetas, segundos, fn)` y las etiquetas públicas definidas por la ficha.
- Convertí `auraRanking()` en una envoltura cacheada que delega el cálculo a `auraRankingSinCache()`.
- La clave incluye `discipline`, `level`, `province`, `sinceDays` y `fighterId`, incluidos como `null` cuando no se usan, para que dos combinaciones no compartan resultado.
- Cacheé también la cuenta y página de `/peleadores`, con una selección Prisma explícita que no contiene fechas y una clave que incluye búsqueda, ids filtrados, disciplina, nivel, provincia, categoría, división y página.
- Crear ficha ya invalida `fichas` y `gimnasios`; actualizar datos de ficha invalida ambas, y guardar disciplina invalida `fichas`.
- Elegí este cálculo porque devuelve únicamente datos JSON seguros (texto, números, booleanos y nulos); no hay fechas que rehidratar. No he aplicado el ayudante aún a consultas Prisma que devuelven fechas, porque hacerlo sin una conversión explícita incumpliría la advertencia de la ficha.
- Añadí `invalidar(...etiquetas)` al módulo compartido de acciones y lo llamé desde `giveAura()` y `removeAura()`.
- Añadí `tests/unit/cache.test.ts` y adapté la prueba del ránking para aislarla del runtime de caché de Next.

## Qué ejecuté yo

| Comando | Resultado |
| --- | --- |
| `npx vitest run tests/unit/cache.test.ts tests/unit/ranking-trayectoria.test.ts` | Correcto: 2 archivos, 5 pruebas aprobadas. |
| `npm run typecheck` | Correcto. |
| `npm test` | Correcto: 31 archivos, 416 pruebas aprobadas. |

## Qué no ejecuté o no pude comprobar

- No ejecuté la prueba de navegador `tests/e2e/cache.mjs`: todavía no existe y esta máquina no tiene una base PostgreSQL de prueba preparada.
- No medí consultas ni latencia con `DEBUG_QUERIES=1` ni k6; por tanto no hay cifras de mejora.
- No ejecuté una acción contra un servidor Next y base de datos reales para comprobar la invalidación de extremo a extremo.
- El CI de GitHub no ha validado estos cambios aún.

## Criterios de aceptación de T-005

| Criterio | Estado |
| --- | --- |
| Lectura pública cacheada | Parcial: ránking de aura y listado paginado de peleadores. |
| Cambio visible tras cualquier escritura afectada | Parcial: aura y principales escrituras de ficha invalidadas; el resto aún no. |
| Ninguna página privada o dato oculto cacheado | Cumplido para estas porciones: `auraRanking()` y el listado mantienen `listed: true` y `hiddenAt: null`, no reciben sesión ni cookies, y la selección del listado no contiene fechas. |
| Mejora medida | Pendiente. |
| Pruebas de navegador y base vacía | Pendiente. |

## Decisiones ante ambigüedades

- Mantuve `force-dynamic` en las páginas: la caché es de la consulta pública, no de una página que puede contener estado de la sesión.
- No usé un `revalidate` largo sin etiqueta; se fijó 60 segundos y `ranking` permite invalidación inmediata donde se ha conectado.
- No añadí dependencias ni cambié la interfaz.
