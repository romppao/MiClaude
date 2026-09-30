# Ring España — instrucciones para Claude

Aplicación web para la comunidad española de deportes de contacto — boxeo en cabeza, más MMA, kickboxing, K-1 y jiu-jitsu (amateur primero, Madrid como plaza inicial). El vocabulario es «peleador», no «boxeador». Stack: Next.js 15, TypeScript 5, PostgreSQL, Prisma. Contexto y decisiones en `docs/ARQUITECTURA.md`.

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

## Principio de diseño visual: al final, y con identidad propia (no «aspecto de IA»)

**Petición expresa y reiterada del fundador.** El diseño gráfico y visual se trabaja **en última instancia**, cuando esté terminado todo el proceso de creación de la aplicación. Hasta que el fundador lo pida, **no se hace trabajo de diseño visual**: la interfaz actual (fondo oscuro, rojo y dorado) es **provisional y no debe evolucionarse ni pulirse**.

Motivo: al fundador **no le gustan los diseños que genera Claude**. Siempre salen iguales, con los mismos colores y patrones, y no quiere que la aplicación se asocie a simple vista con una IA. Cuando llegue el momento:

1. **Empezar por un briefing con el fundador**, no por un diseño: referencias que le gusten (webs, marcas, carteles de boxeo, cultura del deporte de contacto español), lo que no quiere ver, y la personalidad de la marca. Mostrarle **varias direcciones claramente distintas** y dejarle elegir.
2. **Evitar los «tics» de diseño genérico de IA:** degradados morados/azul índigo, tipografía por defecto (Inter/system-ui sin criterio), tarjetas redondeadas con sombra suave en cuadrículas idénticas, «hero + tres tarjetas», efectos de cristal/glassmorphism, iconos de emoji como decoración, paletas «seguras» sin carácter.
3. **Buscar identidad propia** apoyada en la cultura del boxeo y los deportes de contacto en España (cartelería de veladas, tipografías de rótulo, materiales del ring, fotografía real), con paleta, tipografía y composición elegidas a propósito y justificadas por escrito.
4. **Recomendar contar con un diseñador humano** para logotipo y marca; Claude implementa y ayuda, pero no decide solo la identidad.
5. **Documentar cada decisión de diseño** (qué se eligió, qué se descartó y por qué) en `docs/DISENO.md`, que se crea al empezar esta fase.
6. Mientras tanto se mantiene **todo lo que no es estilo**: claridad, lenguaje, flujos, accesibilidad (principio de usabilidad).

## Idioma: todo en español (petición expresa del fundador)

Todo lo que llegue a una persona va en **español**: la interfaz (textos, botones, avisos, errores, títulos, pantallas de «no encontrada» y de error), los correos, la documentación y los mensajes de commit. También las direcciones visibles (`/peleadores`, `/moderacion`…). Se usa «correo electrónico» y no «email» en los textos. Los identificadores internos del código (`Fighter`, `Bout`…) están en inglés por convención técnica; **si el fundador quiere también el código en español, hay que preguntárselo y planificarlo, porque supone un renombrado grande.**

## Aura y funciones premium (decisiones del fundador)

- **Aura: un clic por usuario y por combate**, y solo eso hasta que la estructura básica esté terminada.
- Más adelante, **hasta tres clics como función premium**, dentro de las funcionalidades de pago. **No adelantarlo.** Riesgo a resolver antes: si pagar da más peso al aura, se desvirtúa el ránking («quien paga, gana»).
- **La aplicación debe monetizarse.** Se harán las funciones premium **después** de terminar la estructura básica. Principio para elegirlas: **nunca se vende la verificación, el sello de verificado ni una posición en el ránking**; la consulta básica sigue siendo gratuita.

## Competencia

La competencia declarada es **Raunder** (raunder.es) y **BoxRec** (boxrec.com). El análisis vive en `docs/COMPETENCIA.md`; **no se afirma nada que no se haya podido comprobar**, y hay que completarlo cuando se pueda acceder a esas webs.

## Reglas del fundador

- Ver contenido es público; votar, registrar récords y publicar exige cuenta (y email verificado).
- Prioridad: arquitectura y estructura. **No trabajar diseño gráfico** hasta que lo pida.
- Los datos de ejemplo del seed son ficticios: nunca inventar récords de personas reales.

## Comandos

- `npm run typecheck` · `npm test` · `npm run test:e2e` (ver README) · `npx prisma db push` · `npm run db:seed`
- Hay que fijar TypeScript en 5.x (Next 15 no es compatible con 7).
