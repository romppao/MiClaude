# T-001 — Conciliar la PR #13 (móvil) con el menú actual
**Nivel:** N3 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F1 · **Estado:** hecha por Claude el 6 de octubre de 2026 (commit 329e378: se portaron `MobileNav` y el perfil adaptable; `HeaderMenu` descartado; PR #13 cerrado). Pendiente de esta ficha: la prueba a 320/390/430 px de la #13 → T-009 · **Sugerida a:** — · **Depende de:** —

## Objetivo
Aprovechar lo bueno de la PR #13 (menú compacto y perfiles adaptables para móvil) **sin duplicar** el menú que ya existe (`NavigationMenu`) ni la barra inferior, y cerrar la PR.

## Contexto
- `main` (`claude/ring-espana-mvp`) ya tiene `src/app/components/NavigationMenu.tsx` (diálogo «Menú» por actividades) y una barra inferior móvil (`.mobile-nav` en `globals.css`, renderizada en `layout.tsx`). La PR #13 añade `HeaderMenu.tsx` y `MobileNav.tsx` y 46 líneas de CSS: **dos controles de menú en la misma pantalla** si se integra tal cual (`docs/APORTACIONES-CODEX.md`, «Relevo para Work»).
- Auditoría de móvil actual: `tests/e2e/movil.mjs` (zonas táctiles de 44 px, letra de 16 px, sin desbordes, barra que no tapa contenido). Debe seguir en verde.

## Pasos
1. `git fetch`; crea `codex/T-001-conciliar-movil` desde la punta actual de `claude/ring-espana-mvp`.
2. Lee el diff de la PR #13 (`gh`/GitHub) y lista **qué aporta que `main` no tenga** (CSS de perfiles adaptables, ajustes de cabecera, pruebas en `usabilidad.mjs`).
3. Aplica **solo** esas aportaciones sobre el código actual. **No** añadas `HeaderMenu.tsx` ni `MobileNav.tsx`: si hace falta algo de ellos, intégralo en `NavigationMenu.tsx` / la barra existente.
4. Comprueba en 360, 390 y 430 px que hay **un solo** control «Menú» y una sola barra inferior.
5. Pasa `npm run typecheck && npm test && npm run build && node tests/e2e/movil.mjs && node tests/e2e/menu.mjs && node tests/e2e/usabilidad.mjs`.
6. Abre un PR nuevo que cierre la #13 («Sustituye a #13») y explica qué se aprovechó y qué se descartó y por qué.

## Criterios de aceptación
- Un solo menú y una sola barra inferior en móvil; `movil.mjs`, `menu.mjs`, `usabilidad.mjs` y `accesibilidad.mjs` en verde.
- Ningún CSS duplicado ni muerto; ningún cambio de paleta, tipografía ni composición (el diseño es provisional).
- Registro en `docs/APORTACIONES-CODEX.md` (qué se aprovechó, qué no).

## No hacer
No rediseñar. No tocar el aspecto de las tarjetas ni los colores. No borrar la rama de la #13 (lo decide el fundador).

## Documentar
`APORTACIONES-CODEX.md`, `DIARIO.md` (entrada al final), `LECCIONES.md` si algo falla.
