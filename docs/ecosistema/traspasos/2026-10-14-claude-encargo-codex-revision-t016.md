# Encargo de Claude para Codex: revisión previa a la versión oficial (T-016, partes 3, 4 y 5)

- **Fecha:** 14 de octubre de 2026. **De:** Claude Code. **Para:** Codex, cuando tenga créditos.
- **Repositorio:** `MiClaude/`, rama `claude/ring-espana-mvp`, versión 0.13.1 o posterior.

## Antes de empezar (obligatorio)
1. `git fetch` y `node scripts/estado.mjs`. Lee `docs/ESTADO.md`.
2. Reserva el trabajo: `node scripts/estado.mjs reservar codex "revisión T-016 partes 3-5"`.
3. Lee la ficha `docs/tareas/T-016-revision-previa-al-lanzamiento.md`, que tiene las cinco partes y el formato de cada hallazgo.

## Reparto
- **Claude:** partes 1 (seguridad y moderación) y 2 (preparación de la versión oficial).
- **Codex (este encargo):**
  - **parte 3:** visitante y aficionado;
  - **parte 4:** peleador y entrenador;
  - **parte 5:** gimnasios, organizadores y veladas.
- **Antigravity:** recorrido por la demo con el navegador. Es otro encargo: `2026-10-14-claude-encargo-antigravity-recorrido-demo.md`.

## Cómo hacerlo
- **Revisa en solo lectura.** No arregles nada todavía. Así el fundador ve la lista completa y decide.
- Trabaja **parte por parte**. Al acabar cada una, guarda sus hallazgos en `docs/tareas/T-016-hallazgos-codex.md`, en la rama `codex/revision-t016`, y súbela con commit y push antes de seguir. Si te quedas sin créditos, lo revisado no se pierde.
- No edites `T-016-revision-previa-al-lanzamiento.md`, que es de Claude, para no pisarte.
- Por cada hallazgo:
  - **gravedad:** BLOQUEA EL LANZAMIENTO, IMPORTANTE o MENOR;
  - `archivo:línea`;
  - qué falla y cómo se reproduce;
  - el arreglo en una frase;
  - **comprobado** o **sospechado**.
- **Ten presente:**
  - La oficial arranca con la base **vacía**: revisa cómo quedan los estados vacíos.
  - Sin `DEMO_MODE`, no puede verse nada de demo.
  - La app se llama **Lona**; «Ring España» está retirado.
  - **Ningún gimnasio de Cataluña**, ni siquiera en el mapa.
  - Reglas de la escalera: las veladas pasadas solo con permiso de moderación, el récord amateur oculto y el autodeclarado cuenta a las 24 horas.
- Al terminar las tres partes:
  - abre un PR solo de documentación, con su subida de versión (`node scripts/version.mjs subir parche`) y el CHANGELOG;
  - deja un traspaso en `docs/ecosistema/traspasos/`;
  - actualiza tu fila en `ESTADO.md`.

## Hallazgo ya conocido (apúntalo en la parte 3)
- **No existen páginas de condiciones de uso ni de cookies**: en `src/app/` solo hay `privacidad/`. Comprobado por Claude el 14-10-2026.
- Las condiciones dependen del abogado (`LANZAMIENTO.md`, sección 2). Indica qué textos o enlaces de la app las mencionan y si la app solo usa cookies técnicas (en ese caso no hace falta banner).

## Después de la revisión (no antes)
- Sigue el encargo de paneles `2026-10-14-claude-encargo-codex-paneles-por-usuario.md`: bloques F → G → D (gimnasios de OpenStreetMap sin Cataluña; enseña al fundador el recuento por provincia antes de cargarlos en la oficial) → H.
- El PR #56 (bloque F) apuntaba a #55, que ya está fusionado: cambia su destino a `claude/ring-espana-mvp` y renumera su versión.
- Claude revisa cada PR antes de fusionarlo.
