# Qué modelo y qué esfuerzo usar según la tarea (Claude y Codex)

> **Petición del fundador (16-10-2026):** «que tanto tú como Codex sepáis cuándo utilizar cada modelo y esfuerzo según la tarea: qué modelos usar para tareas más sencillas y cuáles para las más complejas.»
> **Principio:** usar **lo más barato que haga bien el trabajo** y subir de nivel solo cuando un error saldría caro (dinero, datos personales, permisos, migraciones) o cuando una tarea sencilla ya ha fallado dos veces. El nivel más alto por defecto gasta créditos y tiempo sin mejorar lo sencillo.
> Esta política **completa** la regla del 14-10-2026 («esfuerzo medio por defecto») y se aplica a todos los asistentes. Si choca con una regla general más antigua, vale esta. El flujo de trabajo en el que encaja está en [`RED-DE-SEGURIDAD.md`](RED-DE-SEGURIDAD.md).

## 1. Los niveles disponibles

| Asistente | Modelos (de menos a más capaz) | Esfuerzo |
|---|---|---|
| **Claude** | Haiku 5.5 · Sonnet 5.5 · Opus 5.5 · Fable 5.1 | bajo · medio · alto · muy alto (`xhigh`) · máximo (`max`) |
| **Codex** | `gpt-6-luna` (económico, revisor habitual) · `gpt-6.1-sol` (ejecutor por defecto) · `gpt-6-astra` (revisor crítico) | `low` · `medium` · `high` · `xhigh` |

Los precios relativos de cada modelo **no están medidos** en Lona; solo hay las medidas de la sección 5.

## 2. Tabla de decisión

| # | Tipo de tarea | Ejemplos en Lona | **Claude** (modelo · esfuerzo) | **Codex en la flota** (ejecutor · esfuerzo) | Revisión |
|---|---|---|---|---|---|
| 1 | **Mecánica o de texto** | CHANGELOG, DIARIO, ESTADO, traspasos, catálogo, un texto de pantalla, resumir resultados de pruebas | Haiku 5.5 · bajo | Luna · bajo | Solo las puertas automáticas |
| 2 | **Pequeña y clara** | Arreglo de una o dos líneas, un selector de prueba, un CSS suelto, subir la versión | Haiku 5.5 (o Sonnet 5.5) · bajo–medio | Luna · bajo | Luna · medio si toca código |
| 3 | **Normal** | Una pantalla, una acción de servidor acotada, pruebas de un flujo, un recorrido nuevo | **Sonnet 5.5 · medio** (por defecto) | **Sol · medio** (por defecto) | Luna · medio |
| 4 | **Compleja** (lógica delicada o varias piezas) | Agenda del entrenador, reglas de reserva, ranking y aura, integraciones, un conflicto de fusión grande | Sonnet 5.5 · alto, u Opus 5.5 · medio | Sol · alto | Luna · medio (Astra si hay riesgo) |
| 5 | **Crítica** (dinero, permisos, datos personales, secretos, envíos masivos, migraciones de datos) | Señal por Bizum, roles y permisos, descarga de datos, claves, migración de la base | **Opus 5.5 · alto** (`xhigh` en una migración con datos reales) | Sol · alto | **Astra · alto**, y Claude verifica cada hallazgo |
| 6 | **Planificar, decidir, arquitectura** | Planificar una fase, elegir entre enfoques, un RFC, el modelo de datos, decidir qué hacer con los hallazgos de un revisor | Opus 5.5 · alto (`xhigh` o Fable 5.1 solo para arquitectura nueva y grande) | — (Codex no decide) | — |
| 7 | **Fallo difícil de reproducir** | Fallo intermitente, carreras entre peticiones, problema en producción | Opus 5.5 · alto; sube a `xhigh` si no lo resuelve en dos intentos | Sol · alto (para reproducir y proponer) | Según el riesgo |
| 8 | **Revisar un PR ajeno** | Un PR de Codex o de Antigravity | Sonnet 5.5 · medio (Opus 5.5 · alto si es crítico) | Luna · medio (Astra · alto si es crítico) | — |
| 9 | **Investigación acotada** | Buscar usos en el código, listar archivos, resumir un documento | Haiku 5.5 · bajo (o un subagente de exploración) | Luna · bajo | — |

**Regla corta:** *planificar y decidir → el modelo más capaz de Claude; escribir lo planificado → Sonnet o Sol en nivel medio; lo mecánico → Haiku o Luna en bajo; lo crítico → revisión independiente de Astra.*

## 3. Cuándo subir, cuándo bajar

**Sube un nivel (nunca más de uno de golpe) si:**
- la tarea toca dinero, permisos, datos personales, secretos, envíos o migraciones;
- el cambio abarca más de cinco archivos o dos capas (por ejemplo, base de datos y pantalla);
- hay peticiones simultáneas que pueden pisarse (reservas, aforos, moderación);
- falló dos veces con el nivel actual (a la tercera no se repite lo mismo: se sube o se replantea).

**Baja si:**
- es mecánica, repetitiva o fácil de deshacer;
- una puerta automática comprueba el resultado (formato, catálogo, pruebas);
- solo se pide un texto o un formato.

**No uses nunca por defecto:** `max`, Fable 5.1 ni Astra. Tampoco repitas la batería completa de pruebas en cada paso (una vez antes de entregar el PR) ni releas documentos largos ya leídos.

**Cuándo no merece la pena llamar a Codex:** arrancar una sesión de Codex cuesta unos 16.000 tokens fijos (sección 5). Un cambio de menos de unas diez líneas lo hace quien esté delante. Codex compensa desde una tarea normal y, sobre todo, como **segunda opinión independiente** en lo crítico.

**Si estás en un nivel superior al que pide la tarea:** dilo en una línea y sugiere al fundador bajarlo.

## 4. Cómo se cambia el nivel

| Dónde | Cómo |
|---|---|
| **Claude Code** (esta sesión) | El fundador con `/model` y `/effort`. Claude no cambia su propio nivel: **sugiere el cambio** en una línea cuando la tarea entra en otra fila de la tabla. |
| **Subagentes de Claude** | Claude elige el modelo de cada subagente (`haiku`, `sonnet`, `opus`, `fable`) según la tabla; la investigación acotada va a `haiku`. |
| **Codex abierto por el fundador** | Selector de modelo y esfuerzo de Codex. Por defecto, `gpt-6.1-sol` con esfuerzo medio (ya configurado en `~/.codex/config.toml`). Para lo sencillo, `gpt-6-luna` o esfuerzo bajo. |
| **Codex lanzado por Claude (la flota)** | La ficha de la tarea lo dice: `- Complejidad: simple\|normal\|compleja` y `- Riesgo: normal\|crítico` (ver `tareas/PLANTILLA-FLOTA.md`). `scripts/flota.mjs` lo traduce: **simple → Luna·low · normal → Sol·medium · compleja → Sol·high · revisión normal → Luna·medium · revisión crítica → Astra·high**. Se puede forzar con `--complejidad`, `--esfuerzo` y `--esfuerzo-revision`. |

**Si subes de nivel, apúntalo** en una línea del PR o del traspaso («revisión con Astra por tocar la señal de Bizum»). Así se ve por qué se gastó más.

## 5. Medidas reales (16-10-2026)

| Qué | Modelo y esfuerzo | Resultado |
|---|---|---|
| Llamada mínima («responde ok») | Luna · low | ≈ 16.000 tokens y unos 5 segundos: **es el coste fijo de arrancar Codex**. Con esfuerzo bajo o medio cuesta lo mismo. |
| Cinco correcciones de reservas (aforo, plazos, hora de Madrid) con 34 pruebas nuevas | Sol · medium | ≈ 91.000 tokens; 887 pruebas unitarias en verde al final. |
| Revisión crítica del PR #93 (dinero, permisos, datos personales) | Astra · high | ≈ 73.500 tokens; encontró cinco fallos reales, comprobados uno a uno por Claude. |
| Revisión normal de esos cinco arreglos | Luna · medium | Aprobó sin hallazgos. |

Estas cifras son del uso real de un día y sirven como orden de magnitud. Si cambian los planes o los modelos, se vuelven a medir y se actualiza esta tabla.

## 6. Quién decide qué
- **El fundador** elige el nivel de la sesión de Claude Code y de la sesión de Codex que abre a mano, y aprueba cualquier gasto extraordinario (`max`, Fable, revisiones críticas fuera de lo crítico).
- **Claude** clasifica cada tarea en la tabla, escribe la ficha de la flota con su complejidad y riesgo, y avisa al fundador cuando conviene cambiar el nivel.
- **Codex y Antigravity** usan el nivel que diga la ficha o el encargo; si ven que la tarea es de otra fila, lo dicen antes de empezar.
