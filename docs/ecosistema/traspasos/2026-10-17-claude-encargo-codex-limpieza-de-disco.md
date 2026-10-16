# Encargo para Codex: limpieza responsable del disco C: del fundador

- **Fecha:** 17-10-2026. **De:** Claude Code. **Para:** Codex.
- **Por qué:** el fundador pidió «una limpieza profunda y responsable de mi sistema, ya que me estoy quedando sin espacio». El disco **C: tiene 7,7 GB libres de 952 GB**. Claude sigue con la aplicación (PR #101 y siguientes) y te lo delega.
- **Modelo y esfuerzo:** esfuerzo **medio**; es mecánico pero destructivo, así que **primero mide y enseña, después borra**. Si tu cliente no puede ver fuera de `MiClaude/`, dilo al fundador y no improvises.

## Reglas que no se discuten
1. **No tocar `E:` ni ningún disco que no sea `C:`** (orden expresa del fundador: «el disco E es mi SSD externo, no toques nada de ahí»). Ni listar, ni leer, ni mover. **No propongas mover cosas a `E:`.**
2. **Primero solo lectura.** Mide tamaños, haz un informe y solo entonces borra lo del nivel 1. Lo del nivel 2 **se lista con su tamaño y decide el fundador**.
3. **Nunca borres ni vacíes:** `Documents`, `Pictures`, `Videos`, `Music`, `Downloads` (solo enuméralos y dime cuánto ocupan), el vault `OBSIDIAN/`, `C:\Users\PC\.claude\` (contiene la memoria de los asistentes), `C:\Users\PC\.codex\`, cualquier carpeta `.git`, archivos `.env*` o con claves, y nada que no puedas recrear con un comando.
4. **Docker: solo lo de Lona.** Los contenedores del fundador (`documenso`, `documenso-postgres`, `documenso-mailpit`, `postiz` y compañeros, `temporal`…) y **sus volúmenes** son suyos: **no se tocan**. Nunca `docker system prune -a` ni `--volumes`.
5. **Git worktrees: con `git worktree remove`, no con borrado a pelo**, y solo tras comprobar en cada uno `git status` (sin cambios) y que su rama esté subida (`git log @{u}..` vacío). Si algo no está subido, no se borra y se avisa.
6. Un borrado a la vez, anotando qué era y cuánto liberó. Si un comando falla o pide permisos de administrador, no lo fuerces: anótalo.
7. **No borres la carpeta de la sesión de Claude que está en uso:** `C:\Users\PC\AppData\Local\Temp\claude\C--Users-PC-Desktop-MiProyectoAI\bdebeb55-f931-45d3-be7e-dca7e513be2a\` ni el árbol `...\2fa3982e-f63a-4d6d-8915-55aa51e9776a\scratchpad\seguridad` hasta que Claude lo indique (los dos se usan para las pruebas del PR en curso).

## Paso 1 — medir (solo lectura)
En Git Bash o PowerShell, tamaños de nivel 1 y 2 de: `C:\Users\PC`, `C:\Users\PC\AppData\Local`, `C:\Users\PC\AppData\Roaming`, `C:\Users\PC\Desktop` y `C:\Users\PC\Desktop\MiProyectoAI`; y `docker system df`. Claude ya lanzó una medición; si existe `C:\Users\PC\AppData\Local\Temp\lona-medida\espacio.log`, léela primero y completa lo que falte. Entrega una tabla: ruta · tamaño · qué es · ¿regenerable? · nivel (1 o 2).

## Paso 2 — nivel 1: se puede borrar sin pérdida (hazlo tras enseñar la tabla)
Todo lo que se recrea con un comando o lo crearon los asistentes:
- **Contenedores y datos de pruebas de Lona** (nombres `lona-*`: `lona-pg-*`, `lona-e2e-*`, `lona-demo-pg`, `ring-pg`, `ringe2e-pg`, `codex-ring-elite-pg`, `lona-pg-local`): `docker rm -f` de los que estén parados o sean de pruebas, **tras mirar que ninguno contenga datos que el fundador use** (si dudas, pregunta). Después `docker image prune` (solo imágenes sin etiqueta) y `docker builder prune`.
- **Carpetas de compilación y resultados:** `.next/`, `test-results/`, `dist/`, `coverage/`, `.turbo/` en cada proyecto de `C:\Users\PC\Desktop\MiProyectoAI\*` (no las de un servidor en marcha: si hay un `next dev` activo, no).
- **Temporales de los asistentes:** `C:\Users\PC\AppData\Local\Temp\claude\*` **excepto** las dos rutas de la regla 7; antes, los árboles de trabajo con `git worktree remove` desde `MiClaude/` (hay al menos: `…\28db3f86…\scratchpad\orig`, `…\2fa3982e…\scratchpad\flota-entradas`, `…\6aa4610f…\scratchpad\wt-lona`, `…\ec282358…\scratchpad\wt-prod`, `…\fae37286…\scratchpad\fase1`, `…\wt`, `…\wt2`, `…\wt3`) y `git worktree prune`. También `C:\tmp\lona-cartel`, `C:\tmp\lona-medida` y `C:\Users\PC\AppData\Local\Temp\lona-*`.
- **Cachés:** `npm cache clean --force`, caché de pip, caché de `node-gyp`, caché de Playwright que ya no se use (se vuelve a bajar con `npx playwright install`), `C:\Users\PC\AppData\Local\Temp` con más de 7 días (sin tocar lo que esté abierto).
- Papelera de reciclaje: **solo si el fundador lo pide**; puede contener cosas suyas.

## Paso 3 — nivel 2: se lista con tamaño y **decide el fundador** (no borrar)
- `node_modules/` de proyectos que no se usan hoy (se recrean con `npm ci`, pero cuesta tiempo y red).
- Copias de `MiClaude` en la raíz del proyecto (`MiClaude-codex-ring-v3`, `MiClaude-lona`, `MiClaude-lona-nombre`): `AGENTS.md` ya prohíbe esas copias, pero **comprueba que no tengan trabajo sin subir** antes de proponer quitarlas.
- Vídeos, renders y capturas dentro de los proyectos; modelos descargados (Ollama, Hugging Face…); instaladores en `Downloads`; datos de aplicaciones grandes en `AppData\Local` / `Roaming`.
- Cualquier cosa con valor personal o que no sepas qué es.

## Entrega
- Un informe breve en `docs/ecosistema/traspasos/2026-10-17-codex-limpieza-de-disco.md`: tabla antes/después, qué se borró (ruta, tamaño), qué se dejó y por qué, y la lista del nivel 2 con tamaños. **Sin claves, sin rutas de documentos personales con nombres que revelen contenido.** Espacio libre de `C:` antes y después.
- No fusiones nada ni toques `docs/ESTADO.md`: es una tarea de sistema, no del repositorio.
- Si algún comando destructivo te lo bloquea tu propio guardián, **no lo rodees**: avisa al fundador de qué quedó pendiente.
