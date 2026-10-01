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

(Se completa abajo con los resultados de la revisión independiente.)

---

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
