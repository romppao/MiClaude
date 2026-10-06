# Parte 2 — prueba común MÁXIMO: T-005, caché de lecturas públicas

## Resultado honesto

La ficha T-005 **no está completada**. He implementado y validado una porción acotada: el cálculo del ránking público de aura se sirve mediante `unstable_cache`, con una clave que incluye todos sus filtros normalizados, una caducidad de 60 segundos y la etiqueta `ranking`. Dar o retirar aura invalida esa etiqueta después de escribir, antes de redirigir.

No afirmo que esto cubra todos los criterios de T-005 ni que el proyecto entero esté libre de datos desactualizados: aún faltan la caché de listado/ficha de peleadores, portada, veladas, gimnasios y entrenadores; sus etiquetas de escritura; la medición de consultas; y las pruebas de navegador con base vacía.

## Qué hice

- Creé `src/lib/common/cache.ts` con `leerCacheado(clave, etiquetas, segundos, fn)` y las etiquetas públicas definidas por la ficha.
- Convertí `auraRanking()` en una envoltura cacheada que delega el cálculo a `auraRankingSinCache()`.
- La clave incluye `discipline`, `level`, `province`, `sinceDays` y `fighterId`, incluidos como `null` cuando no se usan, para que dos combinaciones no compartan resultado.
- Elegí este cálculo porque devuelve únicamente datos JSON seguros (texto, números, booleanos y nulos); no hay fechas que rehidratar. No he aplicado el ayudante aún a consultas Prisma que devuelven fechas, porque hacerlo sin una conversión explícita incumpliría la advertencia de la ficha.
- Añadí `invalidar(...etiquetas)` al módulo compartido de acciones y lo llamé desde `giveAura()` y `removeAura()`.
- Añadí `tests/unit/cache.test.ts` y adapté la prueba del ránking para aislarla del runtime de caché de Next.

## Qué ejecuté yo

| Comando | Resultado |
| --- | --- |
| `npx vitest run tests/unit/cache.test.ts tests/unit/ranking-trayectoria.test.ts` | Correcto: 2 archivos, 5 pruebas aprobadas. |
| `npm run typecheck` | Correcto. |

## Qué no ejecuté o no pude comprobar

- No ejecuté la prueba de navegador `tests/e2e/cache.mjs`: todavía no existe y esta máquina no tiene una base PostgreSQL de prueba preparada.
- No medí consultas ni latencia con `DEBUG_QUERIES=1` ni k6; por tanto no hay cifras de mejora.
- No ejecuté una acción contra un servidor Next y base de datos reales para comprobar la invalidación de extremo a extremo.
- El CI de GitHub no ha validado estos cambios aún.

## Criterios de aceptación de T-005

| Criterio | Estado |
| --- | --- |
| Lectura pública cacheada | Parcial: solo ránking de aura. |
| Cambio visible tras cualquier escritura afectada | Parcial: dar/quitar aura invalida el ránking; el resto de escrituras aún no. |
| Ninguna página privada o dato oculto cacheado | Cumplido para esta porción: `auraRanking()` ya filtra `listed: true` y `hiddenAt: null`, y no recibe sesión ni cookies. |
| Mejora medida | Pendiente. |
| Pruebas de navegador y base vacía | Pendiente. |

## Decisiones ante ambigüedades

- Mantuve `force-dynamic` en las páginas: la caché es de la consulta pública, no de una página que puede contener estado de la sesión.
- No usé un `revalidate` largo sin etiqueta; se fijó 60 segundos y `ranking` permite invalidación inmediata donde se ha conectado.
- No añadí dependencias ni cambié la interfaz.
