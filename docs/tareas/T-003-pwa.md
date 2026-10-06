# T-003 — Web instalable (PWA)
**Nivel:** N2 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F3 · **Estado:** lista · **Sugerida a:** Antigravity (prueba de ingreso 2) o Codex · **Depende de:** —

## Objetivo
Que la aplicación se pueda «instalar» desde el navegador del móvil (Android Chrome e iOS Safari «Añadir a pantalla de inicio»), con icono, nombre, color y una página clara cuando no hay conexión. Es el primer escalón hacia las tiendas (`docs/MOVIL.md`).

## Contexto
Hoy no hay manifiesto, ni iconos de aplicación, ni `theme-color`, ni service worker. Color oficial: `#BE33F5` (solo el color está decidido; **el logotipo no**: usa el icono provisional que ya aparece en la cabecera, `svg.brand-mark` en `layout.tsx`, sin inventar identidad). Next.js 15 permite `src/app/manifest.ts` y `src/app/icon.*`.

## Pasos
1. Rama `<asistente>/T-003-pwa`.
2. `src/app/manifest.ts`: `name` «Ring España», `short_name` «Ring España», `start_url` «/», `display` «standalone», `lang` «es», `theme_color` y `background_color` `#BE33F5` / el fondo actual (`--bg` de `globals.css`), iconos 192 y 512 (y «maskable»).
3. Iconos: genera PNG 192/512/maskable y `apple-touch-icon` 180 a partir del símbolo provisional (script `scripts/generar-iconos.mjs` con `sharp`, que ya es dependencia). Guarda los PNG en `public/`. Documenta que son **provisionales** hasta el diseño final.
4. `src/app/layout.tsx`: `metadata.themeColor`, `appleWebApp` (capable, título) y `viewport` correcto (sin bloquear el zoom).
5. Service worker mínimo `public/sw.js` registrado desde un componente cliente: **solo** guarda en caché la página `/sin-conexion` y los iconos; **nunca** cachea datos de usuarios ni respuestas de acciones. Nueva pantalla `src/app/sin-conexion/page.tsx` en español llano («No hay conexión. Cuando vuelva, podrás seguir donde lo dejaste.») con un botón «Reintentar» que recarga.
6. Pruebas: `tests/e2e/pwa.mjs` (manifiesto accesible y válido, iconos 200, `theme-color` presente, `sw.js` 200, página sin conexión accesible) y añádelo a `test:e2e`. Axe sobre `/sin-conexion` en `accesibilidad.mjs`.
7. `npm run typecheck && npm test && npm run build`, `pwa.mjs`, `movil.mjs`, `accesibilidad.mjs`.

## Criterios de aceptación
- `/manifest.webmanifest` válido; Lighthouse «instalable» en Chrome (si no se puede ejecutar, dilo y deja la comprobación manual descrita en el PR).
- El service worker no cachea nada con datos de personas; al cerrar sesión no queda nada privado en caché.
- Cero enlaces o botones muertos; todo en español.

## No hacer
No inventar logotipo ni cambiar colores. No notificaciones push todavía. No cachear páginas dinámicas.

## Documentar
`MOVIL.md` (estado), `ARQUITECTURA.md`, `DIARIO.md`, tu registro.
