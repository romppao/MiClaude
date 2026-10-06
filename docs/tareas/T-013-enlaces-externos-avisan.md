# T-013 — Todo enlace que abre otra pestaña lo avisa
**Nivel:** N1 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F1 · **Estado:** lista · **Sugerida a:** Antigravity, Copilot y Open Code (prueba de ingreso 1; el primero que la tome) · **Depende de:** —

## Objetivo
Que una persona que usa lector de pantalla (o que simplemente no espera que se abra otra pestaña) sepa **siempre** que un enlace sale de la aplicación. Hoy hay 8 enlaces con `target="_blank"` y **uno no lo avisa**.

## Contexto
Regla de accesibilidad y de claridad del proyecto (`CLAUDE.md`, «Principio fundacional», puntos 3 y 8). Los otros siete enlaces ya llevan `<span className="sr-only"> (se abre en otra pestaña)</span>` (ejemplo: `src/app/components/TrajectoryList.tsx`, `src/app/respaldar/page.tsx`). El que falta: `src/app/components/SelectorCategoria.tsx`, enlace «Consultar reglamento».

## Pasos
1. Rama `<asistente>/T-013-prueba` desde la punta de `claude/ring-espana-mvp`.
2. En `SelectorCategoria.tsx`, añade al enlace «Consultar reglamento» el mismo aviso que usan los demás (`sr-only`, con el texto «(se abre en otra pestaña)»), conservando `rel`.
3. Añade a `tests/e2e/enlaces.mjs` una comprobación general: en cada pantalla recorrida, **todo** `a[target=_blank]` debe tener `rel` con `noopener` (o `noreferrer`) y un texto accesible que contenga «otra pestaña» o «otra página web». Sigue el estilo de las comprobaciones existentes (misma función `auditarPagina`, mismo formato de mensaje en español).
4. Si la comprobación nueva encuentra otro enlace sin aviso, corrígelo igual y dilo en el informe.
5. Ejecuta `npm run typecheck && npm test && npm run build` y, con el servidor en marcha, `node tests/e2e/enlaces.mjs`. **Di en tu informe qué ejecutaste y qué no.**

## Criterios de aceptación
- `enlaces.mjs` falla en el código anterior (compruébalo: quita el aviso y vuelve a ejecutarlo) y pasa con tu cambio.
- Ningún otro fichero tocado; sin cambios de aspecto.
- CI en verde; informe veraz.

## No hacer
No tocar estilos ni textos de otros enlaces. No añadir dependencias.

## Documentar
Entrada breve en tu registro (`docs/APORTACIONES-<NOMBRE>.md`) y en `DIARIO.md`.
