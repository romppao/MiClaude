# T-002 — Dependabot sin saltos mayores y limpieza de PRs
**Nivel:** N1 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F1 · **Estado vigente:** pendiente de revisión por Codex (15-10-2026) · **Depende de:** T-013 como orden de integración.

**Historial:** la tarea original la terminó Claude el 6-10-2026. Dejó de servir como prueba de ingreso (la sustituyó T-013); el nuevo encargo de abajo la reabre para agrupar actualizaciones.

## Encargo vigente — 15 de octubre de 2026

El fundador encarga a Codex unir **#17, #18, #19, #65 y #66 en un solo PR**, después de T-013. Reserva: `codex/t-002-dependabot-agrupado-20261015`, desde la demo 8c789bc. **Estado: pendiente de revisión.** Este encargo sustituye para esta entrega las restricciones históricas «no actualizar dependencias / no tocar package.json» de abajo; se conserva el historial de la tarea original.

| PR | Dependencia | Versión solicitada |
|---|---|---|
| #17 | vitest | 5.0.3 |
| #18 | sharp | 0.35.5 |
| #19 | next | 15.5.27 |
| #65 | maplibre-gl | 6.14.0 (fijada) |
| #66 | @types/node | 26.6.5 |

Pasos: actualizar juntas las cinco declaraciones y generar un único `package-lock.json`; conservar Node >=22, Next 15, Prisma 6, React 19 y TypeScript 5; ejecutar instalación reproducible, tipos, unitarias, compilación, mapa, catálogo, navegador y accesibilidad. Documentar pruebas reales y límites, CHANGELOG, versión, fila de Codex y APORTACIONES-CODEX. No modificar los paneles F/G/D/H ni cerrar los PR ajenos. Tras integrar, el fundador puede cerrar los cinco originales por sustitución; #20 queda fuera de este encargo.

## Objetivo histórico
Que Dependabot deje de proponer saltos mayores incompatibles (Next 16, Prisma 7, TypeScript 7) y que las PRs obsoletas queden identificadas para cerrar.

## Contexto
Hay 7 PRs de Dependabot abiertas (#1–#7). Las de **Next 15→16**, **Prisma 6→7** y **TypeScript 5→7** fallan el CI y **no se pueden adoptar** sin un trabajo específico: la regla del proyecto es TypeScript 5.x (Next 15 no es compatible con TS 7). Las de acciones (`checkout`, `setup-node`, `upload-artifact`) son saltos mayores de acciones de GitHub: se prueban una a una. La PR #9 ya está incluida en #10 (obsoleta).
Archivo: `.github/dependabot.yml`.

## Pasos
1. Rama `<asistente>/T-002-dependabot`.
2. En `.github/dependabot.yml`, bajo `npm`, añade `ignore` para saltos mayores de `next`, `prisma`, `@prisma/client`, `typescript` y `react`/`react-dom`:
   `ignore: [{ dependency-name: "next", update-types: ["version-update:semver-major"] }, …]` (uno por dependencia). Mantén las menores y los parches.
3. Conserva `open-pull-requests-limit: 5` y el calendario.
4. Abre el PR. En la descripción **lista** las PRs que habría que cerrar (#3, #4, #5, #6 por salto mayor; #9 por duplicada) y las de acciones (#1, #2, #7) que se pueden probar aparte.
5. **No cierres PRs ajenas**: lo hace el fundador (o lo autoriza explícitamente).

## Criterios de aceptación
- El YAML es válido (el CI de GitHub lo comprueba) y las reglas `ignore` cubren las cinco dependencias.
- El PR contiene la lista de PRs a cerrar con su motivo.

## No hacer
No actualizar dependencias. No tocar `package.json`.

## Documentar
Entrada breve en tu registro y en `DIARIO.md`. Si es tu primera tarea, escribe antes tu `APORTACIONES-<NOMBRE>.md` con qué puedes y qué no puedes ejecutar.

## Base y versión actuales

La rama integra d6a63d5 (#75, demo 0.17.0) y conserva sus scripts y pruebas de paneles sin modificarlos. Entrega 0.17.2 para integrar tras T-013 (0.17.1). Las cinco resoluciones siguen exactamente en las versiones de la tabla. Validación anterior de d62b8d1 sobre #74: https://github.com/romppao/MiClaude/actions/runs/38706575120. El PR de esta entrega valida la base actual.
