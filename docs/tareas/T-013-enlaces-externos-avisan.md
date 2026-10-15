# T-013 — Todo enlace que abre otra pestaña lo avisa
**Nivel:** N1 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Actualización del encargo (fundador, 15-10-2026):** ejecución por Codex desde la demo tras fusionar #73; reserva `codex/t-013-enlaces-externos-20261015`. Incluye condiciones, privacidad, Multimedia y los enlaces de moderación de #73 y la autoría generada por el mapa. Se permiten los registros, versión, catálogo y documentación exigidos en cada PR. Los paneles F/G/D/H y sus ramas quedan fuera del alcance.

**Fase:** F1 · **Estado:** en curso · **Asignada a:** Codex (encargo del fundador, 15-10-2026) · **Depende de:** #73 fusionado (comprobado: 8c789bc)

## Objetivo
Que una persona que usa lector de pantalla (o que simplemente no espera que se abra otra pestaña) sepa **siempre** que un enlace sale de la aplicación. El inventario original era de ocho enlaces; tras #73 también faltan los avisos en los enlaces de moderación a fotos, vídeos y páginas.

## Contexto
Regla de accesibilidad y de claridad del proyecto (`CLAUDE.md`, «Principio fundacional», puntos 3 y 8). El patrón que ya usan otros enlaces es `<span className="sr-only"> (se abre en otra pestaña)</span>` (ejemplo: `src/app/components/TrajectoryList.tsx`, `src/app/respaldar/page.tsx`). Faltaba en `src/app/components/SelectorCategoria.tsx`, enlace «Consultar reglamento», y en los enlaces de moderación enumerados arriba.

## Pasos
1. Rama de reserva `codex/t-013-enlaces-externos-20261015` desde la punta de `claude/ring-espana-mvp`.
2. En `SelectorCategoria.tsx`, añade al enlace «Consultar reglamento» el mismo aviso que usan los demás (`sr-only`, con el texto «(se abre en otra pestaña)»), conservando `rel`.
3. Añade a `tests/e2e/enlaces.mjs` una comprobación general: en cada pantalla recorrida, **todo** `a[target=_blank]` debe tener `rel` con `noopener` (o `noreferrer`) y un texto accesible que contenga «otra pestaña» o «otra página web». Sigue el estilo de las comprobaciones existentes (misma función `auditarPagina`, mismo formato de mensaje en español).
4. Si la comprobación nueva encuentra otro enlace sin aviso, corrígelo igual y dilo en el informe.
5. Ejecuta `npm run typecheck && npm test && npm run build` y, con el servidor en marcha, `node tests/e2e/enlaces.mjs`. **Di en tu informe qué ejecutaste y qué no.**

## Criterios de aceptación
- `enlaces.mjs` falla en el código anterior (compruébalo: quita el aviso y vuelve a ejecutarlo) y pasa con tu cambio.
- Solo los ficheros del encargo actualizado y su documentación; sin rediseño.
- CI en verde; informe veraz.

## No hacer
No tocar estilos; corregir también los enlaces descubiertos por la auditoría. No añadir dependencias.

## Documentar
Entrada breve en tu registro (`docs/APORTACIONES-<NOMBRE>.md`) y en `DIARIO.md`.
