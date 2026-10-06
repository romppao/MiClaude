# RFC-001 — El ránking sin filtros no cabe en el presupuesto con volumen

**Estado:** propuesta · **Autor:** Claude · **Fecha:** 6 de octubre de 2026 · **Origen:** T-006 ([`../rendimiento/EXPLAIN-2026-10-06.md`](../rendimiento/EXPLAIN-2026-10-06.md)). Arbitra el fundador si no hay acuerdo ([`README.md`](README.md)).

## Problema
Con 100 000 peleadores y 1 000 000 de auras (datos de carga ficticios), el ránking sin filtros tarda **1,85 s** (presupuesto: 300 ms). Es la pantalla por defecto. El cálculo agrupa todas las auras en cada visita y trae las filas a Node (`aura/ranking.ts`, `db.aura.groupBy` por peleador y combate). Los índices no lo arreglan: hay que recorrer el millón de filas.

## Alternativas
| Opción | Cómo | Coste | Riesgo |
|---|---|---|---|
| A. Solo caché (T-005) | `leerCacheado` 60 s con invalidación al dar o quitar aura | Ya en curso | La primera visita tras cada cambio sigue costando unos 2 s; con mucha actividad la caché casi no se aprovecha |
| B. Tabla de totales (recomendada) | Tabla `AuraTotal(fighterId, boutId, total)` mantenida en la misma transacción que `giveAura`/`removeAura`; el ránking suma esa tabla en lugar de contar auras | Migración aditiva, relleno inicial y cambio en dos acciones | Hay que mantenerla coherente: prueba de que coincide con el recuento directo; la moderación que oculta auras (`hiddenAt`) debe actualizarla |
| C. Vista materializada | `REFRESH MATERIALIZED VIEW` cada N minutos | Poco código | Datos de hasta N minutos de antigüedad; el proveedor debe permitir tareas programadas |

## Recomendación
**B más A:** B reduce el cálculo a recorrer una tabla ya agrupada y A evita repetirlo. Medir antes y después con `scripts/datos-de-carga.mjs`; si B no baja de 300 ms con el volumen de carga, evaluar C.

## Qué no cambia
Las reglas del aura (un clic por usuario y combate), el cálculo de trayectoria y respaldo, y el resultado visible del ránking: la prueba de equivalencia con el cálculo actual es condición para integrarla.

## Pendiente de decidir
Quién la ejecuta (se propone a Codex como ficha N3 nueva, tras T-005) y si el fundador acepta cambiar el modelo de datos antes del lanzamiento.
