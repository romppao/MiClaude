# Red de seguridad y flujo de trabajo Claude + Codex

> **Petición del fundador (16-10-2026):** «Es muy importante que usemos algún framework para evitar romper cosas que ya funcionaban o ya habíamos aprobado al hacer una actualización del proyecto.» Y: «replicar el flujo de trabajo» del vídeo de @robles.ia (Claude planifica y decide, Codex ejecuta y revisa).
> Esta página dice **qué protege hoy a Lona, cómo se usa y qué falta**. Para el cruce con la lista de conceptos de ingeniería, mira [`COBERTURA-CONCEPTOS.md`](COBERTURA-CONCEPTOS.md).

## 1. Las capas de protección

| # | Capa | Qué evita | Dónde | Estado |
|---|---|---|---|---|
| 1 | **Tipos** (TypeScript) | Errores de programación que compilan mal | `npm run typecheck` | ✔ |
| 2 | **Pruebas unitarias** (más de 850) | Reglas de negocio rotas (señal, plazos, récord, rankings…) | `npm test` | ✔ |
| 3 | **Recorridos de navegador** (37) | Pantallas y flujos completos rotos, como los usa una persona | `tests/e2e/`, lista en `tests/e2e/orden.json` | ✔ |
| 4 | **Accesibilidad** (WCAG 2.2 AA, dos temas) | Pantallas que dejan de poder usarse con teclado o lector | `npm run test:a11y` | ✔ |
| 5 | **Catálogo, mapa funcional y versión** | Documentación que no refleja el código; PR sin subir de versión | `scripts/generar-catalogo.mjs`, `scripts/generar-mapa.mjs`, `scripts/version.mjs` | ✔ |
| 6 | **Registro de funciones aprobadas** | Que alguien debilite o borre la prueba de algo que el fundador aprobó | [`APROBADO.md`](APROBADO.md) + `tests/documentacion/aprobado.test.mjs` | **nuevo** |
| 7 | **Ningún recorrido se queda fuera del CI** | Que un recorrido nuevo se olvide en la lista y no se ejecute nunca | `tests/e2e/orden.json` + `tests/documentacion/e2e.test.mjs` | **nuevo** |
| 8 | **El CI no se detiene en el primer fallo** | Fallos que aparecen de uno en uno, con 20 minutos entre cada uno | `scripts/e2e-todos.mjs` | **nuevo** |
| 9 | **Todo en tu equipo con un comando** | Esperar al CI para descubrir lo que se podía ver en local | `npm run verificar` / `npm run verificar -- --e2e` | **nuevo** |
| 10 | **Regresión visual** (capturas de referencia aprobadas) | Cambios de aspecto que nadie quería (como el CSS torcido de nueve formularios, `LECCIONES.md`) | — | **falta** (ver §5) |
| 11 | **Protección de la rama principal** (nada se fusiona con el CI en rojo) | Fusionar un PR roto por descuido | Ajuste del repositorio en GitHub | **falta** (decide el fundador) |

## 2. Cómo se usa

```text
npm run verificar                       # tipos, pruebas, catálogo, mapa, versión, documentación y aprobado (≈ 2 min)
npm run verificar -- --e2e              # además los 37 recorridos de navegador (levanta una base desechable con Docker)
npm run verificar -- --e2e --solo calendario,inscripciones     # solo esos recorridos
npm run verificar -- --e2e --a11y       # además la accesibilidad
npm run test:e2e:local                  # solo los recorridos, con su base desechable
```

- **Docker** hace falta solo para los recorridos de navegador. Si no está en marcha, el script lo arranca (en Windows puede tardar un minuto).
- En Windows no hay `psql`: el script crea un sustituto temporal que habla con el contenedor. Se borra al terminar, igual que la base.
- El CI de GitHub ejecuta lo mismo con `npm run test:e2e` (que ahora es `scripts/e2e-todos.mjs`): corre todos los recorridos y al final resume cuáles fallaron.

### Reglas para quien programe (Claude, Codex, Antigravity)
1. **Antes de abrir un PR:** `npm run verificar` y los recorridos que toque tu cambio (`--e2e --solo …`). No declares comprobaciones que no hiciste.
2. **Una función aprobada por el fundador se apunta en [`APROBADO.md`](APROBADO.md) en el mismo PR**, con la prueba que la vigila. Quitar o cambiar una fila exige la aprobación expresa del fundador.
3. **Si una actualización hace fallar una prueba aprobada, se corrige la actualización, no la prueba.**
4. **Recorrido nuevo:** añádelo a `tests/e2e/orden.json`; si no, `tests/documentacion/e2e.test.mjs` falla.
5. **En las pruebas de navegador, busca por texto o por rol** («Reservar entradas»), no por clases de CSS (`a.card`): las clases cambian con el diseño y rompieron cuatro pruebas el 15-10-2026.
6. **Una URL con `#ancla` no recarga la página** (`goto` a la misma dirección solo mueve el ancla): usa `reload()`.

## 3. El flujo Claude + Codex («la flota»)

```text
Fundador pide ─► Claude PLANIFICA (ficha T-xxx) ─► Codex EJECUTA (copia aparte, sin guardar)
                                                          │
                                  PUERTAS automáticas ◄───┘  (tipos, pruebas, catálogo, mapa, aprobado)
                                          │
                       REVISIÓN de solo lectura: Luna (normal) o Astra (crítico)  ─► veredicto JSON
                                          │
              Claude VERIFICA cada hallazgo leyendo el código y DECIDE
                 │                  │                    │
            aprobar            otra ronda            rechazar
        (guardar, versión,    (máximo tres)
         PR, CI en GitHub)
                 │
        Fundador da el «sí» ─► fusión
```

**Reparto de papeles** (adaptado de lo que se vio en el vídeo):

| Papel | Quién | Qué hace |
|---|---|---|
| Arquitecto y decisor | **Claude** (Opus 5.5, o Sonnet 5.5 en tareas ya planificadas) | Escribe la ficha, verifica hallazgos, decide, guarda, sube la versión y abre el PR. |
| Ejecutor | **Codex `gpt-6.1-sol`** | Implementa la ficha en una copia aparte. No guarda, no sube la versión, no usa la red. |
| Revisor normal | **Codex `gpt-6-luna`** | Revisión de solo lectura de cada cambio. |
| Revisor crítico | **Codex `gpt-6-astra`** | Solo si la ficha dice «Riesgo: crítico» (dinero, permisos, datos personales, secretos, envíos). |
| Puerta final | **El CI de GitHub** | Repite todo en limpio. Nada se fusiona en rojo. |
| Decisión última | **El fundador** | Da el «sí» a cada fusión. |

**Qué modelo y qué esfuerzo** en cada paso lo dice la tabla de [`MODELOS-Y-ESFUERZO.md`](MODELOS-Y-ESFUERZO.md): lo sencillo, con Luna o Haiku en esfuerzo bajo; lo normal, con Sol o Sonnet en medio; lo complejo y lo crítico, con esfuerzo alto y revisión de Astra. La ficha lo declara (`Complejidad` y `Riesgo`) y `scripts/flota.mjs` lo aplica.

**Herramientas:**
- `node scripts/flota.mjs todo docs/tareas/T-xxx-….md` hace los pasos mecánicos (copia aparte, Codex, puertas, revisión) y deja el informe en `docs/logs/flota/T-xxx/ronda-N/resumen.md` (local, no se guarda en Git). Otras órdenes: `ejecutar`, `puertas`, `revisar`, `simulacro` (ensaya sin gastar nada).
- La ficha se escribe con [`tareas/PLANTILLA-FLOTA.md`](tareas/PLANTILLA-FLOTA.md).
- En Claude Code, `/flota` guía el proceso. Además está instalado el plugin oficial de OpenAI (`/codex:review`, `/codex:rescue`, `/codex:status`).

**Verlo en pantalla (el «mod», petición del fundador del 16-10-2026):** cada paso que da la flota se apunta en `~/.lona-flota/estado.json` (`scripts/flota-estado.mjs`; solo pasos, modelos y tiempos, nada de código ni datos personales) y se ve en dos sitios:
- **Barra de estado de Claude Code** (`scripts/flota-barra.mjs`, instalada con `node scripts/flota.mjs instalar-barra`): una línea bajo el cuadro de mensajes con el modelo de la sesión, la tarea, la ronda y cada paso — `✓` hecho, `▶` trabajando (con quién y cuánto lleva), `✘` falló, `○` en espera. Ejemplo: `Opus 5.5 │ Flota T-017 ⚠ crítico · ronda 1/3 │ ✓ Planifica · ✓ Ejecuta · ▶ Revisa: Codex gpt-6-astra (high) 1:12 · ○ Decide`.
- **Panel en vivo** (`node scripts/flota-panel.mjs` → <http://localhost:4777>): el diagrama del vídeo con las seis cajas (Claude arquitecto, Codex Sol ejecutor, comprobaciones, Luna revisión, Astra crítica y Claude decide), la que está trabajando se ilumina, con su reloj, el veredicto y sus hallazgos, y el historial. Se refresca cada dos segundos y solo escucha en este equipo.
- Los pasos de Claude (planificar y decidir) los apunta Claude con `node scripts/flota.mjs estado plan|decision activo|hecho [nota]`; los de Codex y las comprobaciones los apunta `scripts/flota.mjs` solo.

**Límites del flujo (a propósito):**
- La flota **nunca guarda, empuja ni fusiona** por sí sola.
- **Un hallazgo del revisor no es una orden:** Claude lo verifica leyendo el código. En su primera revisión real (el #93, 16-10-2026), Astra señaló cinco fallos y los cinco eran ciertos; aun así se comprobó cada uno antes de actuar.
- **Coste:** gasta el cupo de la cuenta de ChatGPT del fundador. Por eso el revisor crítico solo se usa cuando hay dinero, permisos o datos personales.
- El Codex que el fundador abre a mano en su carpeta sigue existiendo para su propia cola de trabajo: sus encargos van en `docs/ecosistema/traspasos/` **dentro de `MiClaude/`** (ahí es donde lee) y Claude revisa sus PR igual.

## 4. Quién protege qué (resumen para el fundador)
Lo que **ya** impide romper lo aprobado: las más de 850 pruebas, los 37 recorridos y la medición de accesibilidad, que se ejecutan en cada PR; desde hoy, además, el registro `APROBADO.md` (no se pueden quitar sus pruebas sin que salte), el aviso si un recorrido queda fuera, y un solo comando para probarlo todo en local.

## 5. Lo que falta
1. **Regresión visual.** Capturas de referencia de las 15–20 pantallas clave (móvil y escritorio) que el fundador aprueba una vez; el CI falla si una pantalla cambia más de un umbral. Se generarán en el propio CI (Linux), porque las tipografías cambian de un sistema a otro y las capturas de Windows darían falsos fallos. Actualizar una referencia exigirá la aprobación del fundador. **Siguiente PR.**
2. **Protección de rama en GitHub** (obligar al CI verde antes de fusionar). Es un ajuste de tu repositorio: requiere tu «sí».
3. **Prueba de teclado completa** de las pantallas principales (hoy solo hay pruebas parciales).
4. **Ampliar `APROBADO.md`** con cada función que el fundador apruebe a partir de ahora (la regla 2 de §2).
