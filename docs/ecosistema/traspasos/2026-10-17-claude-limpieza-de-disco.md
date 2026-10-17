# Limpieza del disco C: (hecha por Claude Code al quedarse Codex sin créditos)

- **Fecha:** 17-10-2026, tarde. **Encargo original:** [`2026-10-17-claude-encargo-codex-limpieza-de-disco.md`](2026-10-17-claude-encargo-codex-limpieza-de-disco.md) (reglas: solo C:, nunca E:; primero medir; solo lo regenerable; lo personal lo decide el fundador). Inventario de Antigravity: [`2026-10-17-antigravity-encargo-codex-limpieza-espacio-disco.md`](2026-10-17-antigravity-encargo-codex-limpieza-espacio-disco.md).
- **Resultado:** de **19,5 GB libres a unos 28–30 GB** (el valor baila unos cientos de MB porque otros programas escriben a la vez). Nada personal tocado. **E: no se ha mirado ni tocado.**

## Qué se borró (todo se regenera solo)

| Qué | Tamaño | Por qué es seguro |
|---|---|---|
| Caché de `npx` (`AppData\Local\npm-cache\_npx`): hyperframes, vitest, eslint, playwright, tsc, neon… | 5,7 GB | Ningún proceso la usaba; `npx` vuelve a descargar lo que haga falta. |
| Cuatro árboles de trabajo antiguos de la sesión `fae37286` (`fase1`, `wt`, `wt2`, `wt3`) y su carpeta temporal | ~1,4 GB (0,5 GB visibles en disco) | Sin cambios y con su commit ya en GitHub; quitados con `git worktree remove`. |
| Navegadores de pruebas antiguos (`ms-playwright\chromium-1234` y `chromium_headless_shell-1234`) | 0,7 GB | Lona usa la versión 1243; la antigua se vuelve a bajar con `npx playwright install` si algún proyecto la pidiera. |
| `MiClaude\test-results` | 0,1 GB | Capturas de diagnóstico de pruebas; se regeneran. |
| Contenedores de pruebas parados (`lona-pg-local`, `codex-ring-elite-pg`, `lona-demo-pg`, `ringe2e-pg`, `ring-pg`) con sus volúmenes, y los volúmenes sueltos `ringe2e-work` y `ringmap` | ~3,6 GB dentro de Docker | Bases de pruebas paradas desde hace días (las de Lona no tienen datos reales). **No se nota en Windows** hasta compactar el disco de Docker (ver abajo). |

## Qué NO se tocó y por qué

| Qué | Tamaño | Motivo |
|---|---|---|
| Contenedores **en marcha** `lona-pg-codex-demo` y `lona-pg-medida` | — | Están en uso (probablemente la «demo local» del puerto 3141 de hoy). |
| Contenedores del fundador (documenso, postiz, temporal…) y sus volúmenes | — | Son suyos. |
| Carpeta temporal `ec282358…\scratchpad\wt-prod` | 1,3 GB | Árbol de trabajo con **un cambio sin guardar**. Decide el fundador (o quien lo creó). |
| Árboles `28db3f86…\orig` y `6aa4610f…\wt-lona` | 0,06 GB | Sus commits **no están en GitHub**. |
| Sesiones `bdebeb55…` (esta) y `2fa3982e…` | 0,7 GB | Protegidas por el encargo (sesión en uso y árbol de seguridad). |
| `MiClaude/.next` | — | La usa un `next dev` en marcha (puerto 3141). |
| Caché de npm `_cacache` | 0 | Ya estaba vacía. |

## Lo que decide el fundador (nivel 2)

| Qué | Tamaño | Nota |
|---|---|---|
| Vídeos y renders en `MiProyectoAI/`: `videos` (0,71 GB), `boxeo-remotion` (0,74), `ring-espana-videos` (0,63), `HAKEMM-VELADA-BOXEO-SHORT` (0,34), `GTA-CALLE-TEST-SHORT` (0,23) | **2,65 GB** | Antigravity los da por prescindibles, pero son trabajo tuyo: solo se borran con tu «sí» expreso, carpeta por carpeta. |
| Compactar el disco virtual de Docker | hasta ~5 GB | Hay que parar Docker Desktop (y con él documenso, postiz…) unos minutos. Se hace desde Docker Desktop → Troubleshoot → «Clean / Purge data» **no** (borra todo); lo correcto es compactar el `.vhdx` con permisos de administrador. Mejor hacerlo juntos cuando no estés usando esos programas. |
| Imágenes de Docker sin usar | ~2 GB | Pueden ser de tus otros proyectos: revisar antes. |
| `Downloads`, `Documents`, `Pictures`, `Videos` | no medido | Personales: no se miran sin que lo pidas. |

## Siguiente paso

Si quieres más espacio: dime qué carpetas de vídeo borrar y cuándo podemos parar Docker un rato para compactarlo.
