# Ring España — instrucciones para Claude

Aplicación web para la comunidad boxística española (amateur primero, Madrid como plaza inicial). Stack: Next.js 15, TypeScript 5, PostgreSQL, Prisma. Contexto y decisiones en `docs/ARQUITECTURA.md`.

## Documentación obligatoria (petición expresa del fundador)

Todo el proceso se documenta para poder contarlo y retomarlo en el futuro. **Al terminar cada bloque de trabajo, antes de dar la sesión por cerrada:**

1. Añadir una entrada **al final** de `docs/DIARIO.md` con la plantilla que trae (qué se pidió, qué se decidió y por qué, qué se hizo, qué salió mal, estado y próximos pasos). No reescribir entradas anteriores.
2. Actualizar `docs/IDEAS.md`: ideas nuevas (con su origen: quién y cuándo las planteó), cambios de estado, ideas descartadas y por qué.
3. Añadir a `docs/LECCIONES.md` cada error o callejón sin salida con su causa real y la regla resultante.
4. Si cambia el estado técnico (modelo de datos, roles, flujos, riesgos), actualizar `docs/ARQUITECTURA.md`.

Recoger con las palabras del fundador las ideas y decisiones importantes. Ser honesto con lo que salió mal: el valor de estos documentos es que sean fiables.

## Principio fundacional: intuitiva para todos, y profesional

**Petición expresa del fundador, aplicable a esta y a cualquier aplicación que desarrollemos.** La app debe ser muy intuitiva para cualquier persona: niños, jóvenes, adultos y personas mayores, con cualquier nivel de conocimiento tecnológico. Cada usuario debe entender su funcionamiento a la perfección sin ayuda. Se mantiene siempre un tono **serio y profesional**: nada de lenguaje vulgar ni coloquial; la app debe transmitir que la lleva gente seria.

Esto rige **todo lo que se haga**, no solo el diseño. Lista de comprobación antes de dar algo por terminado:

1. **Una acción principal por pantalla**, evidente y con un botón claro y de color que se distinga. Las acciones secundarias, más discretas.
2. **Botones con verbos que digan lo que hacen** («Valorar a este boxeador», «Guardar cambios»), no palabras vagas («Enviar», «OK»).
3. **Lenguaje llano, sin jerga técnica ni interna.** Nada de «SELF_REPORTED», «disputar», «claim», «token». Se explica con palabras corrientes («Pendiente de confirmar por tu rival»). Cada término no obvio lleva una explicación breve al lado.
4. **Todo es fácil de encontrar:** navegación corta (5 elementos como máximo), enlaces visibles y con texto claro, siempre una forma evidente de volver o de ir al inicio. Las funciones importantes no se esconden.
5. **Cada campo tiene su etiqueta visible** (no solo un texto de ejemplo que desaparece), con una ayuda breve cuando haga falta. Formularios cortos, en el orden que la persona esperaría.
6. **Los errores dicen qué ha pasado y cómo arreglarlo,** con amabilidad y sin culpar. Nunca pantallas vacías ni redirecciones mudas.
7. **Cada acción da respuesta visible:** un mensaje claro de que se ha hecho («Tu valoración se ha guardado») y qué puede hacer la persona ahora.
8. **Accesibilidad como base:** texto de tamaño cómodo (mínimo 16 px), buen contraste (WCAG AA), zonas táctiles grandes (mínimo 44 px), que no dependa solo del color (icono o texto además), que funcione con teclado y con lector de pantalla, y que sea cómoda en móvil.
9. **Nada de plazos ni sorpresas:** no cerrar sesión por sorpresa sin avisar, no perder lo escrito, pedir confirmación en lo que no se puede deshacer.
10. **Ayuda a mano:** un «¿Cómo funciona?» accesible, y explicaciones en el primer uso de cada función (quién puede hacerlo, qué pasará después).
11. **Se prueba con personas reales de distintas edades** (incluida gente mayor y gente poco acostumbrada a la tecnología), no solo con el equipo. Si alguien duda dónde pulsar, es un fallo de la app, no de la persona.

Matiz sobre el diseño gráfico: el fundador pidió aplazar el **diseño visual** (estilo, identidad, maquetación fina) y que primero se cuide la arquitectura. Este principio **no** es diseño visual: la claridad, el lenguaje, los flujos, los mensajes y la accesibilidad se aplican **ya**. Antes de cambiar el aspecto visual de forma notable (paleta, estilo), **consultar al fundador**, porque los diseños generados suelen no gustarle.

## Reglas del fundador

- Ver contenido es público; votar, registrar récords y publicar exige cuenta (y email verificado).
- Prioridad: arquitectura y estructura. **No trabajar diseño gráfico** hasta que lo pida.
- Los datos de ejemplo del seed son ficticios: nunca inventar récords de personas reales.

## Comandos

- `npm run typecheck` · `npm test` · `npm run test:e2e` (ver README) · `npx prisma db push` · `npm run db:seed`
- Hay que fijar TypeScript en 5.x (Next 15 no es compatible con 7).
