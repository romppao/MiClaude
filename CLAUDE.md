# Ring España — instrucciones para Claude

> **Equipo y prioridad móvil — 6 de octubre de 2026:** el fundador trabaja con varios asistentes (Claude, Codex, GitHub Copilot, Open Code, Antigravity): lee [docs/EQUIPO.md](docs/EQUIPO.md) y registra tu trabajo en tu `docs/APORTACIONES-<NOMBRE>.md`. **El móvil (iOS y Android) es la prioridad**, con el objetivo de publicar en App Store y Google Play: ver [docs/MOVIL.md](docs/MOVIL.md). Cero enlaces o botones muertos (`tests/e2e/enlaces.mjs`).

> **Última prioridad del fundador — 3 de octubre de 2026:** «pulamos la aplicación hasta el más mínimo detalle, luego al final volveremos al diseño […] se ve muy desorganizado y saturado». El aspecto actual es provisional, aunque se publicaran decisiones anteriores. No hacer ahora otro rediseño. Corregir funciones, datos, errores y claridad; retomar composición e identidad con el fundador al final. Pendientes vigentes y evidencias: [docs/PULIDO-FUNCIONAL.md](docs/PULIDO-FUNCIONAL.md).

> **Relevo de Codex (3 de octubre de 2026):** el diseño aprobado está integrado en PR #12 y comprobado públicamente en Render; CI #111 correcto. Color oficial #BE33F5, glow, bordes redondeados y perfiles con foto y banner propios. Lee [docs/APORTACIONES-CODEX.md](docs/APORTACIONES-CODEX.md) y [docs/DISENO.md](docs/DISENO.md) antes de continuar. Se han conservado los cambios recientes de categorías por edad, comunicación inclusiva y calendario de la rama de la demo.

Aplicación web para la comunidad de deportes de contacto de toda España: boxeo, jiu-jitsu, K-1, kickboxing, MMA y Muay Thai, amateur y profesional. El vocabulario es «peleador», no «boxeador». Stack: Next.js 15, TypeScript 5, PostgreSQL, Prisma. Contexto y decisiones en `docs/ARQUITECTURA.md`.

## Comunicación inclusiva — petición urgente del fundador, 3 de octubre de 2026

La comunicación pública no debe presentar Madrid ni el boxeo como prioridad, aunque existan prioridades operativas internas. Hablar a personas de todas las ciudades y disciplinas admitidas, con el mismo trato. Portada y ránking empiezan sin filtros de provincia, disciplina o nivel; las altas piden elegir provincia y disciplina. Los listados siguen criterios de fecha, aura u orden alfabético, sin énfasis especial en boxeo. Conservar ubicaciones reales, reglamentos específicos y zona horaria técnica. No prometer cobertura ni datos que aún no existan. Esta instrucción prevalece sobre formulaciones anteriores de «Madrid primero» o «boxeo en cabeza».

## Trayectoria, verificación y aura — decisión vigente del fundador, 3 de octubre de 2026

La verificación del rival, entrenadores y federaciones es **opcional**. El rival puede solicitar revisión motivada, pero no suspende el resultado ni su aura por sí solo; esa decisión corresponde a moderación. Se admiten títulos anteriores declarados honestamente, identificados como tales. Aura = trayectoria + respaldo opcional + comunidad; una federación acreditada aporta mayor bonificación. La escala inicial está centralizada en `src/lib/aura/trajectory.ts` y explicada en `/ayuda#aura`; no constituye una clasificación deportiva oficial. La acreditación para respaldar es independiente del perfil visual y del rol de organizador. No sumar varios respaldos del mismo hecho ni atribuir un aval a toda la carrera.

El fundador también pidió tomar como referencia la distribución del menú de Raunder, mostrando una captura. El menú se organiza por actividades: deportistas, clubes y entrenadores, promotores, cuenta y ayuda. Mantener el violeta aprobado, permisos reales y destinos funcionales. No presentar sparring, formación o reservas como funciones disponibles mientras no estén implementadas. El trabajo visual realizado en ChatGPT Work debe conservarse.

## Documentación obligatoria (petición expresa del fundador)

Todo el proceso se documenta para poder contarlo y retomarlo en el futuro. **Al terminar cada bloque de trabajo, antes de dar la sesión por cerrada:**

1. Añadir una entrada **al final** de `docs/DIARIO.md` con la plantilla que trae (qué se pidió, qué se decidió y por qué, qué se hizo, qué salió mal, estado y próximos pasos). No reescribir entradas anteriores.
2. Actualizar `docs/IDEAS.md`: ideas nuevas (con su origen: quién y cuándo las planteó), cambios de estado, ideas descartadas y por qué.
3. Añadir a `docs/LECCIONES.md` cada error o callejón sin salida con su causa real y la regla resultante.
4. Si cambia el estado técnico (modelo de datos, roles, flujos, riesgos), actualizar `docs/ARQUITECTURA.md`.

Recoger con las palabras del fundador las ideas y decisiones importantes. Ser honesto con lo que salió mal: el valor de estos documentos es que sean fiables.

## Prioridad actual: funcionalidad completa y proyecto escalable (petición expresa del fundador, 1 de octubre de 2026)

Palabras del fundador: «Ahora mismo lo que quiero es que te centres en la funcionalidad completa de la aplicación. No quiero fallas en el sistema, funcionalidades inservibles, botones que no funcionan. Que un usuario pueda entrar, entienda absolutamente todo, le funcione todo correctamente y esté todo organizado. **El diseño lo haremos más tarde.** Quiero que sea perfecta, cómoda de usar.» Y sobre la organización: «Como estamos haciendo vibe coding, es muy importante la organización y la estructura a la hora de planificar el proyecto, para que pueda ser escalable. Quiero que desde ahora cojas un buen hábito de desarrollo, documentando todo, esquematizando todas las cosas. Que haya una red clara de a dónde seguir, qué rutas tomar para hacer X cosas. En algún momento ampliaré el equipo y para eso las cosas tienen que estar muy bien organizadas: reglado, medido y estructurado.»

Reglas que se derivan, para todo el trabajo:
1. **Nada está «hecho» si no funciona de punta a punta** en un navegador real, con cada rol que pueda usarlo. Un botón, un enlace o un formulario que no hace lo que dice (o no responde con un mensaje claro) es un fallo de primera categoría.
2. **Ningún trabajo de aspecto visual** (colores, tipografías, maquetación fina) hasta que el fundador lo pida. Solo funcionalidad, claridad de lenguaje y accesibilidad.
3. **La estructura del código y de la documentación es parte del trabajo**, no un extra: cada cosa nueva va en su sitio según `docs/DESARROLLO.md` (estructura, recetas «cómo hago X», convenciones). Si no hay sitio claro para algo, se decide y se documenta antes de escribirlo.
4. **Todo cambio deja rastro**: diario, ideas, lecciones, arquitectura y el mapa funcional (`docs/MAPA-FUNCIONAL.md`, que se genera con `npm run mapa` y el CI comprueba que está al día).
5. **Antes de dar una funcionalidad por terminada se recorre como lo haría una persona real**, incluidas las que no saben de tecnología (guion en `docs/pruebas/personas.md`).

## Principio fundacional: intuitiva para todos, y profesional

**Petición expresa del fundador, aplicable a esta y a cualquier aplicación que desarrollemos.** La app debe ser muy intuitiva para cualquier persona: niños, jóvenes, adultos y personas mayores, con cualquier nivel de conocimiento tecnológico. Cada usuario debe entender su funcionamiento a la perfección sin ayuda. Se mantiene siempre un tono **serio y profesional**: nada de lenguaje vulgar ni coloquial; la app debe transmitir que la lleva gente seria.

Esto rige **todo lo que se haga**, no solo el diseño. Lista de comprobación antes de dar algo por terminado:

1. **Una acción principal por pantalla**, evidente y con un botón claro y de color que se distinga. Las acciones secundarias, más discretas.
2. **Botones con verbos que digan lo que hacen** («Dar aura a este peleador», «Guardar cambios»), no palabras vagas («Enviar», «OK»).
3. **Lenguaje llano, sin jerga técnica ni interna.** Nada de «SELF_REPORTED», «disputar», «claim», «token». Se explica con palabras corrientes («Pendiente de confirmar por tu rival»). Cada término no obvio lleva una explicación breve al lado.
4. **Todo es fácil de encontrar:** navegación corta (5 elementos como máximo), enlaces visibles y con texto claro, siempre una forma evidente de volver o de ir al inicio. Las funciones importantes no se esconden.
5. **Cada campo tiene su etiqueta visible** (no solo un texto de ejemplo que desaparece), con una ayuda breve cuando haga falta. Formularios cortos, en el orden que la persona esperaría.
6. **Los errores dicen qué ha pasado y cómo arreglarlo,** con amabilidad y sin culpar. Nunca pantallas vacías ni redirecciones mudas.
7. **Cada acción da respuesta visible:** un mensaje claro de que se ha hecho («Tu aura se ha guardado») y qué puede hacer la persona ahora.
8. **Accesibilidad como base:** texto de tamaño cómodo (mínimo 16 px), buen contraste (WCAG AA), zonas táctiles grandes (mínimo 44 px), que no dependa solo del color (icono o texto además), que funcione con teclado y con lector de pantalla, y que sea cómoda en móvil.
9. **Nada de plazos ni sorpresas:** no cerrar sesión por sorpresa sin avisar, no perder lo escrito, pedir confirmación en lo que no se puede deshacer.
10. **Ayuda a mano:** un «¿Cómo funciona?» accesible, y explicaciones en el primer uso de cada función (quién puede hacerlo, qué pasará después).
11. **Se prueba con personas reales de distintas edades** (incluida gente mayor y gente poco acostumbrada a la tecnología), no solo con el equipo. Si alguien duda dónde pulsar, es un fallo de la app, no de la persona.

Matiz sobre el diseño gráfico: el fundador pidió aplazar el **diseño visual** (estilo, identidad, maquetación fina) y que primero se cuide la arquitectura. Este principio **no** es diseño visual: la claridad, el lenguaje, los flujos, los mensajes y la accesibilidad se aplican **ya**. Antes de cambiar el aspecto visual de forma notable (paleta, estilo), **consultar al fundador**, porque los diseños generados suelen no gustarle.

## Principio de diseño visual: al final, y con identidad propia (no «aspecto de IA»)

**Petición expresa y reiterada del fundador.** El diseño gráfico y visual se trabaja **en última instancia**, cuando esté terminado todo el proceso de creación de la aplicación. Hasta que el fundador lo pida, **no se hace trabajo de diseño visual**: la interfaz actual (fondo oscuro, rojo y dorado) es **provisional y no debe evolucionarse ni pulirse**.

Motivo: al fundador **no le gustan los diseños que genera Claude**. Siempre salen iguales, con los mismos colores y patrones, y no quiere que la aplicación se asocie a simple vista con una IA. Cuando llegue el momento:

1. **Empezar por un briefing con el fundador**, no por un diseño: referencias que le gusten (webs, marcas, carteles de boxeo, cultura del deporte de contacto español), lo que no quiere ver, y la personalidad de la marca. Mostrarle **varias direcciones claramente distintas** y dejarle elegir.
2. **Evitar los «tics» de diseño genérico de IA:** degradados morados/azul índigo, tipografía por defecto (Inter/system-ui sin criterio), tarjetas redondeadas con sombra suave en cuadrículas idénticas, «hero + tres tarjetas», efectos de cristal/glassmorphism, iconos de emoji como decoración, paletas «seguras» sin carácter.
3. **Buscar identidad propia** apoyada en la cultura del boxeo y los deportes de contacto en España (cartelería de veladas, tipografías de rótulo, materiales del ring, fotografía real), con paleta, tipografía y composición elegidas a propósito y justificadas por escrito.
4. **Recomendar contar con un diseñador humano** para logotipo y marca; Claude implementa y ayuda, pero no decide solo la identidad.
5. **Documentar cada decisión de diseño** (qué se eligió, qué se descartó y por qué) en `docs/DISENO.md`, que se crea al empezar esta fase.
6. Mientras tanto se mantiene **todo lo que no es estilo**: claridad, lenguaje, flujos, accesibilidad (principio de usabilidad).

## Decisión visual vigente — 3 de octubre de 2026

El fundador ha elegido **`#BE33F5` como color oficial de la aplicación**. Sustituye las propuestas azul/amarillo y petróleo/marfil. Quiere un aspecto juvenil, con garra y comunidad, diferenciable de Raunder. Solo el color está decidido: no considerar aprobado el logotipo, composición ni tipografía de ninguna maqueta. Propuestas y fuentes en [docs/DISENO.md](docs/DISENO.md). La implementación visual sigue pendiente. Esta elección expresa prevalece sobre recomendaciones anteriores de paleta.

## Idioma: todo en español (petición expresa del fundador)

Todo lo que llegue a una persona va en **español**: la interfaz (textos, botones, avisos, errores, títulos, pantallas de «no encontrada» y de error), los correos, la documentación y los mensajes de commit. También las direcciones visibles (`/peleadores`, `/moderacion`…). Se usa «correo electrónico» y no «email» en los textos. Los identificadores internos del código (`Fighter`, `Bout`…) están en inglés por convención técnica; **si el fundador quiere también el código en español, hay que preguntárselo y planificarlo, porque supone un renombrado grande.**

## Aura y funciones premium (decisiones del fundador)

- **Aura: un clic por usuario y por combate**, y solo eso hasta que la estructura básica esté terminada.
- Más adelante, **hasta tres clics como función premium**, dentro de las funcionalidades de pago. **No adelantarlo.** Riesgo a resolver antes: si pagar da más peso al aura, se desvirtúa el ránking («quien paga, gana»).
- **La aplicación debe monetizarse.** Se harán las funciones premium **después** de terminar la estructura básica. Principio para elegirlas: **nunca se vende la verificación, el sello de verificado ni una posición en el ránking**; la consulta básica sigue siendo gratuita.

## Competencia

La competencia declarada es **Raunder** (raunder.es) y **BoxRec** (boxrec.com). El análisis vive en `docs/COMPETENCIA.md`; **no se afirma nada que no se haya podido comprobar**, y hay que completarlo cuando se pueda acceder a esas webs.

## Reglas del fundador

- Ver contenido es público; votar, registrar récords y publicar exige cuenta (y correo electrónico verificado).
- Prioridad: arquitectura y estructura. **No trabajar diseño gráfico** hasta que lo pida.
- Los datos de ejemplo del seed son ficticios: nunca inventar récords de personas reales.

## Estado actual y cómo retomar

**Lee [`docs/TRASLADO.md`](docs/TRASLADO.md) antes de empezar:** puesta en marcha, estado, lo que falta (bloques 5 a 7 de la auditoría), las decisiones que necesitan al fundador y las reglas técnicas del proyecto. La auditoría de código (99 hallazgos, con su estado) está en `docs/AUDITORIA.md`; 96 de los 99 hallazgos se verificaron con tres comprobadores (5 se refutaron o ya estaban corregidos); los 97, 98 y 99 no se pudieron verificar: comprueba que el problema existe antes de corregirlos.

Reglas técnicas que no conviene olvidar: todo lo exportado de un módulo de `src/app/actions/` es un punto de entrada público (los ayudantes van sin exportar o en `shared.ts`, y la lógica en `src/lib/<dominio>`); nunca uses `in` ni `obj[clave]` con claves del usuario (usa `hasOwn`/`lookup` de `src/lib/common/safe.ts`); importaciones relativas, sin alias `@/`; las pruebas de navegador esperan a un estado visible (`seen()`), usan datos únicos por ejecución y no dependen del volumen de la base; tras reiniciar el servidor local comprueba que no hay `EADDRINUSE`; Prisma se niega a `--force-reset` cuando lo lanza una IA: no lo sortees, pide al fundador que lo ejecute.

## Comandos

- `npm run typecheck` · `npm test` · `npm run test:e2e` · `npm run test:a11y` (ver README: necesitan el servidor en marcha) · `npx prisma db push` · `npm run db:seed` (solo en base local y vacía)
- Hay que fijar TypeScript en 5.x (Next 15 no es compatible con 7).
