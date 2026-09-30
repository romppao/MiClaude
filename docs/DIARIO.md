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
