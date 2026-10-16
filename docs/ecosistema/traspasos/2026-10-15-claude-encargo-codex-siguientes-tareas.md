# Encargo para Codex: siguientes tareas de Lona

- **Fecha:** 15-10-2026 (noche).
- **De:** Claude Code. **Para:** Codex.
- **Qué hay en la principal:** `claude/ring-espana-mvp` está en la **0.18.8**. Léela con `git fetch` antes de empezar: esta lista puede quedar desfasada.
- **Modelo y coste (AGENTS.md):** esfuerzo **medio** por defecto. Pruebas completas (e2e, catálogo, mapa) **una vez antes de entregar** cada PR, no en cada paso. Si no tienes créditos, no empieces nada y avisa al fundador.

## Estado de partida (comprobado el 15-10 por la noche)

| PR | Qué es | Versión | Estado |
|---|---|---|---|
| #92 | Bandeja única de moderación (tuya, #86, integrada por Claude) | 0.18.9 | **Fusionado el 15-10 por la noche con autorización del fundador.** |
| #93 | Fase 1 de Claude: veladas con cartel y entradas con señal por Bizum | 0.20.0 | CI en repetición (la prueba `calendario.mjs` buscaba la clase vieja de las tarjetas). |
| #88 | Miembros de gimnasio con invitación | 0.19.0 | Borrador. Tiene conflictos con la principal. Revisado y aprobado. |
| #89 | Cesión de gimnasio con aceptación | 0.19.1 | Borrador. Conflictos. Revisado y aprobado. |
| #90 | Gimnasios desde fichas en revisión | 0.19.2 | Borrador. Conflictos y **el CI falla** (ver tarea 3). |
| #91 | T-009: dieciséis recorridos por tipo de cuenta | 0.19.3 | Borrador. Conflictos. **Falta que Claude lo revise.** |

## Orden de fusión que propone Claude

`#92` → `#93` → `#88` → `#89` → `#90` → `#91`. Fusiona el fundador, o Claude con su autorización. Tú **no fusionas** nada.

Como #93 ya es la 0.20.0, **tus cuatro PR se renumeran después**: #88 → 0.20.1, #89 → 0.20.2, #90 → 0.20.3, #91 → 0.20.4. Usa siempre `node scripts/version.mjs`, no edites los números a mano.

## Tareas, por orden

### 1. Actualizar #88 y #89 sobre la principal nueva
- #92 ya está fusionado. Espera a que se fusione #93 (o a que el fundador diga que empiezas ya).
- Rama desde `origin/claude/ring-espana-mvp`: trae tu trabajo con merge, no con rebase, para no reescribir un historial ya revisado.
- Conflictos esperados: `CHANGELOG.md`, `docs/DIARIO.md`, `docs/ESTADO.md`, `docs/catalogo-codigo.json`, `docs/mantenimiento/CATALOGO.md`, `docs/MAPA-FUNCIONAL.md`, `package.json` y `package-lock.json`. **Conserva las dos partes** y regenera catálogo y mapa con sus scripts; no mezcles a mano los JSON generados.
- Comprueba que ningún archivo termine con marcadores `<<<<<<<` (la integración del 15-10 ya truncó documentos con una expresión regular; no repitas ese método).
- Un PR por vez, y el siguiente solo cuando el anterior esté fusionado.

### 2. #89 (después de #88)
Igual que la tarea 1. Su cambio de código no necesita más revisión; solo actualización, versión y CI verde.

### 3. #90: arreglar la prueba que falla
- Falla `tests/e2e/gimnasios-altas.mjs:24`: espera 30 s el campo `[name=gym]` dentro del formulario con el botón «Guardar los datos de mi ficha» y no aparece (captura de `/mi-ficha` de «Alta Club»).
- Averigua si el formulario ya no tiene ese campo con ese nombre o si la prueba lo busca en otro formulario. Corrige **la prueba o el formulario**, el que esté mal, y explica cuál era en el PR.
- Después, la actualización sobre la principal y la renumeración como en la tarea 1.

### 4. #91 (T-009)
- Claude no lo ha revisado. Antes de subir la versión nueva, comprueba que ninguno de los dieciséis recorridos depende de la clase `card` en `/veladas`.
- **Cambio de #93 que te afecta:** las tarjetas de `/veladas` ahora son `a.velada-cartel` dentro de `.velada-grid`; ya no llevan `.card`. Usa esos selectores o, mejor, el texto visible.
- Cuando lo subas, avisa y Claude lo revisa.

### 5. Fase 2: agenda del entrenador (aprobada por el fundador)
**Empieza solo cuando #93 esté fusionado**, en una rama nueva `codex/agenda-entrenador-AAAAMMDD` desde la principal. Un PR pequeño por trozo, no uno gigante.

Alcance acordado:
- Pestañas **«próximas», «pendientes», «impartidas» y «canceladas»** en la agenda del entrenador.
- **Cambiar día y hora** de una clase con aceptación del alumno (el alumno acepta o rechaza; mientras no responda, la clase conserva la fecha anterior).
- Marcar una clase como **«impartida»** o **«no se presentó»**.
- **Editar las clases.**
- Botones de **WhatsApp, llamar y correo** hacia el alumno.
- El alumno ve lo mismo desde su lado: sus clases, el cambio de fecha pendiente de respuesta y los botones hacia el entrenador.
- Principio del fundador: «que la aplicación tenga todas las utilidades cubiertas al 100 %». Piensa en la comodidad de quien la usa, pero **no inventes** reglas de negocio nuevas: si dudas, pregunta.

Trozos propuestos (propón otro orden si ves uno mejor):
1. Modelo y acciones del servidor (estados de la clase, solicitud de cambio, aceptación) con pruebas unitarias.
2. Pantalla del entrenador con las cuatro pestañas.
3. Pantalla del alumno y avisos (usa el sistema de avisos que ya existe).
4. Prueba e2e y documentación.

**Diseño:** respeta los tokens de `src/app/globals.css` (`--acc` lima, `--violet`, Archivo, tarjetas de 24 px) y la referencia `web/apple-boxeo.html`. Usa las skills de diseño que tengas en `.agents/skills/` (`emil-design-eng`, `apple-design`, `animate`); si una no está en tu cliente, dilo en el PR. **Privacidad:** el teléfono y el correo del alumno solo se enseñan al entrenador con el que tiene una clase, nunca en listados públicos.

### Cosas que NO son tuyas ahora
- **Los cuatro ajustes de móvil** (`/`, `/gimnasios`, `/veladas`, `/peleadores`) son de Antigravity.
- **El vídeo promocional** tiene su propio encargo: `2026-10-15-claude-encargo-codex-video-promocional-lona.md`. Si el fundador no dice otra cosa, **primero las tareas 1 a 4** (desbloquean la principal) y luego el vídeo.
- **RFC-001 (#61) y la revisión T-016 (#60):** esperan decisión del fundador.
- **Inventario OSM real, cargas en la demo o en producción, dominio y correo:** nada de eso sin autorización expresa.

## Al terminar cada PR
Un traspaso breve en `docs/ecosistema/traspasos/2026-10-1X-codex-...md` con: qué cambió, qué comprobaste (y qué **no**), y qué queda. No declares pruebas, conexiones ni despliegues que no hayas hecho.
