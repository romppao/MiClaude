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
