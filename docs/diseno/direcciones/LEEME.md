# Tres direcciones de diseño para Ring España

> **RECHAZADO por el fundador (6 de octubre de 2026):** «es muy plano […] no hay apenas aspectos visuales llamativos, se ve claramente como uno de los diseños típicos de Claude». Estas maquetas **no se implementan**. El diseño visual pasa a Antigravity. Se conservan solo como ejemplo de lo que **no** hacer y por la idea de «ambiente por deporte».


**Autor:** Claude (diseño visual, por decisión del fundador del 6 de octubre de 2026) · **Estado:** propuesta para elegir. **La aplicación real no se ha tocado**: son maquetas aisladas (HTML sin programación) con datos ficticios.

## Qué pidió el fundador (briefing)

- Sensación: **comunidad y cercanía**, **seria y profesional**, **deportiva y de élite**.
- Referencias: un diseño parecido al de **Apple** y al de **The Ring Magazine** (ringmagazine.com), pero **completamente orientado al boxeo**, **sin emojis ni emoticonos**.
- Color oficial ya decidido: **#BE33F5**. Aspecto juvenil, diferenciable de Raunder, **sin «aspecto de IA»** (reglas de `CLAUDE.md`).

**Lectura de la referencia (6 oct):** The Ring es editorial: titulares de noticias, clasificaciones, calendario y suscripción; usa azul y rojo sobre fondo blanco. Apple aporta el vacío, las cifras enormes y el ritmo de secciones. Lo que ninguna tiene y es nuestro: **el récord con su origen visible** («Confirmado por el rival», «Respaldado por federación») y el **aura**.

## Qué se ve en cada maqueta

La misma pantalla en las tres, para que se pueda comparar: cabecera con 5 enlaces como máximo (Deportistas, Veladas, Clubes, Ránking, Entrar), ficha pública de un peleador (récord, aura, últimos combates con su origen, próxima velada) y listado ordenado por aura. Cada una con su versión de móvil (390 px) y de escritorio (1280 px) en `capturas/`.

| | **A · Revista** | **B · Aparato** | **C · Lona** |
|---|---|---|---|
| Idea | Una revista de boxeo impresa: papel, tinta, filetes dobles como las cuerdas | Una página de producto: aire, cifras enormes, secciones que se suceden | Un ring de noche: lona oscura, cuerdas, carteles y entradas de velada |
| Fondo | Papel cálido | Blanco y gris claro | Negro violáceo |
| Tipografía | Newsreader (titulares) + Barlow Condensed (rótulos y cifras) + Barlow | Instrument Sans | Big Shoulders Display (cartel) + Hanken Grotesk |
| Uso del violeta | Solo acentos: la cursiva del nombre, el aura, el botón | Botón principal y el aura | Cuerdas, botón principal y el aura |
| Se parece a | The Ring (editorial) | Apple | Cartelería de veladas |
| Fortaleza | Seriedad y personalidad propias; encaja con cualquier edad | Claridad máxima; lo más fácil de leer | Energía y «élite»; recuerda al ring |
| Riesgo | Menos juvenil | Es la más **genérica**: podría ser cualquier aplicación | Más oscura: exige cuidar el contraste y la lectura de textos largos |

## Comprobado

- Sin desbordes horizontales en 390 y 1280 px; ningún enlace o botón por debajo de 44 px de alto; ningún texto por debajo de 14 px (las etiquetas pequeñas, en 14–15 px; el cuerpo, 17 px); sin emojis; foco visible.
- **No comprobado:** contraste calculado con una herramienta (visualmente es alto), lectura con un lector de pantalla, ni prueba con personas reales de distintas edades (regla del fundador).
- Las fotografías son marcadores: la identidad final necesita **fotografía real** de peleadores y gimnasios (regla de `CLAUDE.md`). Las tipografías se cargan de Google Fonts; no se ha comprobado su licencia de uso comercial más allá de ser fuentes abiertas de ese servicio.

## Una tensión que hay que resolver con el fundador

Pidió «completamente orientado al boxeo». `CLAUDE.md` dice que la comunicación pública **no debe presentar el boxeo como prioridad** (hay seis disciplinas). Propuesta: **el boxeo como lenguaje visual** (ring, cuerdas, carteles, tipografía de cartel) y **los textos y listados igual para todas las disciplinas**. Las maquetas ya lo hacen así: el ejemplo es de Muay Thai y el listado mezcla cuatro disciplinas. Si el fundador quiere más boxeo en el contenido, hay que decidirlo expresamente, porque cambia la regla vigente.

## Qué viene después de elegir

1. El fundador elige una dirección (o una mezcla concreta, por ejemplo «estructura de B con la energía de C»).
2. Se afina en una segunda ronda: logotipo, fotografía, portada, menú móvil, estados vacíos y errores.
3. Se documenta en `docs/DISENO.md` y se convierte en fichas de tarea para Codex (tokens de diseño en `globals.css`, componentes y pantallas). Claude revisa cada PR visual.

---

## Segunda ronda: la mezcla por deporte (6 de octubre de 2026)

**Palabras del fundador:** «haz una mezcla, de todos los deportes de contacto; luego, cuando el usuario elija su deporte de contacto, la aplicación se sumerge por completo en esa temática».

[`mezcla-por-deporte.html`](mezcla-por-deporte.html) es **una sola maqueta con siete ambientes**: la base «Todos los deportes» (mezcla de A, B y C) y un tema por boxeo, MMA, Muay Thai, kickboxing, K-1 y jiu-jitsu. El selector «Tu deporte» cambia color, tipografía, textura, formas y vocabulario en directo; también se puede abrir con `?deporte=boxeo`, `?deporte=mma`, etc. Capturas en `capturas/M-*.png` (390 y 1280 px). La especificación para desarrollo está en [`../SISTEMA-TEMAS.md`](../SISTEMA-TEMAS.md) y las fichas para Codex son T-015, T-016 y T-017.

**Comprobado** (los 7 ambientes, en 390 y 1280 px): sin desbordes, zonas táctiles ≥ 44 px, texto ≥ 14 px, y contraste calculado: el menor de los pares medidos es 5,8:1. **No comprobado:** lector de pantalla, prueba con personas reales, licencias de las tipografías y fotografía real.

### Tercera pieza: portada, menú móvil y estados (6 de octubre de 2026)

[`portada-y-estados.html`](portada-y-estados.html): la **portada** con siete tarjetas de elección de deporte (cada una ya con su propio ambiente; al pulsar, toda la página cambia), veladas, ránking, «cómo funciona», cierre y la **barra inferior del móvil** (5 destinos con iconos de línea propios). Incluye los **estados**: lista vacía, error con salida y confirmación. Capturas en `capturas/P-*.png`. Comprobado en los siete ambientes a 390 y 1280 px: sin desbordes, zonas táctiles ≥ 44 px, sin texto menor de 13 px, sin emojis. Un fallo mío detectado al revisar las capturas y corregido: dos botones salían vacíos porque su nombre de clase chocaba con el de las secciones.

### Cuarta pieza: registro, formularios y ficha de velada (6 de octubre de 2026)

- [`registro-y-formularios.html`](registro-y-formularios.html): elección del tipo de cuenta (los tres paneles reales: usuario, peleador, promotora o federación) y el alta del peleador **con la elección de deporte** (seis tarjetas, cada una ya en su ambiente), etiquetas siempre visibles, ayuda breve, **un error de ejemplo que explica cómo arreglarlo** y el botón «Mostrar» de la contraseña. El alta **no pide la edad** (decisión del fundador).
- [`ficha-de-velada.html`](ficha-de-velada.html): cartel con fecha, lugar y horarios, combate principal, resto de la cartelera con su estado («Pendiente») y quién organiza. El enlace de entradas **avisa de que se abre en otra pestaña** (regla de T-013). El vocabulario cambia por deporte (asaltos, rondas, torneo, combates).
- Comprobado en los 7 ambientes a 390 y 1280 px (28 vistas): sin desbordes, zonas táctiles ≥ 44 px y sin texto menor de 13 px.
- **Fallo de accesibilidad encontrado y corregido:** en los ambientes con formas recortadas (MMA, kickboxing) el recorte ocultaba el aro de foco y la marca de selección. Ahora se dibujan por dentro (`outline-offset` negativo y sombra interior); comprobado con foco de teclado en MMA y kickboxing. Regla para T-015/T-016/T-017: **ningún elemento con `clip-path` puede depender de un contorno exterior**.
- El nombre «Ring España» es **provisional**: no hay logotipo hasta que el fundador tenga el nombre oficial. La ficha [T-018](../../tareas/T-018-nombre-de-la-app-en-un-solo-sitio.md) deja el nombre en un solo sitio del código para poder cambiarlo.
