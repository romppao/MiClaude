# Diario de desarrollo — Ring España

Cuaderno de bitácora del proyecto: qué hicimos, en qué orden, por qué, cómo surgieron las ideas y qué salió mal.
Pensado para poder contar algún día todo el recorrido, y para retomar cualquier punto sin perder el contexto.

**Cómo se mantiene:** al final de cada sesión de trabajo se añade una entrada nueva **al final** de este fichero (nunca se reescriben las anteriores; si algo cambia de opinión, se anota como una entrada nueva). Cada entrada sigue la plantilla del final.
Documentos hermanos: [`IDEAS.md`](IDEAS.md) (ideas y backlog), [`LECCIONES.md`](LECCIONES.md) (errores y cómo retomar), [`ARQUITECTURA.md`](ARQUITECTURA.md) (estado técnico vigente).

---

## Sesión 1 — 30 de septiembre de 2026 — De la idea al primer prototipo funcional

### 1. El punto de partida: la visión

El fundador plantea un proyecto «muy ambicioso»: una aplicación para **hacer crecer la comunidad boxística española**.
Lo esencial de lo que pidió, en sus palabras aproximadas:

- Dar a conocer a pugilistas, **sobre todo amateur** (también profesionales).
- Que puedan **registrar sus récords** de victorias y derrotas, darse a conocer y **generar audiencia** para los boxeadores españoles.
- Un **calendario de veladas** próximas, profesionales y amateur.
- **Buscar** boxeadores, gimnasios, entrenadores, etc.
- Referencia: algo **similar a BoxRec**, pero para España.

Repositorio de partida: vacío (`romppao/MiClaude`, sin ningún commit).

### 2. Decisiones iniciales (preguntas al fundador)

Antes de escribir código se preguntaron tres cosas y se decidió:

| Pregunta | Decisión | Por qué |
|---|---|---|
| Plataforma | **Web responsive** | Funciona en móvil y ordenador, se indexa en Google (clave para darse a conocer) y luego se puede envolver como app |
| Stack | **Next.js + PostgreSQL** (+ Prisma, TypeScript) | Un solo lenguaje de extremo a extremo, buen SEO, búsqueda potente, fácil de desplegar |
| Alcance inicial | **Plan + MVP funcional** | Ver algo real cuanto antes |

### 3. Primer MVP (estilo BoxRec)

Se construyó: fichas de boxeadores con **récord calculado** desde los combates (por nivel profesional/amateur), calendario de veladas con filtros, gimnasios, entrenadores y búsqueda global. Datos de ejemplo **ficticios** (con «Demo» en el nombre) para no inventar récords de personas reales.
Decisión de diseño que se mantiene hasta hoy: **el récord no se guarda, se calcula** a partir de los combates, para que no pueda desincronizarse.

### 4. Giro de enfoque: amateur, Madrid y valoración del público

Tras ver el MVP, el fundador **reorientó el producto**. Esta es la idea que define el proyecto:

> El foco es fomentar la afición al boxeo en España, principalmente en el **amateur**, porque son quienes en el futuro serán profesionales y «la cara del boxeo español en el mundo». Un amateur debe poder registrar su récord **y recibir una valoración del público aficionado** («este chaval es muy bueno, lo vi y aluciné»).

Además:
- **Foco geográfico: Madrid** (no exclusivo, pero principal) y expandir después. Hay competencia (una aplicación que «ha dado mucho que hablar en Barcelona»); la intención es estructurarlo bien en Madrid y adelantarse.
- **Nada de diseño gráfico todavía** (los diseños de Claude «normalmente no le gustan»): prioridad absoluta a **arquitectura y estructura**.

Consecuencias técnicas que se implementaron:
- **Cuentas** propias (contraseñas con scrypt, sesión en cookie) y roles: aficionado, boxeador, organizador, administrador.
- **Ficha propia**: el boxeador amateur crea su ficha y **registra sus combates**.
- **Fiabilidad del dato**: como el amateur se registra a sí mismo, cada combate tiene un nivel de respaldo (`autodeclarado → confirmado por el rival → verificado`, o `disputado`).
- **Valoraciones ancladas a un combate concreto**: una nota es «esta actuación en este combate», no «este boxeador en general». Una por usuario y combate, los participantes no pueden votar, solo combates ya celebrados. Base de la defensa contra la manipulación.
- **Ránking por provincia** (Madrid por defecto) con **media bayesiana**, para que un solo 5 no supere a 40 notas de 4,8.
- Portada centrada en el amateur de Madrid; la provincia es un parámetro, no una limitación.

### 5. Segunda ronda: confianza y organizadores

Se aceptó la propuesta de avanzar en los riesgos detectados:
- **Verificación de email** obligatoria para publicar (token de un solo uso; el enlace del correo solo muestra un botón y la verificación se hace por POST para que los escáneres de enlaces no la consuman).
- **Reclamar una ficha existente** (cuando alguien ya registró un combate tuyo): la solicita el boxeador y la aprueba un moderador.
- **Rol organizador** con solicitud aprobada por un moderador: crea veladas, monta el cartel y pone resultados, que nacen verificados.
- Límite de 20 valoraciones al día por usuario.

**Regla de producto fijada por el fundador:** ver contenido (veladas, fichas, ránking) es **público**; votar, registrar récords y demás funciones principales **exigen estar registrado**. Se auditaron todas las acciones del servidor y ya se cumplía (el control está en el servidor, no solo en ocultar botones).

### 6. Calidad: tests y CI

Tests unitarios (récord, media bayesiana, slugs, contraseñas: 17), una **prueba de extremo a extremo en navegador real** del flujo completo (registro → verificación → reclamar ficha → confirmar combate → valorar → organizador con cartel) y un **workflow de GitHub Actions** con PostgreSQL.
Estado al cierre de esta entrada: en local todo pasa; **la primera ejecución del CI en GitHub estaba en curso** (pendiente de confirmar; anotar el resultado en la siguiente entrada).

### 7. Estrategia de veracidad de datos

El fundador planteó que habrá que **ir afilando** la comprobación de que los datos de cada boxeador, gimnasio y promotora sean veraces, **sin depender de trámites burocráticos con las federaciones** al inicio (aunque el objetivo a medio plazo es colaborar con la Federación Madrileña, la Española y otras, y de momento «no nos conoce nadie»).
Resultado: una estrategia por capas documentada en [`ARQUITECTURA.md`](ARQUITECTURA.md) — niveles de respaldo, verificar también a quien verifica, comprobaciones automáticas de coherencia, historial de cambios, moderadores locales de confianza en Madrid y vía de entrada a las federaciones ofreciéndoles calendario y resultados limpios.

### 8. Cierre de la sesión y estado

- Rama: `claude/ring-espana-mvp` (sin pull request abierta).
- Commits, en orden: `a823a77` MVP inicial · `5003eff` enfoque amateur/Madrid · `20016c1` verificación, reclamar ficha, organizadores · `f89a9c3` tests y CI · `2028bf9` CI en cualquier push · `6a7769c` estrategia de verificación.
- Solicitud del fundador: **documentar todo el proceso** (este diario, `IDEAS.md`, `LECCIONES.md`).
- **Lo siguiente acordado/propuesto:** (1) enlace de evidencia en cada combate + historial de cambios, (2) sello de verificado para gimnasios y organizadores; después, seguir a boxeadores con avisos de veladas.
- **Abierto:** resultado del CI; proveedor de correo real; migraciones de base de datos; decidir qué prueba de identidad se pide al reclamar ficha.

---

## Sesión 1 (continuación) — 30 de septiembre de 2026 — Documentación, evidencia, historial y sello de verificado

### Qué se pidió / qué idea surgió

Tras la estrategia de veracidad, el fundador pidió **documentar cada paso** del desarrollo («cómo van surgiendo las ideas… para en algún futuro mostrar todo el proceso… ver por dónde hemos fallado, cómo retomar lo anterior»). Se crearon `DIARIO.md`, `IDEAS.md`, `LECCIONES.md` y `CLAUDE.md` (que obliga a mantenerlos al cerrar cada bloque de trabajo).
Después aprobó empezar por los puntos 1 y 2 del orden propuesto: **evidencia en los combates + historial de cambios** y **sello de verificado**.

### Confirmación pendiente de la entrada anterior

Las tres primeras ejecuciones del CI en GitHub (runs 1, 2 y 3) terminaron **con éxito**. El CI funciona con PostgreSQL real y ejecuta tipos, tests, build y la prueba de navegador.

### Qué se decidió y por qué

- **Evidencia = un enlace** (acta, cartel, publicación, vídeo) y no subida de ficheros: es lo más barato, no toca datos sensibles ni menores y ya permite la corroboración de nivel 3. Solo se aceptan `http(s)`; `javascript:` y similares se descartan.
- **Historial de cambios en base de datos** (`AuditLog`: quién, cuándo, antes → después). Por ahora lo ve solo el moderador; hacerlo público por combate queda como idea.
- **El sello de verificado siempre lleva una nota con la evidencia comprobada** (web, redes, llamada…). Sin nota no se concede. La nota es **interna**: el público solo ve el sello.
- **Sello del organizador = solicitud aprobada**, con nota del moderador guardada; en la velada aparece «✓ organizador verificado».
- **Avales cruzados entre entidades: aplazados.** Requieren cuentas de responsable de gimnasio, que aún no existen; se anota en ideas en vez de construir algo a medias.

### Qué se hizo

- Campo `Bout.evidenceUrl`, formularios para registrarla al crear el combate y para editarla después (boxeador, rival, organizador o admin), y enlace «evidencia ↗» en la ficha pública con `rel="noopener noreferrer nofollow ugc"`.
- Tabla `AuditLog` y registro en: creación de combates, respuesta del rival, decisiones de moderación, resultados, evidencia, reclamaciones, organizadores, eventos y sellos. Página `/admin/historial` con filtros.
- Sello de verificado en gimnasios (`verifiedAt`, `verifiedNote`) con gestión en `/admin`, insignia en listado y ficha; nota de revisión al aprobar organizadores.
- Tests: 3 unitarios nuevos (20 en total) y 7 comprobaciones nuevas en la prueba de navegador (15 en total).

### Qué salió mal / qué se aprendió

- **El historial casi mentía.** Al escribir el registro de reclamaciones anoté «aprobada» aunque la aprobación podía acabar rechazada (ficha ya con dueño o usuario con otra ficha). Lo vi al releer, antes de probar, y ahora se registra el resultado real y también lo que se pidió. Regla: un registro de auditoría debe reflejar lo que ocurrió, no lo que se intentó.
- **Sustituciones de texto verificadas.** Tras el incidente anterior con un reemplazo que no se aplicó, esta vez cada cambio de esquema y de UI se hizo con comprobaciones que fallan si el patrón no existe. Funcionó a la primera.

### Estado y próximos pasos

- Hecho: puntos 1 y 2 del orden de verificación (evidencia, historial y sellos de gimnasio y organizador).
- Siguiente: comprobaciones automáticas de coherencia (mismo día, duplicados, edades), botón «reportar dato» y puntuación de fiabilidad; después detección de colusión. Candidato de producto: seguir a boxeadores con avisos de veladas.
- Abierto: cuentas de responsable de gimnasio (para avales), proveedor de correo real, migraciones de BD, qué prueba de identidad pedir al reclamar ficha, y si el historial por combate debe ser público.

---

## Sesión 1 (continuación) — 30 de septiembre de 2026 — Principio fundacional de usabilidad

### Qué se pidió / qué idea surgió

El fundador pidió guardar «en lo más profundo» un principio para esta y cualquier aplicación futura: que sea **muy, pero que muy intuitiva para todo tipo de usuario** — niños, gente joven, adultos y personas de edad avanzada — sin importar su nivel tecnológico, con **botones coloridos e intuitivos, enlaces e información fáciles de encontrar**, y **manteniendo siempre la profesionalidad** («que nos vea como gente seria»; nada vulgar ni coloquial). Lo calificó de «súper importante».

### Qué se decidió y por qué

- Se elevó a **principio fundacional F9** y se convirtió en una **lista de comprobación de 11 puntos** en `CLAUDE.md`, para que rija todo el trabajo futuro y no dependa de la memoria de una conversación.
- Se distingue la **usabilidad** (lenguaje, flujos, mensajes, accesibilidad: se aplica ya) del **diseño visual** (estilo e identidad: aplazado por petición previa del fundador). Antes de cambiar el aspecto visual de forma notable se le consulta.
- También se guardó a nivel de usuario (`~/.claude/CLAUDE.md`) para que valga en otras aplicaciones, teniendo en cuenta que ese fichero vive en este entorno de trabajo, no en el repositorio.

### Qué se hizo

Solo documentación: principio y lista en `CLAUDE.md`, idea F9 y dos preguntas abiertas en `IDEAS.md`, y esta entrada. No se ha cambiado todavía ninguna pantalla.

### Qué salió mal / qué se aprendió

Reconocimiento honesto del estado actual: **lo construido hasta ahora no cumple el principio.** Hay términos técnicos visibles («disputar», «sin confirmar»), varios formularios con solo texto de ejemplo y sin etiqueta, acciones que redirigen sin ningún mensaje de confirmación y una interfaz sin cuidado de contraste ni tamaños. Era esperable (se priorizó la arquitectura) pero hay que corregirlo antes de que lo use gente real.

### Estado y próximos pasos

- Propuesto: una **auditoría de usabilidad** de lo ya construido frente a la lista de 11 puntos, con los cambios ordenados por impacto (mensajes de confirmación y de error, etiquetas, lenguaje llano, accesibilidad), sin tocar el estilo visual sin consultar.
- Sigue pendiente lo anterior: comprobaciones de coherencia, «reportar dato», seguimiento de boxeadores.

---

## Sesión 1 (continuación) — 30 de septiembre de 2026 — Ejecución por prioridades: flujos claros, coherencia, avisos de error, ayuda y seguir boxeadores

### Qué se pidió / qué idea surgió

El fundador dio autonomía: «tú vete actuando… con un orden de prioridades de mayor a menor. Primero las funcionalidades importantes, después otras cosas de menor importancia en el funcionamiento básico».

### Cómo se priorizó y por qué

Criterio: primero lo que afecta al funcionamiento básico (registrar récords, votar, consultar veladas) y a que los datos sean creíbles; después lo complementario. Orden ejecutado:

1. **Flujos principales en lenguaje claro** (principio F9): antes de esto, varias acciones fallaban en silencio (p. ej. valorar un combate no permitido no decía nada).
2. **Volver a donde estabas tras entrar** (se pierde al usuario justo al valorar, que es la función estrella).
3. **Comprobaciones automáticas de coherencia** de los combates.
4. **«Reportar un error»** sobre combates y fichas.
5. **Página «¿Cómo funciona?»**.
6. **Seguir a boxeadores** con «Mis boxeadores» y aviso por correo.

Cada bloque se hizo con pruebas y se subió por separado.

### Qué se decidió y por qué

- **Avisos como códigos en la URL** (`?aviso=` / `?problema=`) traducidos en un solo fichero (`lib/messages.ts`): el texto vive en un único sitio, es revisable de un vistazo y mantiene un tono claro y profesional.
- **Duplicados se bloquean; lo sospechoso se marca, no se rechaza.** Un combate el mismo día o a menos de 7 días de otro se guarda con una señal para el moderador, porque puede haber explicaciones legítimas.
- **Avisos de error:** un aviso abierto por usuario y elemento y máximo 10 al día, para que el mecanismo no sea un arma de acoso.
- **Avisos por correo a seguidores solo de combates publicados por organizadores**, nunca de los autodeclarados: si no, cualquiera podría inventarse combates para llenar de correos a los seguidores de otra persona.
- **Navegación principal reducida a 5 elementos**; el resto (organizadores, registro) pasa al pie y a la zona de cuenta, siguiendo la regla del principio F9.

### Qué se hizo

- Avisos de éxito/problema en todas las acciones; etiquetas visibles en registro, entrada, ficha y registro de combates; lenguaje llano («pendiente de confirmar», «en revisión», «Sí, es correcto» / «No es correcto»); foco visible, enlace «Saltar al contenido» y tamaños mínimos de 44 px.
- Regreso a la página de origen tras iniciar sesión (con validación de rutas internas).
- `Bout.flags`, bloqueo de duplicados y señales en la cola de moderación (`lib/coherence.ts`).
- Modelo `Report`, formulario «¿Hay un error? Avísanos», sección de avisos en `/admin`.
- `/ayuda` con pasos por perfil y glosario de etiquetas; pie de página.
- Modelo `Follow`, botón «Seguir a este boxeador» con contador, `/siguiendo` y avisos por correo (`lib/notify.ts`).
- Tests: 25 unitarios y 30 comprobaciones de navegador (antes 20 y 15). *(Corrección: una primera versión de esta entrada decía 28; el recuento real es 30.)*
- Commits: `1faa28d`, `1f74af7`, `46d3684` y el de esta entrada.

### Qué salió mal / qué se aprendió

- **Un test fallaba por mi selector, no por la app:** Next.js añade su propio elemento `role="alert"`, así que contar «todas las alertas» daba 2. Solución: acotar al texto del mensaje.
- **`networkidle` no es fiable para esperar a una acción:** el test del sello del gimnasio miraba la página antes de que terminara la acción. Solución: esperar a un estado concreto de la interfaz («Retirar sello»). Regla: esperar a lo visible, no al tráfico de red.
- **Cambiar textos rompe pruebas que buscan textos:** al pasar a un lenguaje más claro (`Crear ficha` → `Crear mi ficha`) hubo que actualizar el e2e. Regla: cuando cambie un texto, buscar dónde lo usan las pruebas.
- **El CI de GitHub falló dos veces y lo descubrí tarde.** Los runs 4 y 5 (commits `2214758` y `bc39c51`) fallaron en «gimnasio muestra el sello de verificado»: la misma carrera de sincronización que ya había detectado y corregido en local (`1faa28d`), pero yo aún no había mirado el CI de esos envíos. Los runs 6, 7 y 8 pasan. Lección: **comprobar el resultado del CI tras cada envío**, no dar por hecho que pasa porque en local pasa.
- **Honestidad sobre el alcance de F9:** se aplicó a los flujos principales (registro, entrada, ficha, combates, valoración, seguir, ayuda). **No se ha auditado todavía** el panel del organizador ni el de moderación, ni se ha medido el contraste con una herramienta, ni se ha probado con personas reales. No debe darse F9 por cumplido.

### Estado y próximos pasos

- Hecho: los 6 puntos.
- **Limitaciones abiertas:** los correos siguen saliendo al log (falta proveedor real); antes de enviar correos de verdad hace falta que el usuario pueda **elegir no recibir avisos** (RGPD); la comprobación de edades no se hizo (casi nadie rellena la fecha de nacimiento); «mismo día/menos de 7 días» solo mira combates ya registrados.
- **Siguiente por prioridad:** (a) preparar el despliegue real: proveedor de correo, migraciones de base de datos, variables de entorno y preferencias de aviso; (b) auditoría de usabilidad del resto de pantallas (organizador, moderación, listados) y medición de contraste/accesibilidad automática; (c) decidir «tú» o «usted»; (d) pruebas con usuarios reales.

---

## Sesión 1 (continuación) — 30 de septiembre de 2026 — Nuevas directrices: diseño al final, aura, varias disciplinas y récord de partida

### Qué se pidió / qué idea surgió

El fundador aportó cuatro directrices importantes:

1. **Diseño visual al final (recordatorio).** «No me gustan nada los diseños que ofrece Claude… siempre hace los mismos diseños, siempre utiliza los mismos colores… esto lo vamos a trabajar muy bien para que no pueda ocurrir y no se asocie directamente el desarrollo de esa aplicación con una inteligencia artificial como Claude.» Pidió dejarlo **muy marcado y documentado** y pasar al diseño «cuando hayamos terminado todo el proceso de creación de la aplicación».
2. **Aura en lugar de estrellas.** Quiere llevar la valoración «a un ambiente más actual, más juvenil, más de redes sociales»: valorar con **«aura»**. Quién tiene más o menos aura se define **por el número de clics** en el botón de aura del peleador; cuantos más clics, **mejor rankeado dentro de su categoría y su división**.
3. **Ampliar a otros deportes de contacto:** MMA, kickboxing, K-1, jiu-jitsu… «Queremos ser los pioneros. Que todas esas disciplinas se sientan parte de un mismo ecosistema dentro de la comunidad española de deportes de contacto, en la que obviamente el boxeo tiene que estar en cabeza.»
4. **Récord de partida.** Muchos peleadores no recuerdan su récord. Primero indicarán **cuántos combates llevan**; si no recuerdan el récord, solo ese número. **Desde ese punto de partida** registran los nuevos. Reconoce que no se puede comprobar: «es lo que hay».

### Qué se decidió y por qué

- **Diseño:** principio F10 documentado en `CLAUDE.md` (y a nivel de usuario) con un procedimiento para cuando llegue el momento: briefing con referencias del fundador, varias direcciones distintas, lista de tics de «diseño de IA» que evitar, recomendación de un diseñador humano para la marca y registro de decisiones en `docs/DISENO.md`. **La interfaz actual es provisional y no se pule.**
- **Aura, récord de partida y varias disciplinas se registran como decisiones de producto** (ideas F11 y las tres filas nuevas de `IDEAS.md`), pero **no se implementan todavía**: hay dos decisiones que condicionan el modelo de datos y el fundador pidió que se le pregunte si no queda claro.
- **Riesgo señalado con el aura por clics:** si los clics son ilimitados, un solo usuario (o varias cuentas falsas) puede inflar a un peleador sin límite, y el ránking pierde credibilidad, que es justo lo que se ha estado protegiendo. Se propone conservar la regla que ya existe (una valoración por persona y combate, sin participantes) y aplicarla al aura, o como mínimo un tope diario.
- **Récord de partida:** se mostrará **separado** de lo registrado en la app y con su etiqueta de «declarado por el propio deportista», nunca mezclado sin distinguir, para no perder la honestidad del sistema de niveles de respaldo.

### Qué se hizo

Solo documentación: principio de diseño en `CLAUDE.md` y `~/.claude/CLAUDE.md`, ideas F10 y F11, tres ideas de producto nuevas y preguntas abiertas en `IDEAS.md`, y esta entrada. **No se ha tocado el código.**

### Qué salió mal / qué se aprendió

Nada roto. Observación: los tres cambios de producto (aura, disciplinas, récord de partida) **tocan el modelo de datos de arriba abajo** (el récord pasa a ser por disciplina, la valoración cambia de estrellas a aura, «boxeador» pasa a «peleador»). Cuanto antes se hagan, más barato es: hoy solo hay datos de demostración.

### Estado y próximos pasos

- Pendiente de respuesta del fundador: tope de clics del aura, una ficha por persona o por deporte.
- Después: (1) disciplinas + rebautizar «boxeador» a «peleador» en el modelo y la interfaz, (2) récord de partida, (3) aura y ránking por categoría y disciplina, (4) adaptar tests y documentación.

---

## Sesión 1 (continuación) — 30 de septiembre de 2026 — Implementación: peleadores, varias disciplinas, récord de partida y aura

### Qué se pidió / qué idea surgió

Ejecución de las directrices de la entrada anterior. El fundador respondió a las tres preguntas abiertas:

1. **Aura:** «un aura por persona y combate» (la opción recomendada). Su idea original era ordenar por «número de clics»; se reconcilió así: el total de aura es el número de personas distintas que la han dado, lo que mantiene la esencia (más aura = mejor posición) sin que un solo usuario pueda inflar el ránking pulsando sin límite.
2. **Fichas:** una sola ficha por persona con varias disciplinas.
3. **Disciplinas iniciales:** boxeo, MMA, kickboxing, K-1 y jiu-jitsu, dejando el sistema preparado para añadir más.

### Qué se decidió y por qué

- **«Boxeador» pasa a «peleador» en todo** (modelo, código, interfaz y rutas: `/peleadores`). Se hizo ahora porque solo hay datos de demostración y era el momento más barato. El boxeo sigue en cabeza (orden de presentación, ránking por defecto, portada).
- **Categorías de peso y formas de terminar por disciplina** en un único fichero (`lib/disciplines.ts`). Las categorías son **orientativas**, sin validar con las federaciones de cada deporte.
- **Récord de partida:** se guarda por disciplina (total y, si se recuerda, victorias/derrotas/empates; los huecos cuentan como 0 y si da el total y el detalle deben cuadrar). En la cifra principal solo suma si hay detalle; si solo se sabe el total, se muestra aparte («además, N combates anteriores sin detallar») y siempre como **declarado por el propio deportista**.
- **Jiu-jitsu:** al ser deporte de torneo (varios combates el mismo día), no se le aplican las señales de combates muy seguidos.
- **Ránking de aura:** por disciplina y zona, agrupado por categoría de peso (de menos a más peso), con empates en la misma posición y filtro de periodo (siempre / últimos 90 días) para que no gane solo quien lleva más tiempo en la app.

### Qué se hizo

Cuatro entregas, cada una con pruebas: `66edb2c` (renombrado a peleador), `f41f74e` (disciplinas y récord de partida), `d335b06` (aura y ránking) y esta documentación. Tests: 41 unitarios y 39 comprobaciones de navegador (antes 25 y 30).

### Qué salió mal / qué se aprendió

- **Prisma se negó a hacer un reset de la base de datos** al detectar que lo lanzaba una IA, y exige el consentimiento explícito del usuario. **No lo forcé**: creé una base de datos de pruebas nueva y vacía y apliqué el esquema ahí. La anterior (109 usuarios de pruebas) sigue existiendo en el entorno; solo habría que borrarla con permiso.
- **Una comprobación intermitente volvió a aparecer** (contador de seguidores y contador de aura tras la acción). Esta vez **medí** la causa en lugar de suponerla: el contenido se actualiza entre 4 y 30 ms después del aviso, imperceptible; era solo sincronía del test.
- **Un script de edición falló a medias** porque la función exigía un parámetro que olvidé; al no escribir nada hasta el final, no dejó cambios parciales. Regla: los scripts de edición deben ser todo-o-nada.

### Estado y próximos pasos

- Hecho: peleadores, cinco disciplinas, categorías por disciplina, récord de partida, aura y ránking por categoría.
- **Riesgos que deben decidirse:** (1) el récord de partida se puede editar en cualquier momento (queda en el historial, pero alguien podría inflarlo después); habría que bloquear la edición tras el primer combate registrado o pedir confirmación de un moderador; (2) el aura absoluta favorece a quien compite más; hay que decidir si se normaliza; (3) las categorías de peso deben validarse con federaciones.
- Pendiente de lo anterior: despliegue real (proveedor de correo, migraciones, variables de entorno, preferencias de aviso), auditoría de usabilidad del resto de pantallas y decisión «tú/usted».
- Pendiente de decidir: el nombre de la marca (ya no encaja «Ring España» del todo con MMA/jiu-jitsu).

---

## Sesión 1 (continuación) — 30 de septiembre de 2026 — Aura, monetización, todo en español y análisis de la competencia

### Qué se pidió / qué idea surgió

1. **Aura:** «principalmente va a ser un clic por usuario y por pelea. Y más adelante podremos introducir tres clics, pero eso ya sería una función premium.»
2. **Monetizar:** una de las finalidades es «sacar dinero» con **funciones premium**, que se harán «una vez ya hayamos terminado toda la estructura básica».
3. **«Todo debe estar en español.»**
4. **Competencia:** Raunder (raunder.es) y BoxRec (boxrec.com): «mira en qué fallan y hazlo mejor; mira también lo que hacen bien y mejóralo».

### Qué se decidió y por qué

- **Aura a un clic por usuario y combate**: ya es lo que está implementado. Los tres clics quedan registrados como función premium **aplazada**, con un riesgo anotado: si pagar da más peso al aura, el ránking pasa a ser «quien paga, gana» y se pierde la credibilidad que se ha protegido hasta ahora.
- **Principio de monetización**: la consulta básica sigue siendo gratuita y **nunca se vende la verificación, el sello ni una posición en el ránking**. Se listan candidatas (ficha ampliada, herramientas para organizadores, páginas de gimnasio, avisos y comparador ampliados, sin publicidad) para decidir después con el fundador.
- **Español**: se aplicó a todo lo que ve una persona. Se interpretó que **el código interno sigue en inglés** (`Fighter`, `Bout`), y se dejó anotado que hay que preguntar si el fundador quiere también el código en español, por lo grande del renombrado.
- **Competencia**: no se afirma nada que no se pueda comprobar (ver «qué salió mal»).

### Qué se hizo

- Español: páginas de «no encontrada» y de error propias (antes salían las de Next.js en inglés), «email» pasa a «correo electrónico» en textos y correos, y `/admin` pasa a `/moderacion` (`56a7a8e`).
- `docs/COMPETENCIA.md` con lo comprobado, lo que es conocimiento general sin comprobar, y una lista de mejoras propuestas.
- Reglas nuevas en `CLAUDE.md` (idioma, aura y premium, competencia) e ideas F12 y F13 más siete ideas nuevas.
- Tests: 41 unitarios y 39 comprobaciones de navegador, sin fallos en 3 ejecuciones.

### Qué salió mal / qué se aprendió

- **No pude abrir ni Raunder ni BoxRec**: la política de red del entorno bloquea esos dominios (también Wikipedia), y las búsquedas no devuelven nada de Raunder. **No rodeé el bloqueo ni rellené los huecos con suposiciones.** El análisis de BoxRec se limita a quejas públicas de pocas reseñas y a un artículo de opinión con fecha, señalado como tal, y a conocimiento general marcado como «sin comprobar». **De Raunder no se dice nada.** Regla: cuando falta una fuente, decirlo, y no escribir un análisis que parezca completo.
- Hay que pedir al fundador que habilite esos dominios en la red del entorno (o que aporte capturas o texto) para completar el análisis.

### Estado y próximos pasos

- Pendiente de acceso: completar el análisis de Raunder y confirmar lo general de BoxRec.
- Mejoras propuestas a partir del análisis, por impacto: estadísticas de carrera por disciplina, comparador «cara a cara», tarjeta para compartir en redes, preparación para buscadores y avisos al propio peleador.
- Sigue pendiente lo anterior: despliegue real (correo, migraciones), auditoría de usabilidad, decisiones sobre el récord de partida editable y la normalización del aura, nombre de la marca.

---

## Sesión 1 (continuación) — 30 de septiembre de 2026 — El CI vuelve a avisar: pruebas deterministas

### Qué pasó

Al revisar el CI, el run 17 (el del cambio a español) **falló** y el 18, con exactamente el mismo código, **pasó**: era una comprobación intermitente más. La causa era la misma que ya había medido (el contenido se actualiza unos milisegundos después del aviso), pero en una comprobación que no había revisado.

### Qué se hizo

- En lugar de parchear solo la línea que falló, se revisaron **todas** las esperas del test de navegador y se sustituyeron por esperas a un estado visible concreto. Ya no queda ningún `networkidle`.
- Al ejecutar dos pruebas a la vez para simular un CI lento, apareció otro fallo de aislamiento (nombre de organización repetido); ahora es único por ejecución.
- Resultado: 8 ejecuciones simultáneas consecutivas con 39/39, y 6 secuenciales sin fallos.

### Qué salió mal / qué se aprendió

Reconozco que fue **la segunda vez** que un fallo del CI destapó una fragilidad que en local «pasaba». La lección (ya escrita en `LECCIONES.md`) es buscar la raíz en todo el fichero y probar también bajo carga o en paralelo, no solo repetir en serie.

### Estado

Sin cambios de producto. Pendiente lo de siempre: acceso a las webs de la competencia, despliegue real, auditoría de usabilidad y decisiones sobre el récord de partida y el aura.

## Sesión 1 (continuación) — 30 de septiembre de 2026 — Corrección de la auditoría (bloques 1 a 5) y traslado a Claude Code

### Qué se pidió / qué idea surgió

- Tras la medición de accesibilidad, el fundador pidió: «sigue avanzando en otras cosas que han quedado pendientes». Se lanzó una **auditoría exhaustiva de solo lectura** con 9 revisores independientes (seguridad, privacidad, lógica de acciones y de páginas, usabilidad, accesibilidad, despliegue, pruebas, documentación). Resultado: 175 hallazgos brutos → **99 únicos** (`docs/AUDITORIA.md`).
- Ante el resultado: «**Arregla lo confirmado por prioridad**».
- Al final de la sesión: «**Para un momento. Quiero trasladar este proyecto a Claude Code. Trabajar el proyecto entero a Claude Code.**» Se detuvo el trabajo nuevo y se preparó el traslado (`docs/TRASLADO.md`).

### Qué se decidió y por qué

Orden de los bloques, de más a menos grave: (1) validación y robustez del servidor, (2) integridad de la verificación y del aura, (3) acceso y correo, (4) privacidad, (5) búsqueda, rendimiento y despliegue; (6) accesibilidad y (7) pruebas y documentación quedan para Claude Code.

Decisiones que conviene que el fundador conozca (las marcadas con ★ **las tomó el asistente y necesitan su validación**):
- Los combates rechazados o sin confirmar **no se muestran como hechos ni cuentan** en récord ni aura; tienen su cola de moderación para restaurarlos.
- ★ Una ficha creada por un tercero para su rival es **provisional** (solo nombre e inicial del apellido, sin listados ni buscadores) hasta que se reclame o el combate se confirme.
- ★ **Eliminar la cuenta:** la ficha se borra si no tiene combates y se **anonimiza** si los tiene (los combates forman parte del récord de los rivales).
- ★ **Plazos de conservación** (cuentas sin verificar 30 días, solicitudes 90 días, avisos 12 meses, historial 3 años) y **texto de privacidad**: los propuso el asistente; necesitan revisión jurídica.
- ★ El formulario de registro sigue diciendo «ya hay una cuenta con ese correo» (mejor para la persona), con límites por IP, aunque revela qué correos tienen cuenta.
- No se usa `cache()` de React en `getUser` (dejaría la sesión obsoleta tras cerrar sesión o eliminar la cuenta).
- Contraseñas con parámetros de OWASP guardados en el hash (se pueden reforzar sin invalidar cuentas); el correo real será Resend por HTTP, y en producción el servidor no arranca sin `APP_URL`.

### Qué se hizo

Commits en la rama `claude/ring-espana-mvp`:
- **Bloques 1 y 2** (`f8638f9`, `1f3f01c`): validación de fechas, longitudes, provincia y resultado frente a la disciplina; sin claves heredadas (`__proto__`…); enlaces de retorno solo internos; combates únicos por pareja y velada; bloqueo de concurrencia en los límites diarios; aura sin combates rechazados ni cancelados, comentarios denunciables; fichas provisionales; cola «en revisión».
- **Bloque 3** (`f391e9d`): límites de intentos, scrypt asíncrono, recuperación de contraseña, enlaces de un solo uso con tipo, correo con Resend y modo registro explícito, comprobación del entorno al arrancar, limpieza periódica.
- **Bloque 4** (`ecb6c04`): Mi cuenta (datos, contraseña, avisos), descarga y eliminación de datos, corrección de la ficha, página de privacidad, baja de avisos con enlace, avisos a seguidores tras responder y tolerantes a fallos, plazos de conservación.
- **Bloque 5, parcial** (`4554379`, `5303086`): búsqueda sin tildes y por varias palabras, listados paginados, ránking sumado en la base de datos, cabeceras de seguridad (política de contenido, HSTS…), `robots.txt`, mapa del sitio, `/salud`, títulos propios, índices, seed protegido, higiene del repositorio y del CI.
- **Pruebas:** de 73 a **103 unitarias** y de 39 a **146 comprobaciones de navegador** en cinco guiones (`flujo`, `integridad`, `acceso`, `cuenta`, `busqueda`) con ayudas comunes.
- **Traslado:** `README.md` y `docs/ARQUITECTURA.md` reescritos (describían el modelo antiguo), `docs/AUDITORIA.md` (los 99 hallazgos con su estado), `docs/TRASLADO.md` (puesta en marcha, pendientes y decisiones), ideas y lecciones actualizadas.

### Qué salió mal / qué se aprendió

- **La auditoría no se terminó de verificar:** el flujo (308 agentes, ~20 millones de tokens) agotó el límite de uso de la sesión. Los hallazgos 1 a 90 pasaron la verificación adversarial (3 se refutaron: 81, 83 y 90); los **91 a 99 no**, y la pasada final de «huecos» no llegó a ejecutarse. Una segunda pasada, ya al día siguiente, verificó del 91 al 96 (el 91 y el 92 salieron «refutados» porque ya estaban corregidos); **quedan sin verificar el 97, 98 y 99** y los «huecos». **Al escribir el traslado afirmé por error que eran los 53 a 99 los no verificados y que ninguno se había refutado**: mi copia de los datos era anterior al final del proceso. Lo detecté al retomar la sesión y lo corregí en todos los documentos.
- **El CI falló una vez (ejecución 25):** una prueba de paginación dependía de que la base local tuviera cientos de peleadores; en el CI está vacía. Se corrigió (`5303086`) y se probó sobre un **clon limpio con base vacía**.
- **Una tabla de tildes desalineada** (la «ñ» daba «u») la cazaron las pruebas de navegador, no la lectura del código. Ahora se construye por pares y tiene prueba unitaria.
- **Servidor antiguo sirviendo código viejo** (otra vez, por matar el proceso equivocado) y **PostgreSQL parado** tras una pausa del entorno: costaron varias vueltas.
- **Incumplí la petición de documentar al cerrar cada bloque:** dejé README y ARQUITECTURA para el final y se quedaron describiendo el modelo antiguo (lo detectó la propia auditoría, hallazgo 91). Se corrigió al preparar el traslado.
- Lecciones completas en `docs/LECCIONES.md` (sección «De la corrección de la auditoría»).

### Estado y próximos pasos

Sin trabajo a medias en el código: todo está commiteado y subido; las pruebas pasan (tipos, 103 unitarias y 146 de navegador). **Quedan** el resto del bloque 5 (migraciones de Prisma, colas de moderación paginadas), el bloque 6 (accesibilidad y usabilidad, con pruebas con personas reales) y el bloque 7 (pruebas de autorización, documentos). Hay **12 decisiones pendientes del fundador** y el **análisis de la competencia**, que necesita acceso a internet. Todo, en orden, en [`TRASLADO.md`](TRASLADO.md).

## Sesión 1 (continuación) — 1 de octubre de 2026 — Bloques 5 y 6 (accesibilidad y usabilidad), migraciones y revisión independiente

### Qué se pidió / qué idea surgió

- Tras preparar el traslado a Claude Code, el fundador aclaró: «**Aún así quiero seguir trabajando aquí la aplicación y para ciertas cosas lo haré en code terminal**», y después «**Continúa**». Se retomó la lista de pendientes por prioridad.

### Qué se decidió y por qué

Decisiones que tomó el asistente y que el fundador debe conocer (★ = necesitan su validación):
- ★ **Ajustes de accesibilidad en el estilo, con el menor cambio posible**: el borde de campos y botones secundarios pasa de casi invisible a un gris que se distingue (3:1), los enlaces del texto van subrayados, las etiquetas y los estados tienen 16 px, las zonas táctiles 44 px, la etiqueta «Amateur» cambia a un azul más oscuro, y los controles nativos pasan a modo oscuro. La paleta (fondo oscuro, rojo y dorado) no cambia. Todo está concentrado en `globals.css`, marcado como «A11Y» y se puede revertir. Se considera accesibilidad (se aplica ya), no diseño visual (se deja para el final), pero el fundador debe confirmar que no le parece un cambio de estilo notable.
- ★ **Cabecera más corta:** cinco enlaces de navegación, «Mi cuenta», «Salir» y un buscador con botón. «Mis peleadores» pasa a «Peleadores que sigo», dentro de «Mi cuenta», que ahora reúne los accesos directos y los avisos de error enviados con su respuesta. «Mi ficha» solo sale a quien es peleador; «Mis veladas», a quien organiza; «Moderación», a la moderación.
- ★ **Quien recibe un «no» tiene derecho a saber por qué:** el motivo es obligatorio al rechazar una reclamación de ficha o una solicitud de organizador; lo ve la persona en la aplicación y por correo electrónico (así deja de ser falso el «te avisaremos»). Al **aprobar** a un organizador se exige anotar la evidencia comprobada (el sello de organizador se apoya en ella).
- ★ La solicitud de organizador pide ahora **cómo podemos comprobarlo** de forma obligatoria.
- En el cartel, cada esquina se elige de una **lista con alias, ciudad y gimnasio** (el valor es el identificador, no un texto que haya que escribir igual).
- **Lo escrito no se pierde tras un error** (lo guarda el navegador de esa pestaña hasta la siguiente pantalla); nunca se conservan contraseñas ni casillas (las casillas suelen ser confirmaciones de acciones sin vuelta atrás: hay que marcarlas de nuevo a propósito).
- **Migraciones de Prisma** (`prisma/migrations`): el CI las aplica sobre una base vacía y comprueba que reproducen exactamente `schema.prisma`.

### Qué se hizo

- **Bloque 5 (resto):** migración inicial verificada, `test:a11y` en el CI, índices que faltaban, descripción del sitio, vocabulario residual (hallazgos 80, 82, 89, 96, 97 y parte de 88).
- **Bloque 6:** `axe-core` pasa de 14 incumplimientos graves a **0 en 40 pantallas**; filtros y formularios con etiqueta visible; nombres accesibles con el objeto («Dar aura a X por el combate en Y»); avisos en regiones permanentes para lectores de pantalla; enlaces con aspecto de botón (nunca un botón dentro de un enlace); tablas con cabeceras y títulos; portada con botón de crear cuenta; historial en español; combate pendiente de confirmar como tarjeta; sin desbordamiento a 360 px.
- **Pruebas:** de 103 a **113 unitarias** (incluye una que exige texto para cada código de mensaje) y de 146 a **174 comprobaciones de navegador** (nuevo guion de usabilidad: navegación, tamaños, contraste calculado, enlaces subrayados, lo escrito que se conserva, respuestas a solicitudes, reflujo en móvil).
- **Revisión independiente** (flujo de 6 revisores y verificación adversarial de cada hallazgo) sobre todo lo corregido desde la auditoría; sus resultados, abajo en «Estado».

### Qué salió mal / qué se aprendió

- **Una prueba mía no podía fallar:** comprobaba que la página no dijera «Algo ha salido mal», una frase que la aplicación nunca usa. Ocultó un error real: con `?problema=__proto__` el aviso rompía la página en el navegador. Lo corregí (ahora se busca con `lookup`) y arreglé la prueba, comprobando antes que **fallaba** con el código antiguo.
- **React 19 vacía los campos de un formulario cuando termina su acción**, así que la primera versión de «no perder lo escrito» no funcionaba (se rellenaba y se volvía a vaciar). Se escucha el evento de reinicio y se rellena justo después.
- **Restaurar casillas era peligroso:** la confirmación de «eliminar mi cuenta» volvía marcada tras un error de contraseña, y la prueba eliminó la cuenta sin querer. Las casillas ya no se recuerdan.
- Otra vez el servidor local y PostgreSQL desaparecieron entre dos pasos (el entorno se detiene); un código de mensaje que usaban las acciones (`cartel_boxeadores`) **no tenía texto** y la persona no veía nada: ahora una prueba lo impide.
- Los hallazgos 91 y 92 salieron «refutados» en la segunda pasada de verificación **porque ya estaban corregidos** cuando se comprobaron; no porque fueran falsos. Está anotado en `AUDITORIA.md`.
- Lecciones completas en `docs/LECCIONES.md`.

### Estado y próximos pasos

Los resultados de la revisión independiente y de la primera pasada de pruebas por personas están en la entrada siguiente (1 de octubre, funcionalidad completa y organización).

---

## Sesión 1 (continuación) — 1 de octubre de 2026 — Funcionalidad completa y organización escalable

### Qué se pidió / qué idea surgió

Palabras del fundador: «No quiero que te centres ahora mismo en diseños, colores. Lo que quiero es que te centres en la funcionalidad completa de la aplicación. No quiero fallas en el sistema, funcionalidades inservibles, botones que no funcionan… que un usuario pueda entrar, entienda absolutamente todo, le funcione todo correctamente y esté todo organizado. Quiero que sea perfecta, cómoda de usar, que no haya ningún fallo.» Y sobre la forma de trabajar: «como estamos haciendo vibe coding, es muy importante la organización, la estructura […] para que pueda ser escalable […] una buena base, un buen hábito de desarrollo, documentando todo, esquematizando todas las cosas. Que haya una red clara de a dónde seguir, qué rutas tomar para hacer X cosas. En algún momento ampliaré el equipo […]. No puede ser una maraña de cables: tiene que estar todo reglado, medido y estructurado.»

### Qué se decidió y por qué

- **Prioridad única: funcionalidad.** Nada de diseño visual. Se recorrió la aplicación «como lo haría una persona», con agentes que hacen de personas de prueba en navegador real (guion en `docs/pruebas/personas.md`, entorno aislado por persona con `scripts/entorno-aislado.sh`) y una revisión de código independiente.
- **Estructura por dominios** en lugar de un fichero de acciones de 931 líneas y 27 ficheros planos en `src/lib`: acciones en módulos por dominio, lógica agrupada por dominio, **reglas de dependencia comprobadas por una prueba** (así no se pueden romper sin que falle el CI), una guía con recetas («cómo hago X»), un índice de documentación y un **mapa funcional generado del código** (se comprueba en el CI, así nunca queda desfasado). Se hizo con un script que usa el analizador de TypeScript y se validó primero en una copia (tipos, 237 pruebas, compilación y 174 comprobaciones de navegador) antes de tocar el repositorio. El movimiento fue un commit aparte, sin cambios de comportamiento.
- **Cada hallazgo se reproduce antes de corregirse** y se corrige con su prueba. Todo queda registrado en `docs/pruebas/hallazgos-2026-10-01.md`.

### Qué se hizo

- **Reorganización** (commit `0576eb5`): ver arriba y `docs/DESARROLLO.md`, `docs/README.md`, `docs/MAPA-FUNCIONAL.md`.
- **Lo que salió de las pruebas por personas** (solo terminó la persona «visitante», 19 hallazgos): error 500 con `?constructor=` (y con `%00` y parámetros repetidos) en todas las pantallas con filtros → `src/middleware.ts`; fichas de peleador y de velada ilegibles en el móvil → tablas apiladas; redirecciones mudas a «Entrar» → `requireUser(ruta)` y guardas de permisos en un solo sitio; quien se registra desde «Entra para dar aura» perdía el sitio → ruta de vuelta; resultados pendientes mostrados de forma incoherente; formularios en columna torcidos por una regresión de CSS mía; textos que explican por qué algo no se puede hacer.
- **Lo que salió de la revisión de código** (44 hallazgos de 3 revisores, sin verificación adversarial): límite de intentos de acceso que se saltaba con peticiones simultáneas (`reservar()`); `resetPassword` que calculaba el hash antes de validar el enlace; confirmación del rival no ligada al resultado que vio y combates confirmados sin resultado que quedaban atascados; decisiones de moderación que se pisaban; datos personales que quedaban en el historial al eliminar la cuenta; IP del cliente falsificable; limpieza de datos que solo corría al registrarse y podía borrar moderadores; nombres no latinos que fundían veladas y gimnasios; y 19 de interfaz (restauración de lo escrito, desplegables cerrados tras el error, nombres accesibles, etc.).
- **Pruebas:** de 194 a **266 unitarias** y de 174 a **193 comprobaciones de navegador**; axe sigue en 0 incumplimientos.

### Qué salió mal / qué se aprendió

- **Los dos flujos de agentes se cortaron por el límite de uso de la sesión**: de 10 personas terminó 1; de 6 revisores, 3, y ninguna de las 91 verificaciones adversariales. No se debe presentar como una revisión completa: los hallazgos de la revisión los reproduje o razoné yo antes de corregir. Una segunda tanda de personas se lanzó después, por fases (ver «Estado»).
- **Una regresión de CSS mía** (de un bloque anterior) dejó nueve formularios torcidos y no lo vio ninguna prueba automática: solo lo vio un revisor. Ahora se miran capturas tras tocar CSS global.
- **La prueba móvil pasaba mientras la velada se salía de la pantalla**: no medía las fichas con datos. Ahora la prueba crea sus datos.
- Al volcar la copia reorganizada al repositorio olvidé `prisma/seed.ts` (no había `rsync`): `tsc` lo detectó. Ahora se comparan los árboles con `diff -rq`.
- El servidor local y PostgreSQL desaparecieron otra vez al reiniciarse el entorno.
- Lecciones completas (con la regla de cada una) en `docs/LECCIONES.md`, sección del 1 de octubre.

### Estado y próximos pasos

- CI en verde en los commits de la reorganización y de las correcciones de interfaz; el último se estaba ejecutando al escribir esto.
- **En marcha:** segunda tanda de personas de prueba (aficionado, peleador, rival, organizador, moderadora) sobre la versión corregida; después, la tercera (seguridad, móvil y teclado, persona mayor, exploración destructiva) y los revisores que no llegaron a ejecutarse. Lo que salga se anota en `docs/pruebas/`.
- **Decisiones del fundador nuevas** (en `docs/TRASLADO.md` §7): correo de contacto y responsable, carteles oficiales con fichas provisionales, restaurar fichas ocultadas.
- **Antes de publicar:** definir `TRUSTED_PROXY_HOPS` según el alojamiento, `CONTACT_EMAIL` y `RESPONSABLE_NOMBRE`, y probar con personas reales de distintas edades.

---

## Sesión 1 (continuación) — 2 de octubre de 2026 — Segunda tanda de pruebas por personas: correcciones

### Qué se pidió / qué idea surgió

Seguir con la prioridad del fundador (funcionalidad completa, sin botones que no funcionen). Además, dos peticiones nuevas del 1–2 de octubre, **solo registradas, aún sin implementar**: (a) «una especie de CRM para las federaciones y promotoras» para que publiquen veladas y administren peleadores; (b) un selector de tres opciones al registrarse o entrar: A usuario normal, B peleador, C organizador/federación («eso ya lo veremos más tarde»). Están en `docs/IDEAS.md`.

### Qué se decidió y por qué

- Corregir primero lo que haría tropezar a una persona real: doble clic, combate registrado por error, rival sin aviso, ficha duplicada, organizador que no puede corregir.
- La ficha provisional de un rival no lleva su apellido en la dirección pública hasta que se verifica: es un dato de un tercero.

### Qué se hizo

Ver la tabla de la segunda tanda en `docs/pruebas/hallazgos-2026-10-01.md`: protección contra doble envío en toda la aplicación, correos al rival y de vuelta al autor, motivo obligatorio al rechazar, quitar un combate propio, combate de hoy sin resultado, ficha sin callejones, disciplina duplicada, editar/cancelar/quitar del cartel para el organizador, y dirección provisional sin apellido.

### Qué salió mal / qué se aprendió

- Tres fallos de **mis propias pruebas** (esperas a un aviso anterior, doble clic que seguía enviando dos veces, un selector de texto ambiguo): ver `docs/LECCIONES.md`. Dos de ellos mostraron que la primera versión de la protección de doble envío no bastaba.
- La paridad con la base de datos vacía (la que usa el CI) volvió a ser la que lo descubrió.

### Segunda ronda del mismo día (petición «haz lo recomendable»)

Corregidos los hallazgos de la segunda tanda que no dependían de una decisión del fundador: «no oficial» en el calendario, «Mis combates» en móvil, homónimos distinguibles al elegir rival, texto de avisos según la preferencia real y la pantalla de dirección mal codificada en español. Detalle en la tabla de hallazgos. Se dejó fuera, a propósito, lo que necesita decisión suya (aura por combate o por peleador, menores, selector A/B/C y CRM).

### Demostración alojada (petición del fundador: «Lánzame una demo»; «esta sesión la estoy haciendo en el móvil»)

El entorno de desarrollo en la nube no admite visitas desde fuera, y el fundador trabaja desde el móvil, así que un script local no le servía. Se preparó una **demo alojada**: `render.yaml` (web + base de datos gratuitas en Render), `scripts/arranque-demo.sh`, y un **modo demostración** (`DEMO_MODE=si`) con un botón para confirmar el correo sin correos reales y otro para cambiar de papel (aficionado, peleador, organizador, moderador) con una sola cuenta. Las acciones se niegan si la variable no está; hay pruebas unitarias y una de navegador (`tests/e2e/demo.mjs`). Guía en `docs/DEMO.md`. **Limitación honesta:** el arranque se probó aquí en modo producción, pero el `render.yaml` no se ha podido probar en Render (hace falta la cuenta del fundador).

### Pesos de las categorías (observación del fundador probando la demo)

Palabras del fundador: «a la hora de filtrar por la categoría de peso, lo pones los nombres en inglés y tal […] en España la gente no tiene un buen nivel de inglés. Por lo que, aparte del nombre de la categoría, tienes que poner también el peso, en qué rango oscila». Los nombres ya estaban en español (Wélter, Ligero…), pero «wélter» sigue siendo opaco: ahora cada categoría lleva su límite en kilos («Wélter · hasta 66,7 kg») en los selectores de ficha, el filtro de peleadores (agrupado por disciplina, porque el mismo nombre pesa distinto en boxeo y en MMA), el ránking, la ficha y el cartel. **Solo se muestran pesos donde el estándar es conocido (boxeo profesional y MMA con reglas unificadas); en kickboxing, K-1 y jiu-jitsu no se afirma ninguno** hasta validarlos con las federaciones (decisión pendiente: facilitar los reglamentos o confirmar los pesos). Los pesos son orientativos y así se dice en pantalla. Código: `weightClassLabel` en `src/lib/common/disciplines.ts`.

### Categorías de peso por disciplina y nivel (corrección del fundador)

Palabras del fundador: «las categorías de peso las estás englobando todas en una misma disciplina, ¿vale? Entonces, debes corregir eso, porque no son los mismos pesos, no son las mismas categorías en profesional que en amateur […] en Jiu-Jitsu, Muay Thai, MMA será lo mismo. Tienes que diferenciar cada disciplina con sus pesos divididos en profesional y amateur. Esto es muy importante. […] Intenta pulir mucho más ese panel de filtros para poder ejecutar bien las búsquedas».

**Fallo mío:** el cambio anterior (kilos junto al nombre) mantenía una sola lista por disciplina y solo para boxeo y MMA, y el filtro mezclaba todas las disciplinas en un único desplegable. **Qué se hizo:** modelo disciplina × nivel con su fuente (`docs/DISENO-PESOS.md`); Muay Thai como disciplina nueva (migración); selector de tres pasos (disciplina → nivel → categoría) en la ficha, en «Añadir otra disciplina» y en el filtro; la ficha guarda ahora el nivel de cada disciplina; el ránking separa profesional y amateur; filtro de peleadores rehecho (orden lógico, categorías según lo elegido, resumen de filtros aplicados con «✕» para quitar cada uno, número de resultados). **Honestidad:** donde no hay fuente fiable (Muay Thai amateur, kickboxing y K-1 profesional) la lista está vacía y la pantalla lo dice; las categorías femeninas, juveniles y cadete/júnior (salvo boxeo amateur élite/joven) siguen pendientes, y hace falta decidir si la ficha guarda sexo y edad.

### Estado y próximos pasos

- Pendiente de la segunda tanda: lo marcado «pendiente» en la tabla de hallazgos; falta la persona moderadora y las de seguridad, móvil, persona mayor y exploración destructiva.
- Después: selector A/B/C y CRM (tareas 13 y 14), con las decisiones del fundador que siguen abiertas en `docs/TRASLADO.md` §7.

---

## Sesión 2 — 3 de octubre de 2026 — Codex: comparación y claridad funcional

### Qué se pidió / qué idea surgió

El fundador autorizó mejoras y pidió estudiar Raunder y BoxRec. Reiteró: «El diseño gráfico de la aplicación lo dejaremos para lo último» y pidió subir un Markdown para que Claude conozca todas las aportaciones.

### Qué se decidió y por qué

Actuar sobre recorridos existentes, exactitud y transparencia. La comparación pública permite mejorar orientación y explicación sin ampliar permisos ni adelantar el CRM, el premium o decisiones sobre menores/aura. Los cambios van en una rama y propuesta de integración para validación completa.

### Qué se hizo

Calendario por día de Madrid, entrada por objetivos, filtros individuales de veladas, ránking explicado, ayuda ajustada a las reglas reales, categoría correcta por nivel en tarjetas de récord y explicación de NC. Comparación competitiva revisada con fuentes propias. Relevo detallado: `APORTACIONES-CODEX.md`, enlazado desde instrucciones e índice. Nueva regresión de calendario en unitarias y guion E2E incluido en CI; mapa regenerado.

### Qué salió mal / qué se aprendió

BoxRec impidió la inspección normal en este navegador con verificación contra bots; se usaron páginas recuperadas y ayuda oficial, sin afirmar haber probado sus flujos. PostgreSQL no estaba instalado y el intento de instalación falló por permisos. No se ejecutó E2E/axe local ni una auditoría completa.

### Estado y próximos pasos

TypeScript, 313 unitarias y compilación de producción aprobados. Integración y E2E/axe pendientes de CI. Rama: `codex/claridad-calendario-2026-10-03`. El Markdown de relevo se publica también en la rama principal para Claude. La demo sigue siendo la versión previa hasta integración/despliegue. Completar las personas pendientes y verificar categorías históricas por nivel. No se han resuelto decisiones del fundador ni trabajado diseño gráfico.

---

## Sesión 2 (continuación) — 3 de octubre — primera validación de GitHub

### Qué se pidió / qué idea surgió

Completar la validación de los cambios autorizados y mantener el relevo para Claude.

### Qué se decidió y por qué

No integrar con el CI fallando. Corregir la causa observada sin saltar pruebas.

### Qué se hizo

CI 77: migraciones, paridad, tipos, mapa, unitarias, compilación y arranque aprobados. La primera prueba E2E falló al buscar disciplina en un selector oculto de otro formulario. Se acota `registrar()` al formulario de su botón en `tests/e2e/ayudas.mjs`.

### Qué salió mal / qué se aprendió

El ayudante antiguo quedó desfasado al existir varios selectores de disciplina. El log demuestra la selección del primer elemento de cuatro, oculto; no es evidencia de fallo en la acción de registrar. Se documenta la regla de localización por formulario.

### Estado y próximos pasos

Subir la corrección y repetir CI completo. Calendario y axe todavía no se ejecutaron. Relevo detallado en `APORTACIONES-CODEX.md`.

---

## Sesión 2 (continuación) — 3 de octubre — segunda validación de GitHub

### Qué se pidió / qué idea surgió

Completar la validación autorizada tras corregir el selector de disciplina.

### Qué se decidió y por qué

Comprobar resultados del filtro, no coincidencias del texto buscado en toda la pantalla.

### Qué se hizo

CI 79 completó el flujo de registro de MMA. La comprobación de exclusión falló porque el nombre seguía visible en el resumen del filtro, aunque no hubiera tarjeta. Se cambia `tests/e2e/flujo.mjs` a exigir tarjeta visible para inclusión y mensaje de cero resultados más ausencia de tarjeta para exclusión.

### Qué salió mal / qué se aprendió

El test antiguo podía dar falsa inclusión por el texto de búsqueda. Se acotan las comprobaciones al listado y se espera su estado visible.

### Estado y próximos pasos

Repetir CI completo. No se modificó el filtro de producto ni se omitieron comprobaciones. Axe y los guiones siguientes continúan pendientes.

---

## Sesión 2 (continuación) — 3 de octubre — revisión de pruebas dependientes

### Qué se pidió / qué idea surgió

Completar la misma validación, revisando los guiones posteriores tras la causa encontrada en CI 79.

### Qué se decidió y por qué

Aplicar la corrección de localización también a la exclusión de fichas provisionales y adaptar datos de prueba al modelo actual de disciplinas.

### Qué se hizo

`integridad.mjs` comprueba cero resultados y ausencia de tarjeta, evitando el texto repetido del filtro. `busqueda.mjs` crea una disciplina de boxeo amateur para cada una de sus 30 fichas, ya que el filtro de nivel consulta `FighterDiscipline`. No cambia código de producto.

### Qué salió mal / qué se aprendió

La prueba de paginación aún preparaba el modelo anterior de nivel. Regla: las fixtures deben representar los datos que realmente consulta el filtro.

### Estado y próximos pasos

Cambios de guiones preparados con comprobación de sintaxis. Pendiente la ejecución de navegador completa en CI.

---

## Sesión 3 — 3 de octubre de 2026 — Codex: recorrido de récords por nivel

### Qué se pidió / qué idea surgió

El fundador compartió el repositorio y pidió: «continua el trabajo».

### Qué se decidió y por qué

Continuar la validación pendiente del relevo, con prioridad funcional y diseño aplazado. La rama de la propuesta #8 recibió correcciones durante la revisión; se conservan y este bloque parte de `e049fe4` en una rama independiente (`codex/validacion-records-2026-10-03`).

### Qué se hizo

Se añadió `tests/e2e/respaldo.mjs` al conjunto de CI. Crea una cuenta y ficha ficticias desde la interfaz, registra un combate amateur, cambia a profesional, registra victoria y combate sin decisión, y vuelve a amateur. Comprueba en «Mi ficha» y como visitante que las tarjetas conservan los resultados históricos, muestran la categoría solo en el nivel actual, explican NC y enlazan a la ayuda pública. La ayuda de registro ahora acota todos los campos y el botón al formulario de combate; la corrección reciente de la rama anterior solo acotaba la disciplina.

Se inspeccionó además la ejecución `37109729125`: el guion de filtros impedía llegar al calendario y al nuevo recorrido porque su expresión `peleadores?` no reconocía el singular «peleador». Se corrige la comprobación para aceptar las frases completas de singular y plural, sin modificar la pantalla.

### Qué salió mal / qué se aprendió

El proxy local no acepta conexiones y no hay dependencias en caché: no se pudo clonar ni instalar con `npm ci --offline`. Se recuperaron los ficheros mediante GitHub y se comprobaron sus SHA. Sintaxis de los guiones y diferencias comprobadas localmente; el CI debe validar dependencias, PostgreSQL y navegador. Se detectaron cambios concurrentes antes de publicar y se respetaron en una rama independiente.

### Estado y próximos pasos

Validación completa aprobada en la ejecución `37110167176` de la propuesta #9, commit `233420c`: migraciones/paridad, tipos, mapa, 313 unitarias, compilación, todos los guiones E2E y axe (0 incumplimientos). El nuevo recorrido aprobó sus 17 comprobaciones. La propuesta #9 está encadenada sobre la rama de #8. Integración y demo pendientes; siguen abiertos los recorridos por personas y los bloques de la auditoría indicados en `TRASLADO.md`.

## Sesión — 3 de octubre de 2026 — propuestas visuales diferenciadas

### Qué se pidió / qué idea surgió

El fundador pidió propuestas visuales mientras sigue el desarrollo y añadió: «Debemos tener una gama de colores opuesta a la competencia que es Raunder».

### Qué se decidió y por qué

Se observó su identidad roja/blanca y se recomendó verde petróleo, marfil, pizarra y menta. Se descartaron las direcciones roja y naranja propuestas inicialmente. La elección final queda abierta.

### Qué se hizo

Se mostraron tres maquetas conceptuales y se ajustó la editorial a petróleo/marfil en móvil y escritorio. Se creó DISENO.md y se actualizaron los puntos de entrada para Claude. Se documentó también el fallo pendiente del CI 83 tras inspeccionar su artefacto.

### Qué salió mal / qué se aprendió

Las primeras maquetas añadían barras de aura y una confirmación global de ficha que no corresponden al modelo. Se corrigieron en la propuesta revisada. Las imágenes deben revisarse contra la funcionalidad real antes de convertirlas en código.

### Estado y próximos pasos

El fundador no se mostró convencido con petróleo/marfil y pidió más garra. Se mostró después azul noche/amarillo oro con tipografía deportiva y fotografía de entrenamientos; es la recomendación actual, pendiente de elección. Ningún cambio gráfico desplegado. Desarrollo en propuesta #8 pendiente de E2E/axe completo; no se declara terminado.

---

## Sesión — 3 de octubre de 2026 — revisión del lenguaje visual

### Qué se pidió / qué idea surgió

El fundador valora mejor los colores, pero el diseño le parece «muy pobre y hecho por IA».

### Qué se decidió y por qué

Conservar azul noche/amarillo oro como base y explorar otra composición inspirada en carteles de veladas. No interpretar el comentario como aprobación del diseño.

### Qué se hizo

Se mostró una pantalla conceptual de veladas en escritorio y móvil, con listados editoriales, fechas visibles y motivos de cuerdas del ring. Se documentó en DISENO.md y APORTACIONES-CODEX.md.

### Qué salió mal / qué se aprendió

La composición anterior se percibió genérica pese al cambio de paleta. Los colores solos no dan identidad: tipografía, composición y detalles necesitan un criterio coherente.

### Estado y próximos pasos

Pendiente de elección. Extender y probar el sistema en pantallas funcionales, con representación de todas las disciplinas. Sin cambios visuales desplegados.

---

## Sesión — 3 de octubre de 2026 — referencias y color oficial

### Qué se pidió / qué idea surgió

El fundador considera Raunder más llamativa y juvenil, aporta quince sitios de referencia y decide: «He decidido que el color oficial de la aplicación será este #be33f5».

### Qué se decidió y por qué

Registrar #BE33F5 como decisión vigente. Sustituye azul/amarillo y petróleo/marfil. Mantener personalidad joven y de comunidad con legibilidad para todos.

### Qué se hizo

Se consultaron páginas públicas de los recursos, con límites documentados; se observaron ejemplos deportivos en Landbook, incluida la captura de Off-Field. Se mostró una portada conceptual violeta de comunidad en móvil y escritorio. CLAUDE.md, DISENO.md, IDEAS.md y APORTACIONES-CODEX.md registran la elección y sus límites.

### Qué salió mal / qué se aprendió

No todas las bibliotecas son accesibles sin cuenta o desde el lector; no declarar revisión profunda donde solo se obtuvo el índice. El blanco sobre el violeta elegido da aproximadamente 4,22:1: para textos pequeños de botones se propone casi negro.

### Estado y próximos pasos

Color aprobado, diseño sin elegir. No se modifica la demo. Contrastar futuras interacciones de maquetas con funcionalidades reales y comprobar accesibilidad en CSS.

---

## Sesión — 3 de octubre de 2026 — identidad y personalización

### Qué se pidió / qué idea surgió
Aplicar a GitHub y a la demo los diseños aprobados y documentarlos para Claude.

### Qué se decidió y por qué
Violeta oficial #BE33F5, glow y bordes redondeados; foto y banner elegidos por sus titulares para todos los tipos de perfil. Nivel y graduación por disciplina para representar al deportista sin confundir declaración con verificación.

### Qué se hizo
CSS adaptable, portada de comunidad, editor e imágenes persistentes en PostgreSQL, directorios de promotores/federaciones y permisos de titular/moderación; migración aditiva, privacidad y exportación. 339 pruebas unitarias y build de producción correctos; prueba E2E nueva incorporada al CI.

### Qué salió mal / qué se aprendió
No se pudo instalar PostgreSQL por las restricciones del entorno; la validación completa se realiza en CI con PostgreSQL 16. Se corrigió la conversión de Buffer a Uint8Array para Prisma y la ausencia de un mensaje de error detectada por los tests.

### Estado y próximos pasos
Implementación preparada; comprobar CI, integrar y observar el despliegue real antes de afirmar que la demo está actualizada. Ver el PR para el resultado final.

---

## Sesión — 3 de octubre de 2026 — publicación del diseño aprobado

### Qué se pidió / qué idea surgió
El fundador indicó que todavía no veía los cambios en Render.

### Qué se decidió y por qué
Completar la validación y desplegar en la rama real de Render, conservando los cambios simultáneos de categorías, calendario y comunicación inclusiva.

### Qué se hizo
PR #12 integrada (8a861e7), CI #111 correcto: migraciones, esquema, tipos, mapa, 339 pruebas unitarias, build, flujos completos y accesibilidad. Se comprobó en el navegador público la portada nueva, el listado exacto del fundador y la ficha de Sergio Demo Molina. Se documentaron rutas de edición y permisos en APORTACIONES-CODEX.md.

### Qué salió mal / qué se aprendió
Hubo conflictos con commits simultáneos, que se combinaron preservando ambos trabajos. Se ajustó la prueba del sello de gimnasio a su ubicación nueva y se corrigió la espera del botón de reclamación. La petición de integración agotó su tiempo de respuesta, pero GitHub la completó; se verificó su estado antes de actuar de nuevo. La imagen de portada tardó en cargar inicialmente, pero se comprobó su archivo y su aparición final.

### Estado y próximos pasos
Diseño y perfiles publicados y observados en Render. Los titulares pueden subir sus propias fotos y banners. No se borraron los datos existentes.

---

## Plantilla para nuevas entradas

```
## Sesión N — fecha — título corto

### Qué se pidió / qué idea surgió
(con las palabras del fundador cuando sea posible)

### Qué se decidió y por qué
(alternativas descartadas incluidas)

### Qué se hizo
(cambios, commits)

### Qué salió mal / qué se aprendió
(y se copia lo importante a LECCIONES.md)

### Estado y próximos pasos
```

## Sesión 4 — 3 de octubre de 2026 — Divisiones deportivas por edad y reglamento

### Qué se pidió / qué idea surgió

El fundador señaló: «dentro de la disciplina de boxeo, en especial en el campo amateur hay infinidad de categorías desde schoolboys hasta élite […] informaros bien y aplicarlo correctamente».

### Qué se decidió y por qué

Investigar reglamentos primarios antes de completar listas; almacenar una división federativa versionada que incluya edad, categoría masculina/femenina y modalidad cuando corresponda. Separar la división actual de la ficha y la propia de cada combate, sin reclasificar datos anteriores. Una división desconocida sigue siendo una declaración incompleta. No extrapolar los pesos adultos masculinos a menores o mujeres ni tratar todas las federaciones como si calculasen la edad igual.

### Qué se hizo

Se leyeron la circular RFEBoxeo 2026, IFMA v3.057, WAKO revisión 3, comunicación de edades IMMAF 2026 e IBJJF 6.1. Boxeo incorpora siete grupos, pesos específicos masculinos/femeninos, y benjamín/prebenjamín formativos sin combate. IFMA incorpora todos los grupos de su tabla; WAKO separa ring/tatami y K-1 recibe solo ring. IMMAF e IBJJF incorporan edades comprobadas; sus pesos quedan explícitamente pendientes del catálogo completo vigente.

Se añadieron `divisionId` en ficha/combate, migración aditiva y catálogo con fuentes. Se aplican selección y validación conjunta, guardas de edad de ambos participantes, conservación histórica, filtro/paginación, ránking por categoría del combate y descarga de datos. La categoría actual del récord se etiqueta aparte del historial agregado. Se añadió un recorrido E2E y pruebas de límites normativos. Diseño visual sin cambios; documentación técnica, diario, ideas y lecciones actualizados.

### Qué salió mal / qué se aprendió

El PDF antiguo de IMMAF seguía enlazado pero el cálculo juvenil cambió para 2026: se encontraron y probaron los años de la comunicación posterior, con excepción Youth A. Un fragmento superpuesto de la circular de pesos RFE no se convirtió en una categoría extra. Las primeras pruebas nuevas esperaban textos y nombres accesibles incorrectos; se corrigieron contra la pantalla real. El primer recorrido completo detectó dos expectativas antiguas del filtro: ahora hay una división adicional y las tarjetas explican que la edad anterior está sin confirmar. Se conserva esa validación con sus nuevos datos.

Esta vez se pudo instalar y ejecutar todo localmente usando el permiso de red explícito. PostgreSQL se extrajo en el área de trabajo, sin instalar paquetes del sistema ni modificar una base existente. Durante el bloque llegaron documentos nuevos a la rama de calendario y a la principal: se conservan al integrar el trabajo en la rama independiente.

### Estado y próximos pasos

Validación local final aprobada: migraciones desde base vacía y paridad, tipos, mapa, 327 unitarias, compilación, 289 comprobaciones E2E (18 del nuevo recorrido de categorías) y axe con 0 incumplimientos, 0 graves o críticos. Comprobada la ejecución real de los casos nuevos en el log. Propuesta preparada contra la rama principal, conservando #8/#9 y las actualizaciones de documentación; integración y demo pendientes. Pendientes explícitos: pesos IMMAF/IBJJF completos, modalidades/requisitos/licencias, política de menores y pruebas con personas. Detalle de fuentes y límites en `DISENO-PESOS.md`.

## Sesión 5 — 3 de octubre de 2026 — Comunicación inclusiva y ámbito nacional

### Qué se pidió / qué idea surgió

Petición urgente del fundador: «hay varios textos en la aplicación que hacen saber que estamos más centrados en Madrid y que nuestra prioridad es el boxeo. Aunque esto sea así, no podemos dar a entender tal cosa porque gente de otras ciudades y de otras disciplinas se pueden sentir excluidas». Pidió continuar el trabajo.

### Qué se decidió y por qué

Las prioridades operativas internas no se trasladan a mensajes públicos ni a filtros iniciales. Revisar los datos visibles además del texto: una portada que diga toda España pero solo consulte Madrid conservaría el problema. Mostrar las seis disciplinas admitidas con igual énfasis y orden alfabético, niveles amateur/profesional y provincias elegidas por la persona. Conservar ubicaciones reales, normas deportivas y zona horaria técnica; no afirmar una cobertura de datos inexistente.

### Qué se hizo

Se eliminaron las referencias de prioridad de portada, ayuda y README; se completaron metadatos y se neutralizó el ejemplo del buscador. Portada y contadores consultan todas las provincias y niveles. El ránking empieza con todas las disciplinas, conserva categorías/posiciones independientes e incluye disciplina en las claves de agregación y de pantalla. La portada identifica disciplina/nivel de cada actuación y evento. Las altas de fichas y veladas parten sin provincia, ciudad o disciplina supuestas y el servidor rechaza elecciones ausentes o inválidas. La edición conserva los datos propios. El calendario explica la hora peninsular sin cambiar su comportamiento.

Se documentó la norma vigente en CLAUDE, arquitectura, ideas, lecciones y relevo, conservando las entradas históricas. Los guiones anteriores eligen sus datos ficticios explícitamente. Se añadieron 18 comprobaciones E2E con seis disciplinas, provincias distintas, amateur/profesional, una persona con aura en dos disciplinas, filtros y altas fuera de Madrid. Se mantiene el trabajo de categorías por edad de la propuesta #10.

### Qué salió mal / qué se aprendió

La primera batería completa detectó que el guion de una ficha provisional sin provincia dependía del antiguo valor Madrid al registrar su combate. Ahora el guion elige la provincia explícitamente. La comprobación de tipos detectó una importación aún necesaria para editar eventos; se conservó. La inspección de los guiones detectó dos importaciones faltantes del nuevo ayudante y se corrigieron antes de continuar. No se sustituyeron los valores neutrales de la aplicación para acomodar las pruebas.

### Estado y próximos pasos

Validación local final aprobada: tipos, mapa actualizado y comprobado, 327 unitarias, compilación de producción, 307 comprobaciones E2E (18 nuevas) y axe con 0 incumplimientos, 0 graves o críticos. Propuesta contra la rama principal que conserva #10 y sus antecedentes; integración y despliegue pendientes. Se comprueba además el CI de la propuesta antes de cerrar la sesión.

## Sesión 6 — 3 de octubre de 2026 — Publicación efectiva de la demo

### Qué se pidió / qué idea surgió

El fundador pidió: «Actualiza ya la página en GitHub para que pueda ver la demo actualizada con todos estos cambios».

### Qué se decidió y por qué

Integrar la propuesta #11, ya validada, en la rama que usa Render. Incluye el trabajo de las propuestas anteriores, por lo que no se requiere integrarlas una a una. Comprobar la dirección pública después de la actualización automática; no dar por publicado un cambio solo por haber fusionado el código.

### Qué se hizo

Se comprobó CI aprobado y cabeza exacta antes de integrar #11 mediante un merge normal, commit `7580902d63f4deec42c41f1cb29c5b913e009451`. La rama principal conserva el árbol probado y los documentos anteriores. Render sirve la demo actualizada. Peticiones HTTPS verificadas a portada, ránking, ayuda y salud devuelven 200: título nacional, disciplinas/niveles/provincias sin filtro inicial, ayuda inclusiva con divisiones por edad y base conectada. También pasa el CI de integración, ejecución `37127024537`. Se añade el enlace directo a la demo al README y se actualizan demo, arquitectura, ideas y relevo.

### Qué salió mal / qué se aprendió

La primera consulta seguía mostrando la versión antigua mientras Render construía la nueva. Se esperó y se confirmó el contenido público real. Chromium no confiaba en la CA del proxy del entorno; no se desactivó la comprobación TLS. La comprobación pública se realizó mediante HTTPS con la confianza del entorno, conservando las pruebas de navegador ya aprobadas en CI.

### Estado y próximos pasos

Los cambios funcionales y de comunicación están integrados y visibles en <https://ring-espana-demo.onrender.com/>. CI de propuesta e integración aprobado. Se conserva la base de la demo: el arranque solo añade migraciones y carga ejemplos si está vacía. Pendientes anteriores fuera de este bloque: catálogo completo de pesos IMMAF/IBJJF, decisiones sobre menores, pruebas con personas y aplicación del diseño visual elegido.

## 3 de octubre de 2026 — Trayectoria, respaldo opcional, aura y menú por actividades

### Qué se pidió / qué idea surgió

El fundador pidió configurar el modelo aceptado de verificación y aura. Precisó que el rival puede negarse por un pique, que un campeón autonómico o nacional debe poder reconocer su trayectoria anterior y que entrenadores/federaciones son opcionales al iniciar la aplicación. Reiteró que una federación aporta más aura. Después pidió usar como referencia la distribución del menú de Raunder, con una captura, y continuar. Pidió conservar el trabajo de diseño de ChatGPT Work.

### Qué se decidió y por qué

Permitir declaraciones honestas desde el primer día, identificadas por su respaldo. Rival solicita revisión motivada sin veto automático; solo moderación suspende. Separar el récord de los puntos de reputación. Aura = trayectoria + respaldo opcional + comunidad, por categoría histórica; no inferir títulos ni avales de una biografía o un perfil visual. Un título por categoría aporta el mayor valor; mejorar su respaldo sustituye el anterior. Escala inicial de Codex 20/50/80, bonificaciones 25/50/100 %, centralizada y revisable con datos reales: el fundador aprobó el modelo, no confirmó expresamente esas cifras. Se conserva el clic y no se adelanta premium ni una clasificación deportiva tipo Elo.

Menú por actividades con cuatro grupos, permisos reales y hasta cinco enlaces por grupo; diálogo nativo accesible. Las funciones de sparring, formación o reservas de la captura no se anuncian como implementadas. Se conserva el violeta, portada y personalización de perfiles.

### Qué se hizo

Se partió de #12 y se incorporó sin sobrescribir la documentación posterior de Work (`6670b35`). Migración aditiva con títulos, acreditaciones y metadatos de respaldo. Gestión de trayectoria, correcciones, retirada reversible y revisión; cola de hechos y acreditaciones concedidas por moderación. Versiones y bloqueos para duplicados, límites y concurrencia; fuente/nota para respaldos, sin autoaval ni permisos fuera de disciplina. Ranking y fichas con desglose y etiquetas; cancelaciones/suspensiones excluidas. Cambios de datos/fuentes invalidan respaldos. Exportación, eliminación y anonimización incluyen los nuevos datos y sus copias en el historial.

El menú funciona en móvil/escritorio, con Escape, foco, cierre al navegar/salir y accesos de cuenta, perfiles asignados y moderación. Se actualizan ayuda, mensajes, correos, privacidad, arquitectura, desarrollo, ideas, diseño y guiones. El mapa ahora identifica la nueva guarda y las llamadas de moderación con ruta.

### Qué salió mal / qué se aprendió

TypeScript detectó una comparación ya inalcanzable y campos no anulables al limpiar una acreditación; se corrigieron. Los guiones nuevos tenían selectores relativos anidados, un desplegable ya abierto, una velada que no era enlace en Mi ficha y frases de confirmación incorrectas. Otro guion sumaba categorías diferentes: se declaró el peso del combate. La regresión conservaba expectativas de la confirmación obligatoria; se actualizaron exigiendo las nuevas reglas. Un aviso JSX necesitó permanecer dentro del formulario. La revisión de privacidad encontró copias de datos de quien respalda en auditorías y su prueba exigió limpiar antes del apunte de eliminación; ambas cosas se corrigieron. Los detalles y reglas quedan en LECCIONES.

### Estado y próximos pasos

Implementación terminada en rama; tipos, migraciones/paridad, mapa, compilación y 393 unitarias aprobados. La batería local completa pasó 364 comprobaciones de navegador; se repitieron las 26 de trayectoria tras añadir una de privacidad (365 en la batería actual). Axe final: 0 incumplimientos, 0 graves o críticos. Se comprobará CI del árbol final antes de integrar/publicar la demo. Los cambios normativos, menores y pruebas con personas que estaban pendientes siguen en sus documentos.

### Resultado publicado

CI #131 aprobado con 393 unitarias, 365 comprobaciones E2E, migraciones/paridad, tipos, mapa, build y 37 pantallas axe sin incumplimientos. Integrada #14 en `0c3fde6`, con el mismo árbol probado. Render muestra el nuevo acceso Menú y la fórmula y explicación de aura; portada, ranking, ayuda y salud responden 200. Se conserva la base y el diseño publicado de Work. Se documenta el solapamiento con la propuesta móvil #13, que sigue abierta. Una frase de ayuda se precisa para distinguir el voto por combate del aura total con títulos.

## 3 de octubre de 2026 — Pulido funcional antes del rediseño

### Qué se pidió / qué idea surgió

El fundador preguntó qué queda y pidió «pulamos la aplicación hasta el más mínimo detalle, luego al final volveremos al diseño […] se ve muy desorganizado y saturado». El aspecto actual deja de considerarse definitivo; este bloque se centra en funciones, errores, claridad y el relevo entre entornos.

### Qué se decidió y por qué

Revalidar pendientes con el código actual antes de repetir tareas resueltas. Cerrar cortes de registros, decisiones que pisan datos cambiados y etiquetas que no reflejan el respaldo efectivo. Conservar el diseño provisional y los datos de la demo. Las categorías deportivas incompletas, herramientas de entidades, servicio real, menores/privacidad y pruebas con personas se mantienen en una hoja vigente, sin declararlos resueltos por una batería verde.

### Qué se hizo

Paginación de todas las colas de moderación, respaldos, acreditaciones e historial: ventanas de 50, totales reales, orden estable y páginas independientes. Búsqueda de acreditaciones, estado vacío y limpieza del filtro. Las acciones conservan consulta/página y respuesta visible con enlace a su sección; `returnTo` limita el destino. La revisión muestra categoría y grado efectivo. La última fuente de cada título se obtiene sin que las solicitudes de otro la desplacen.

Huella del resultado al verificar y condición sobre los hechos leídos; reserva de un aviso pendiente antes de actuar sobre el dato; edición de evidencia condicionada a estado/resultado/fuente/respaldo. Opciones desconocidas dejan de interpretarse como decisiones destructivas. Se actualizan auditoría, traslado y mapa; PULIDO-FUNCIONAL reúne lo que queda. No hay migración ni cambio de escala de aura.

### Qué salió mal / qué se aprendió

El primer usuario sintético generó un correo con tilde y la validación nativa impidió enviar. Unos checks leían una fila antes de completar su actualización; se esperan los controles finales. Next perdió el fragmento de las redirecciones: se conserva como sección validada en consulta y enlace tras el mensaje. TypeScript detectó un diccionario opcional pasado a lookup; se añade el caso vacío. Los datos históricos de volumen usan fechas relativas para no depender de evitar la limpieza. Las reglas concretas se registran en LECCIONES.

### Estado y próximos pasos

405 unitarias, compilación y 26 comprobaciones nuevas de volumen/decisiones aprobadas. La regresión completa, axe y CI se comprueban antes de integrar; publicación efectiva se anota al final de este bloque. El rediseño sigue aplazado y se retomará con un briefing al final de la fase funcional. La propuesta móvil #13 sigue abierta: conciliar layout/menú antes de incorporarla.


### Cierre de validación local

El árbol final aprueba 406 unitarias y compilación de producción. Recorridos repetidos sobre el build final: 28 checks nuevos de volumen/integridad, 26 de trayectoria y 49 de usabilidad; axe en 37 pantallas, 0 incumplimientos. La regresión anterior pasó 389 de 391 y detectó dos mensajes de organizador bloqueados por validación nativa; los recorridos afectados pasan tras corregirlo. CI ejecutará la batería completa final (393 comprobaciones) antes de integrar. No se presenta la pasada anterior como completamente verde.

También se protege la restauración de títulos: solo procede para uno excluido y no puede retirar el respaldo de uno activo. La prueba de volumen ahora consulta los totales y el orden reales antes de comprobar la tercera página: funciona también al reutilizar la base con datos de otros guiones. La publicación y su comprobación pública se registran después de CI.


### Integración comprobada

Integrada [PR #15](https://github.com/romppao/MiClaude/pull/15) en `claude/ring-espana-mvp`, merge `0bf5b9399bb9f06f62a0e4fdf5e6c582c27a5634`. [CI #137](https://github.com/romppao/MiClaude/actions/runs/37158841984) aprueba migraciones/paridad, tipos, mapa, 406 unitarias, compilación, 393 comprobaciones de navegador y axe en 37 pantallas: 0 incumplimientos, 0 graves o críticos. Árbol probado e integrado idéntico: `812da937097a5362123cbb3bd8b73c9b3008f0b7`; head revisado `cc2e17987f56037f88b574f1b8740ab16c4fd247`, base `dbecb53281f9c265081749acbbb71fd232c486df`, ambos comprobados antes de fusionar. La prueba completa final supera también los dos recorridos que habían fallado en la regresión local anterior.


### Comprobación pública del primer despliegue

Render sirve el pulido #15: portada, ayuda, ránking y `/salud` responden 200 por HTTPS con verificación TLS. El bundle compartido cambia de `layout-c9e2e3184aacfcf6.js` a `layout-febc489e998a92be.js` y contiene sección, foco y enlace de vuelta; SHA-256 `ba2162b7780bac81eed6ff191289b1e7a6acc11b5fb2ac6d8a2a47ab60f1c473`. Es una comprobación de despliegue, no una prueba autenticada de las colas públicas; esas acciones se recorrieron en local/CI. Los datos de volumen no se subieron a Render.

La comprobación de acceso privado descubrió un detalle adicional: `/respaldar` pedía sesión sin recordar la ruta de vuelta, al contrario de las páginas de moderación. Se transmite la ruta a través de las guardas de sesión verificada y respaldo, sin conceder permisos. Dos checks nuevos comprueban el mensaje/destino y el regreso real tras entrar con una cuenta autorizada; tipos, unitarias, build, navegador y CI se vuelven a comprobar por este cambio de código.

Validación local del retorno: 406 unitarias, build de producción y 30 checks del guion de pulido aprobados; el guion también mide axe sobre las colas pobladas sin incumplimientos. CI comprobará el árbol completo con 395 comprobaciones de navegador antes de integrar esta continuación.


### Validación e integración final del retorno

[PR #16](https://github.com/romppao/MiClaude/pull/16) integrada con merge `d9fba959cfe79da379adab9f42237c7b2d73322c`. [CI #142](https://github.com/romppao/MiClaude/actions/runs/37159831793) aprueba migraciones/paridad, tipos, mapa, 406 unitarias, compilación, **395 comprobaciones de navegador** y axe en **37 pantallas, 0 incumplimientos**. Árbol comprobado e integrado `ae120c766bfc5761298bd9fa835e62c93a31915c`. Antes de fusionar se verificaron el head `0e094d62c95ee6e320f30280cec49cb8731ff823` y la base `0bf5b9399bb9f06f62a0e4fdf5e6c582c27a5634`. Las dos comprobaciones nuevas de acceso completan las 393 de #15; no se omiten ni sustituyen recorridos.


### Demo final comprobada

El 3 de octubre a las 23:03 UTC, Render sirve también #16: `/respaldar` sin sesión lleva a `/entrar?next=%2Frespaldar&problema=sin_sesion`; portada, ayuda y salud responden 200 por HTTPS con verificación TLS. El regreso autenticado se recorrió en navegador local y en CI; no se crearon cuentas ni fixtures en la demo para esta comprobación. Los datos existentes se conservan. Esta continuación de cierre modifica solo documentación.

Siguiente trabajo: resolver solapamientos del historial/registro inicial y catálogos IMMAF/IBJJF; herramientas de entidades; errores y recorridos con personas; preparación de correo, copias y privacidad/menores. No se declaran cerrados por las pruebas automatizadas. Diseño provisional, a retomar al final mediante briefing con el fundador; #13 sigue abierta, sin sobrescribir el trabajo de Work.


## 6 de octubre de 2026 — Revisión del trabajo de Codex y limpieza de enlaces muertos

### Qué se pidió
Tras una semana sin créditos, el fundador pidió comprobar todo lo que hicieron Codex y otros asistentes y dar una opinión honesta (resultado abajo), y recordó su regla: «no puede haber botones ni enlaces inservibles; todo lo que sea inservible, mejor quítalo».

### Qué se comprobó
Ejecutado por Claude desde cero con base de datos vacía: tipos, 406 unitarias, compilación, 16 guiones de navegador y accesibilidad, todo correcto (coincide con el CI #144). Valoración: trabajo serio y bien documentado; defectos que ninguna prueba cubría: cabecera de escritorio con los enlaces apilados, enlaces que no hacen nada y texto técnico en la ficha.

### Qué se hizo
- **Cabecera de escritorio y tableta:** los cinco enlaces principales ya no se encogen ni se apilan; la cuenta y el buscador pasan a una segunda línea si no caben (`globals.css`, comprobado a 1440, 1024, 900, 800 y 700 px).
- **Enlaces muertos:** «Quitar filtros» ya solo aparece cuando hay filtros (y se llama «Quitar todos los filtros»); el aviso de ránking vacío solo ofrece «Quitar el nivel, la zona y el periodo» si la consulta es más estrecha que la general.
- **Auditoría automática** `tests/e2e/enlaces.mjs` (ahora dentro de `test:e2e`): recorre la aplicación como sin cuenta, aficionado, peleador, organizador y moderador y falla si hay enlaces vacíos o a «#», anclas inexistentes, enlaces que llevan a la misma pantalla, botones sueltos sin formulario, elementos con cursor de mano que no son enlaces ni botones, o destinos que dan error.
- **Textos:** «Grupo de edad y categoría sin confirmar» pasa a «Edad y categoría sin indicar» y la opción del selector a «Prefiero indicarlo más tarde».

### Qué salió mal
Dos enlaces muertos reales llevaban semanas en la aplicación (uno de ellos introducido en el bloque de Codex) porque ninguna prueba medía «¿este enlace hace algo?». El fallo de «seguir» que describió el fundador no se pudo reproducir: el enlace «Entra para seguir a este peleador» funciona sin cuenta; queda pendiente de que el fundador indique en qué pantalla y papel le pasó.

### Estado y próximos pasos
Pendiente: seguir puliendo funcionalidades según los fallos que anote el fundador; después, escalabilidad (fotos fuera de la base de datos, caché de páginas públicas, base de datos gestionada, cola de correos, prueba de carga); paneles A/B/C al registrarse (decisión de formato del fundador); cerrar propuestas de Dependabot (saltos mayores que fallan el CI) y la #9 duplicada.


## 6 de octubre de 2026 (tarde) — Probar como personas reales, desde el móvil

### Qué se pidió
«Cuando tú compruebes cosas de la aplicación, hazlo como si fueras uno de los usuarios […] como si fueses peleador, o un usuario, o una promotora, o una federación; un escenario ficticio de casos de uso de cada tipo de usuario» y «nos tenemos que enfocar al mil por mil en cómo funciona la aplicación en dispositivos móviles, tanto iOS como Android […] el objetivo es publicarla en App Store o Google Play». Además: documentar todo para el resto de asistentes (Antigravity, Codex, Open Code, GitHub Copilot).

### Qué se hizo
- **Colaboración:** `docs/EQUIPO.md` (protocolo común, ramas por asistente, plantilla de relevo), `AGENTS.md` y `.github/copilot-instructions.md` apuntando a él, `docs/APORTACIONES-CLAUDE.md` (mi registro), enlace en `CLAUDE.md` y en `docs/README.md`.
- **Móvil:** `docs/MOVIL.md` (reglas, límites de las pruebas y camino a las tiendas) y `tests/e2e/movil.mjs` (iPhone SE, iPhone 14, Pixel 7 y Android de 360 px; cuatro papeles).
- **Escenarios por persona:** `tests/e2e/escenarios.mjs` (visitante, aficionado, peleador, promotora, federación) con capturas.
- **Correcciones** (detalle en `APORTACIONES-CLAUDE.md`): cabecera de escritorio, enlaces muertos, índice de «Mi ficha», formulario de combate más corto, margen para la barra fija, zonas táctiles de 44 px, letra de 16 px.

### Qué salió mal
La primera versión de mis auditorías daba falsos positivos (botones del menú que abren un diálogo; enlaces de una frase) y hubo que afinarla. El fallo de «seguir» que describió el fundador no se pudo reproducir como error: el enlace funcionaba, pero era una línea de texto de 26 px que no parecía pulsable.

### Estado y próximos pasos
Pendiente: PWA (manifiesto, iconos, página sin conexión), pruebas en iPhone y Android reales, conciliar la PR #13 (móvil) con `NavigationMenu`, paneles A/B/C al registrarse, escalabilidad antes del diseño, más personas en los escenarios.


## 6 de octubre de 2026 (noche) — Claude, líder técnico del equipo

**Pedido por el fundador:** «te pongo a ti como el líder del equipo […] idealices el plan, la arquitectura y los métodos a seguir, dando también la posibilidad de que las otras herramientas debatan y puedan sacar una mejor opinión […] las demás son las que ejecutan las instrucciones […] para ahorrar tokens y delegar funciones […] pauta por pauta, detalle a detalle, para que no se vayan por las ramas.»
**Qué se hizo:** gobierno del equipo (`EQUIPO.md`, `decisiones/ADR-001`), cómo se discrepa con evidencia (`decisiones/README.md`, plantilla de propuestas RFC), lista de revisión de PR (`REVISION.md`), **plan maestro** (`PLAN.md`: principios de arquitectura, fases F0–F5, definición de «hecho») y **12 fichas de tarea** exactas (`tareas/T-001…T-012`): conciliar la PR del móvil, Dependabot, PWA, imágenes fuera de la base de datos, caché de lecturas públicas, índices, prueba de carga, cola de correos, ampliar escenarios, observabilidad, registro por tres paneles A/B/C (con las palabras del fundador) y base de datos gestionada. `CLAUDE.md` y `AGENTS.md` lo recogen.
**Decisiones de Claude que el fundador puede revocar:** el acceso (`/entrar`) sigue siendo un formulario único porque las credenciales ya identifican a la persona (los tres paneles van en el registro); una federación aprobada recibe su perfil y titularidad automáticamente.
**Límites honestos:** los asistentes solo actúan cuando el fundador los lanza (no se mensajean entre sí; la comunicación es el repositorio); las sugerencias de reparto («sugerida a») se basan en lo observado de Codex y deben calibrarse con los demás; Claude puede equivocarse y sus decisiones son discutibles por RFC.


## 6 de octubre de 2026 (noche) — Rangos del equipo

**Pedido por el fundador:** designar el orden de rango entre las herramientas «bajo tu criterio y resultados que te hayan dado en una primera toma de contacto»: Claude primero; después Codex, Antigravity, GitHub Copilot y Open Code (modelos Ollama y Qwen); «es muy importante que sepas elegir cuál va a ser el segundo al que vamos a colocarle esa gran función».
**Qué se decidió:** orden 1 Claude · 2 Codex · 3 Antigravity · 4 Copilot · 5 Open Code local (`docs/RANGOS.md`, ADR-002). **Honestidad:** solo Codex tiene trabajo en el repositorio (9 PR); los puestos 3–5 son hipótesis previas, no resultados, por lo que entran en periodo de prueba con una prueba de ingreso objetiva (T-002, y T-009/T-003), puntuación por criterios y reglas de ascenso y descenso (se desciende de inmediato por afirmar algo no ejecutado). Se añaden niveles de tarea N1–N4 a las fichas. Registro de rendimiento con la primera evaluación de Codex.
**Pendiente del fundador:** decir qué modelo ejecuta cada herramienta y si Codex tiene PostgreSQL y navegador locales; el orden de 3–5 puede cambiar mucho con eso.

**Corrección posterior (mismo día):** el fundador aclaró que el orden de los puestos 3–5 debe decidirlo Claude **cuando tenga pruebas** del trabajo de las otras herramientas: «ahora todavía no hace falta». Se retira el orden a priori de `RANGOS.md` y `ADR-002`; solo quedan Claude (1) y Codex (2, con evidencia); Antigravity, Copilot y Open Code, sin ordenar y en periodo de prueba.


## 6 de octubre de 2026 (noche) — Prueba de ingreso de los asistentes

**Pedido por el fundador:** un documento que **exija a cada herramienta una aportación a máximo nivel y también a nivel medio** (bajo consumo de tokens), que les **pregunte primero qué es lo que mejor se les da** y después les ponga una **prueba común de exigencia máxima**; el fundador vio resultados buenos de diseño frontend de Antigravity con *skills* instaladas y quiere comparar «de verdad».
**Qué se hizo:** `docs/PRUEBA-DE-INGRESO.md` (protocolo y reglas; Parte 0 autodeclaración, Parte 1 especialidad a elección —con propuesta de diseño aislada para quien la elija—, Parte 2 prueba común máxima = T-011, Parte 3 prueba común media = T-003, Parte 4 revisión a ciegas de un PR con 12 defectos plantados; puntuación de 100 puntos con calibración y eficiencia), plantilla de autodeclaración, tabla `docs/ingreso/RESULTADOS.md`, `revision-ciega/CAMBIO.md` y su clave. **Límite honesto:** la clave de la revisión a ciegas está en el repositorio (no hay forma de ocultarla en un repositorio compartido); se apoya en la norma de no leerla, y el fundador o Claude pueden contrastar con el historial de acceso si hay dudas. Las pruebas comunes generan trabajo duplicado a propósito; solo se integra lo mejor.


## 6 de octubre de 2026 (noche) — Corrección de lo que Claude señaló de Codex y del CI

**Pedido por el fundador:** «también corrige todo lo que me dijiste que hizo mal Codex, en caso de que no lo hayas hecho». Se repasó punto por punto la lista de la revisión (`APORTACIONES-CLAUDE.md`).
**Estado de cada punto:** (1) cabecera de escritorio, (2) barra inferior que tapaba texto y (3) «Quitar filtros» ya estaban corregidos antes; (4) textos técnicos: quedaban «división sin confirmar» en dos pantallas y en la ayuda del ránking → reescritos en lenguaje llano; (6) PRs: cerrados #1–#7 (Dependabot, saltos mayores con el CI en rojo) y #9 (ya integrado entero), y `dependabot.yml` ya no propone saltos de versión mayor; #13 cerrado tras portar lo útil (barra móvil con iconos y página activa, perfil adaptable) sin su `HeaderMenu`, que duplicaba el menú; (7) `CLAUDE.md` ya no dice a la vez que el diseño está aprobado y pendiente (queda: color decidido y aplicado, resto provisional); (8) paneles A/B/C: hechos (T-011, abajo); «seguir» sin respuesta: ya corregido antes.
**Paneles A/B/C (T-011), hecho por Claude:** `/registro` muestra tres paneles (Usuario · Peleador · Promotora o federación) y cada uno lleva a su formulario; sin desplegable ni frases antiguas. El panel C crea la cuenta y la solicitud en la misma transacción (migración aditiva `OrganizerRequest.kind` y `website`). Al aprobar una federación se crea su perfil en el directorio con la solicitante como titular. Función única de aterrizaje por papel (`src/lib/accounts/landing.ts`): peleador → Mi ficha, organizadora → Mis veladas, moderación → Moderación. Decisión de Claude que el fundador puede revocar: `/entrar` sigue siendo un único formulario.
**Fallo del CI (run 150):** la auditoría móvil encontró enlaces de 26 px («Página anterior/siguiente») y de 43 px (nombres largos en tablas) que mi base local, casi vacía, no mostraba. Corregido (ver LECCIONES).
**Imágenes (punto 5), solo en parte:** la ruta sirve ahora con ETag y responde 304 sin leer los bytes de la base; **sigue pendiente** sacarlas de PostgreSQL (T-004 parte 2), que necesita que el fundador elija proveedor.
**Estado y próximos pasos:** pendiente de confirmar el CI de esta tanda; después fase 1 del plan (T-001, T-002, T-009) y, cuando el fundador lo decida, T-004 parte 2 (proveedor de almacenamiento) y el resto de F2.


## 6 de octubre de 2026 (noche, 2) — Fase 1 del plan: cierre y escenarios por persona

**Pedido por el fundador:** «he continuado con el plan, perfecto, continúa».
**Qué se hizo:** el CI de `490cfd2` (paneles A/B/C) quedó en verde. Como Claude hizo T-001, T-002 y T-011, **la prueba de ingreso dejaba de ser válida** (usaba T-011 como prueba común máxima y T-002 como tarea de entrada de nivel 1): se sustituyen por **T-005** (caché de lecturas públicas) y una tarea nueva **T-013** (todo enlace que abre otra pestaña lo avisa; hay un caso real sin avisar en `SelectorCategoria.tsx`). Actualizados `PRUEBA-DE-INGRESO.md`, `RANGOS.md`, `PLAN.md` y la plantilla de autodeclaración. Se pasó `escenarios.mjs` con datos de ejemplo: las cinco personas (visitante, aficionado, peleador, promotora, federación) completan sus recorridos; el escenario de la federación usa ahora el panel «Promotora o federación» de punta a punta (solicitud, aprobación con tipo y web visibles, perfil creado sin pasos manuales). Al mirar las capturas se vio que los tres paneles **no parecían pulsables**: se añadió «Elegir esta cuenta →» dentro de cada uno.
**Qué salió mal:** mi guion buscaba el panel por el texto «Peleador», que también aparece en la descripción del panel «Usuario» («Sigue a peleadores…»): se localiza por la dirección del enlace. Lección: localizar enlaces por destino, no por una palabra que puede repetirse.
**Estado y próximos pasos:** F1 completa salvo T-009 (más escenarios) y T-013; ambas están para la prueba de ingreso de los otros asistentes. Siguen necesitando al fundador: proveedor de almacenamiento de imágenes (T-004 parte 2), base de datos gestionada (T-012), correo (T-008), errores (T-010), dominio y menores.


## 6 de octubre de 2026 (noche, 3) — Proveedores de la fase 0 con el mínimo coste

**Pedido por el fundador:** «no tengo ni idea de qué hacer en esos cinco puntos […] quiero utilizar el mínimo capital posible […] herramientas gratuitas o de mínimo coste, muy top, fiables, escalables y fáciles de modificar […] que lo hagas tú de la mejor manera».
**Qué se hizo:** cuatro investigaciones en paralelo (base de datos y alojamiento; imágenes; correo y errores; menores y RGPD). Resultado en [ADR-003](decisiones/ADR-003-proveedores-fase-0.md): Neon Free + copia nocturna a R2, Render (gratis para la demo, Starter de 7 $ al abrir), Cloudflare R2 (UE) para imágenes servidas por la aplicación, Resend gratis (ya programado) con dominio propio, Sentry gratis (UE) y UptimeRobot; borrador de política de menores con la edad como parámetro. Fichas T-004, T-008, T-010 y T-012 ajustadas; nueva T-014.
**Hallazgos importantes:** la base de datos gratuita de la demo en Render **caduca a los 30 días**; sin dominio propio **no se pueden enviar correos reales** (ni verificar cuentas); Vercel no vale para una aplicación que se monetice (su plan gratis es no comercial).
**Qué salió mal / límite honesto:** el entorno bloquea las páginas oficiales de los proveedores, así que **ninguna cifra se leyó en la fuente**: todas salen de resúmenes de búsqueda y hay una lista de comprobación en el ADR. Lo jurídico es un borrador que debe confirmar una persona cualificada.
**Estado y próximos pasos:** el fundador aprueba (o corrige) el ADR y responde a dos preguntas de producto sobre menores; después, T-012 (Neon y copias) es lo primero, por la caducidad de la base de la demo.
