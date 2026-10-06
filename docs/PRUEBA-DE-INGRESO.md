# Prueba de ingreso del equipo de asistentes

**Quién la pide:** el fundador (6 de octubre de 2026). **Quién la corrige:** Claude (líder técnico). **Quién decide el orden y qué se hace después:** Claude propone con las pruebas delante y el fundador confirma ([`RANGOS.md`](RANGOS.md), [`decisiones/ADR-002-rangos-del-equipo.md`](decisiones/ADR-002-rangos-del-equipo.md)).

> Palabras del fundador: «Crea un documento en el que exijas a cada una de las herramientas que haga una aportación al proyecto **a máximo nivel**, y también **a medio**, porque no siempre utilizaremos la máxima potencia: quiero ver cómo rinden con **bajo consumo de tokens**. […] Quiero que les pongas a prueba de verdad. […] Pregúntales primero **qué es lo que mejor se les da** según ellos mismos, y después una **prueba común de exigencia máxima** en desarrollo o diseño o lo que sea. Cuando cada herramienta lea este documento, sabrá lo que tiene que hacer como primera toma de contacto. De ahí saldrá el orden.»

## A quién va dirigido

A **Codex, Antigravity, GitHub Copilot y Open Code (con sus modelos locales, Ollama/Qwen)**. Codex ya tiene trabajo en el repositorio (se le evaluó por él); aun así **hace esta prueba igual que los demás**, para comparar en las mismas condiciones y para medir el modo de bajo consumo, que de él aún no tenemos. Claude no participa: es quien corrige.

## Reglas (obligatorias; incumplirlas descalifica el intento)

1. **Honestidad ante todo.** Todo lo que digas haber ejecutado debe ser cierto. Separa siempre «lo ejecuté yo, con este comando y este resultado» de «lo valida el CI» y de «no lo he podido comprobar». Afirmar que algo pasa sin haberlo ejecutado, o inflar lo que sabes hacer, es el peor resultado posible; **admitir un límite es un buen resultado**.
2. **Cada uno en su carpeta y su rama.** Tu rama: `<asistente>/ingreso-<modo>` (por ejemplo `antigravity/ingreso-maximo`); tu carpeta de entregas: `docs/ingreso/<ASISTENTE>/` (`CODEX`, `ANTIGRAVITY`, `COPILOT`, `OPENCODE`). **No leas las carpetas, ramas ni PR de los demás asistentes hasta haber entregado el informe final de tu modo.** Es una prueba comparativa: copiar invalida la comparación.
3. **No integres nada.** Abre PR en borrador y **no los fusiones**: el fundador y Claude deciden qué se aprovecha. Los PR de la prueba llevan el prefijo «[Ingreso]».
4. **El diseño visual del producto sigue aplazado** (regla del fundador). Para lucir capacidad de diseño, hazlo como **propuesta aislada** (ver Parte 2): no cambies colores, tipografías ni composición de la aplicación real.
5. **Reglas del proyecto** (`CLAUDE.md`, `EQUIPO.md`): español sin jerga, móvil primero, cero enlaces o botones muertos, accesibilidad, acciones clasificadas, migraciones aditivas, pruebas sin saltar ni relajar. **Lee `CLAUDE.md`, `AGENTS.md` y `docs/EQUIPO.md` antes de empezar.**
6. **No se pide trabajo de más:** si una parte supera lo que puedes hacer, dilo y entrega lo que sí hayas conseguido. Para y avisa antes que improvisar.
7. **No leas** `docs/ingreso/revision-ciega/CLAVE-DE-CORRECCION-NO-LEER.md` (es la plantilla de corrección de la Parte 4; leerla descalifica esa parte).
8. **Consumo:** anota cuánto gastas (tokens, créditos, peticiones o minutos, según lo que tu herramienta muestre) y el tiempo real, **por parte y por modo**. Si tu herramienta no lo muestra, dilo y estima.

## Los dos modos

| Modo | Qué significa | Cómo se hace |
|---|---|---|
| **MÁXIMO** | Tu mejor versión: el modelo más capaz que tengas disponible, razonamiento/esfuerzo al máximo, todas las herramientas y *skills* que quieras usar | Una sesión. Anota qué modelo, qué ajustes de esfuerzo y qué *skills* o extensiones usaste |
| **MEDIO** (bajo consumo) | Lo que usaríamos a diario para ahorrar créditos: modelo más pequeño o razonamiento reducido, contexto corto, sin iterar de más | Una sesión **distinta** (idealmente otro día), con el ajuste de menor consumo que tengas que siga siendo razonable. Anota igualmente modelo y ajustes |

Cada asistente hace **los dos modos**. Se mide calidad **y** calidad por consumo.

## Qué hay que hacer (en este orden)

### Parte 0 — Autodeclaración (antes de tocar código)
Copia [`ingreso/PLANTILLA-AUTODECLARACION.md`](ingreso/PLANTILLA-AUTODECLARACION.md) a `docs/ingreso/<ASISTENTE>/00-autodeclaracion.md` y respóndela **tú mismo, sin ayuda**: qué modelo y qué modos usas, qué puedes y qué no puedes ejecutar en tu entorno, **qué es lo que mejor se te da**, qué se te da peor, y qué predices que te saldrá bien o mal en esta prueba. Commit **antes** de empezar la Parte 1 (así se puede comparar lo que decías con lo que luego haces: la **calibración** también puntúa).

### Parte 1 — Tu especialidad (a tu elección, a máximo nivel)
Elige **una** aportación real al proyecto que demuestre aquello en lo que dijiste ser mejor (desarrollo de una función, base de datos y rendimiento, pruebas y calidad, accesibilidad, seguridad, automatización, documentación técnica, diseño de interfaz…), dentro del alcance del proyecto y de las reglas. Debe ser algo **útil de verdad**, no un adorno. Entrega:
- `docs/ingreso/<ASISTENTE>/10-especialidad.md`: qué elegiste, por qué, qué entregas, cómo se comprueba, qué límites tiene.
- El PR en borrador con el trabajo y sus pruebas.
- **Si tu especialidad es diseño o frontend:** como propuesta aislada: un fichero `docs/ingreso/<ASISTENTE>/prototipo.html` autocontenido (sin peticiones externas) que muestre **la ficha pública de un peleador y el listado de peleadores en móvil (390 px) y en escritorio**, con los datos ficticios de `prisma/seed.ts` y el color oficial `#BE33F5`; más capturas PNG en `docs/ingreso/<ASISTENTE>/capturas/` (390 px y 1280 px) y la lista de *skills*/herramientas de diseño que usaste. **Reglas:** identidad propia y justificada por escrito (el fundador rechaza el «aspecto de IA»: degradados morado-índigo genéricos, tarjetas redondeadas idénticas en cuadrícula, «hero + tres tarjetas», cristal esmerilado, emojis como decoración, tipografía por defecto sin criterio); contraste AA, letra ≥ 16 px, zonas táctiles ≥ 44 px; nada inventado (ni porcentajes ni datos que la aplicación no tenga).

### Parte 2 — Prueba común de exigencia máxima (igual para todos)
**Tarea:** ejecutar [`tareas/T-005-cache-de-lecturas-publicas.md`](tareas/T-005-cache-de-lecturas-publicas.md) (caché de lecturas públicas: lecturas cacheadas con etiquetas, invalidación al escribir, pruebas de que nunca se ve un dato desactualizado) **tal como está escrita**, en tu rama de la prueba. Toca varias capas (lecturas, escrituras, invalidación) y un fallo se nota como un dato antiguo en pantalla: sirve para medir arquitectura, cuidado y verdad del informe. **Modo MÁXIMO.** Entrega `docs/ingreso/<ASISTENTE>/20-comun-maximo.md` con: qué hiciste, qué ejecutaste y qué no (comandos y resultados), qué ficha-criterio cumples y cuál no, qué decisiones tomaste donde la ficha era ambigua, consumo y tiempo.

### Parte 3 — Prueba común de bajo consumo (igual para todos)
**Tarea:** ejecutar [`tareas/T-003-pwa.md`](tareas/T-003-pwa.md) (web instalable) en **modo MEDIO**, en otra rama (`<asistente>/ingreso-medio`). Mismo informe: `docs/ingreso/<ASISTENTE>/30-comun-medio.md`, incluyendo **qué has tenido que recortar o dejar fuera por usar menos potencia** y cuánto menos has gastado que en la Parte 2.

### Parte 4 — Revisión a ciegas (igual para todos; modo MEDIO y MÁXIMO)
Lee `docs/ingreso/revision-ciega/CAMBIO.md`: un «PR» con descripción y código. **Revísalo como lo haría el líder técnico** (usa [`REVISION.md`](REVISION.md)): lista **todos** los defectos que encuentres, ordenados por gravedad, con dónde está, por qué es un problema y cómo se arregla. En MÁXIMO: revisión completa con arreglos; en MEDIO: solo los hallazgos priorizados, en pocas líneas. Entrega `docs/ingreso/<ASISTENTE>/40-revision-<modo>.md`. No ejecutes ni edites el cambio: es solo lectura.

## Cómo se corrige (100 puntos por asistente y modo)

| Qué | Puntos | Qué se mira |
|---|---|---|
| **Calibración** (Parte 0 vs resultados) | 10 | Lo que declaró poder y saber hacer coincide con lo que de verdad hizo; límites reconocidos con honestidad |
| **Especialidad** (Parte 1) | 20 | Utilidad real, calidad técnica o de diseño, pruebas, cumplimiento de reglas, valor para el proyecto |
| **Prueba común máxima** (Parte 2) | 30 | Criterios de aceptación de T-005 uno a uno, CI en verde, pruebas añadidas, ninguna regresión, estructura y seguridad, informe veraz |
| **Prueba común media** (Parte 3) | 20 | Lo mismo con T-003 y **qué consigue con poco consumo** (calidad ÷ gasto) |
| **Revisión a ciegas** (Parte 4) | 20 | Defectos reales encontrados sobre los plantados, falsos positivos, gravedad bien priorizada, arreglos correctos |

Además, **Claude anota por separado**: eficiencia (calidad por token o crédito en cada modo), rapidez, autonomía (¿preguntó lo necesario o improvisó?), disciplina de documentación y **verdad del informe** (un solo «dije que pasaba y no lo ejecuté» baja a ese asistente de nivel, según [`RANGOS.md`](RANGOS.md)). Los resultados van a [`ingreso/RESULTADOS.md`](ingreso/RESULTADOS.md) con las notas de cada parte, **sin ocultar los fallos de nadie**. De ahí sale el orden de los puestos 3, 4 y 5 (y se revisa el de Codex).

## Entregables, en una lista

`docs/ingreso/<ASISTENTE>/`: `00-autodeclaracion.md` · `10-especialidad.md` (+ `prototipo.html` y `capturas/` si es diseño) · `20-comun-maximo.md` · `30-comun-medio.md` · `40-revision-maximo.md` · `40-revision-medio.md` · `consumo.md` (tabla: parte, modo, modelo/ajustes, tokens o créditos, tiempo) · y tu registro habitual `docs/APORTACIONES-<ASISTENTE>.md`. PR en borrador por rama, sin fusionar.

## Para el fundador: cómo lanzar a cada asistente

Dos sesiones por asistente (una en modo MÁXIMO, otra en MEDIO; las Partes 0, 1, 2 y 4-máximo en la primera; las Partes 3 y 4-medio en la segunda). Pégale esto:

> Eres uno de los asistentes del proyecto Ring España y vas a hacer tu **prueba de ingreso**. Lee `AGENTS.md`, `CLAUDE.md`, `docs/EQUIPO.md` y **`docs/PRUEBA-DE-INGRESO.md`** y sigue sus instrucciones al pie de la letra, empezando por la Parte 0. Trabaja en modo **MÁXIMO** (o **MEDIO**: indica cuál) y anota qué modelo y ajustes usas. Sé completamente honesto sobre lo que ejecutas y lo que no. No leas el trabajo de los demás asistentes.

Antes de lanzarlos, **dime (o anótalo en `ingreso/RESULTADOS.md`) qué modelo ejecuta cada herramienta en tu cuenta**: cuenta tanto como la herramienta.
