# Análisis de la competencia

Actualizado por Codex el **3 de octubre de 2026**, por petición del fundador. Sustituye el análisis anterior, que contenía hipótesis y fuentes secundarias poco sólidas. La comparación se limita a páginas públicas y a lo que se pudo observar; no es una auditoría de los sistemas de los competidores.

## Método y límites

- Raunder: portada en navegador real, pregunta frecuente sobre el récord y páginas públicas de gimnasios, peleadores y clasificación mediante búsqueda web.
- BoxRec: portada, ficha pública y ayuda oficial mediante búsqueda web. En el navegador la verificación de Cloudflare persistió tras una recarga: no se pudo recorrer la interfaz normal ni iniciar sesión. Esto limita este entorno; **no demuestra un fallo para sus usuarios**.
- Ring España: documentación y código de la rama `claude/ring-espana-mvp`, portada y calendario de la demo en navegador real. No se crearon cuentas ni se modificaron datos en los competidores.
- Los textos recuperados por búsqueda pueden diferir de la interfaz dinámica. Los recuentos de Raunder cambiaron entre recuperaciones: no se usan como medida estable ni se infiere por ello un fallo.
- Las valoraciones de claridad de abajo son **juicio de producto de Codex**, no hechos estadísticos ni resultados de pruebas con usuarios reales.

## Raunder: fortalezas comprobadas

Fuentes: [portada](https://raunder.es/), [gimnasios](https://raunder.es/gimnasios), [clasificación](https://raunder.es/clasificacion).

1. **Entrada por necesidades:** encontrar dónde entrenar, sparring y llevar la trayectoria; también diferencia las propuestas para gimnasios y promotoras. En la portada del navegador se comprobaron enlaces por objetivo.
2. **Utilidad recurrente de los gimnasios:** la página pública anuncia horarios por clases; la portada presenta pases de día y gestión para gimnasios. Son ofertas visibles: no se probaron reservas ni pagos.
3. **Métrica explícita:** la clasificación pública dice que ordena actividad y medallas de actas, en lugar de victorias y derrotas. Explicar qué mide evita confundir actividad con calidad deportiva.

### Fricciones y oportunidades observadas

- La respuesta desplegada a «¿Cómo funciona el récord de deportista?» explica crear ficha, declarar combates y compartirla, pero **esa respuesta concreta** no aclara quién valida cada resultado. No se afirma que Raunder carezca de verificación: su página de peleadores menciona actas. Nuestra oportunidad es explicarlo junto al récord y al resultado, además de en la ayuda.
- La clasificación mezcla varias métricas en una página extensa. Puede exigir más lectura para interpretar cada lista: es una hipótesis de usabilidad a probar, no un fallo demostrado.
- Nuestra ficha de gimnasio hoy no tiene horarios, disciplinas ofrecidas ni pases. Esta es una carencia nuestra frente a la propuesta visible de Raunder; requiere datos mantenidos por cada gimnasio, no copiar cifras ajenas ni añadir botones de reserva sin servicio real.

## BoxRec: fortalezas y fricciones comprobadas

Fuentes: [portada](https://boxrec.com/), [ayuda oficial](https://boxrec.com/en/support), [ficha pública consultada](https://boxrec.com/en/box-pro/851665).

- La ayuda documenta búsqueda con sugerencias e identificador, historial, últimos seis resultados y registros por deporte; son referencias útiles para buscar y leer una carrera.
- Publica explicaciones de su clasificación y de las puntuaciones del público. Su ayuda separa estas últimas de las oficiales.
- El glosario y la portada usan abreviaturas como `Box-am`, `W-UD` y `TBA`: para público nuevo pueden exigir consultar ayuda. Nuestra interpretación: mostrar palabras completas y kilos desde el principio.
- La ayuda indica que algunas páginas y los pesos requieren cuenta. La decisión de Ring España sigue siendo consulta pública y cuenta para participar.
- BoxRec reconoce cobertura amateur incompleta y explica cómo enviar resultados por correo. Nuestra oportunidad es un recorrido guiado de alta, confirmación del rival y corrección, con estado visible.

**Correcciones al análisis antiguo:** no es correcto presentar hoy BoxRec como exclusivamente boxeo, exclusivamente inglés o sin participación del público. Su ayuda describe varios deportes, selección de idioma y puntuaciones de aficionados. Tampoco se puede afirmar que Raunder no esté en Madrid: su directorio incluye gimnasios madrileños. Las acusaciones antiguas sobre manipulación no se mantienen como hechos.

## Aplicación a Ring España

| Aprendizaje | Aportación de este bloque | Estado |
|---|---|---|
| Entrada por objetivo | Enlaces para descubrir peleadores, entrenar, consultar veladas, gestionar ficha y organizar | Publicado en #11; menú por actividades en #14 |
| Una clasificación debe explicar qué mide | Fórmula, periodo, provincia, empates y límites del aura | Publicado; trayectoria y respaldo ampliados en #14 |
| Respaldo entendible junto al dato | Enlace desde cada récord a ayuda precisa; evidencia no equivale a verificación | Publicado, con respaldo opcional y etiquetas en #14 |
| Calendario útil y coherente | Hoy permanece durante todo el día peninsular; filtros individuales y salida de resultados vacíos | Publicado en #11, con regresiones |
| Gimnasios con información práctica | Horarios, disciplinas, contacto y fecha de actualización | Propuesta pendiente, necesita modelo y responsable |
| Trayectoria fácil de leer | Récord por disciplina/nivel y títulos con desglose; las estadísticas adicionales necesitan datos suficientes | Récord y títulos publicados; racha/actividad y métricas nuevas, pendientes |
| Herramientas profesionales | Gestión de una velada antes de ampliar a CRM | Gestión de veladas implementada; CRM pendiente |

## Prioridad siguiente

1. Ejecutar las pruebas de navegador y accesibilidad del cambio en un entorno con PostgreSQL; completar después moderación, seguridad, móvil/teclado y exploración destructiva de `pruebas/personas.md`.
2. Resolver con el fundador la unidad de aura, menores, privacidad y publicación de fichas de terceros. Este bloque **no decide** esos asuntos.
3. Diseñar funcionalmente los datos de gimnasios y el flujo organizador. No añadir reservas, sparrings, pagos o estadísticas sin reglas, datos y validación.
4. Probar con personas reales de distintas edades antes de dar por buena la claridad.

El diseño gráfico queda para el final. Detalle de cambios y relevo: [APORTACIONES-CODEX.md](APORTACIONES-CODEX.md).

---

## Actualización del 6 de octubre de 2026 (Claude, con acceso a internet)

**Petición del fundador:** «queremos mejorar las mejores funciones de nuestros competidores, y mejorar las peores virtudes de ellos» (Raunder y BoxRec).

**Cómo se ha hecho:** lectura de las páginas públicas de Raunder (portada, `/clasificacion`, `/gimnasios`) el 6 de octubre de 2026, sin crear cuentas ni modificar nada. **BoxRec:** su portada se pudo leer con la herramienta de indexación (con una petición simple devolvía «Just a moment…», HTTP 403, y su ayuda dio 403): solo se recoge lo visible en la portada. Las cifras de Raunder cambian con el tiempo: son las del momento de la lectura. Lo marcado como **hipótesis** no se ha comprobado.

### Lo que Raunder muestra hoy (hechos leídos)

- Portada: «128 gimnasios de boxeo, kickboxing, muay thai, MMA y BJJ», con el texto de presentación citando Vilanova i la Geltrú, Barcelona, Almería, Sant Joan Despí y Viladecans, «27 de ellos con su horario de la semana publicado clase a clase». Secciones: gimnasios, clases (día y hora), **sparrings**, veladas («5 publicadas, con su cartelera y sus entradas»), peleadores («récord de combates contra actas de federación») y clasificación; listados «por ciudad y disciplina» (por ejemplo «Boxeo en Barcelona · 8 clubes»). Dice: «Horarios, precios y reserva en la ficha de cada gimnasio». No se ha comprobado cómo funcionan sparrings, precios ni reservas.
- Gimnasios: cada uno indica ciudad y «N clases a la semana» (de 1 a 96).
- Clasificación: «16.238 combates y 11.426 podios de actas de federación»; «se ordena por combates y por medallas, nunca por victorias y derrotas»; clubes con combates, medallas y número de peleadores. Cuatro disciplinas (boxeo, kickboxing, muay thai, MMA); no aparece jiu-jitsu ni K-1.
- Veladas próximas (6 oct): cinco, del 9 al 31 de octubre; tres en Cataluña (Rubí, Castellbisbal, Barcelona), una en la Comunidad de Madrid (Guadalix de la Sierra) y una en Sevilla (Palomares del Río).
- Alcance geográfico visible: los gimnasios listados incluyen Barcelona y su entorno, Almería, **Madrid** y **Mahón**; la clasificación de clubes incluye también **Sevilla, Valencia y Tarragona**. Predomina con claridad Cataluña.

### Qué mejorar de lo que hace bien (y qué hacemos nosotros)

| Fortaleza de Raunder | Cómo la mejoramos en Ring España | Estado |
|---|---|---|
| Horario publicado clase a clase en los gimnasios | Mismo valor, pero **mantenido por el propio gimnasio** y con fecha de última actualización visible; sin copiar cifras ajenas | **Propuesta nueva**: ficha de tarea pendiente (necesita modelo de datos y titular de ficha; ver abajo) |
| Récord ligado a actas de federación | Aceptamos además trayectoria declarada con **respaldo opcional** y mostramos de dónde sale cada dato (declarado, confirmado por el rival, respaldado por federación) | Ya publicado (aura = trayectoria + respaldo + comunidad) |
| Clasificación que explica qué mide | Explicarlo igual **en la propia página de ránking**, con el periodo y la fórmula, y por disciplina | Publicado en `/ayuda#aura`; falta llevar la explicación junto a cada lista |
| Entrada por objetivo (entrenar, sparring, veladas) y secciones propias de **sparrings**, **clases** y reserva en la ficha del gimnasio | Menú por actividades. Sparring y reservas son sus funciones diferenciales: no se presentan como disponibles mientras no existan reglas, datos y responsable; candidatas a fase posterior | Menú publicado (#14); sparring y reservas, sin implementar |
| Entradas de velada | Enlace a la venta del organizador (campo `ticketUrl` existente); vender entradas nosotros requiere pagos y es decisión del fundador | Sin cambios |

### Qué mejorar de lo que hace peor o deja sin cubrir

Los puntos 1–3 son **hechos observados**; el 4 y el 5 son **hipótesis a comprobar** con personas reales.

1. **Cobertura geográfica muy concentrada en Cataluña** (con presencia puntual en Madrid, Sevilla, Valencia, Almería y Menorca). Ring España parte de **toda España** y de seis disciplinas. Esta ventaja solo existe si se llena de datos: no afirmar cobertura que aún no tenemos (regla del fundador).
2. **Disciplinas:** su clasificación pública cita boxeo, kickboxing, muay thai y MMA (los gimnasios sí incluyen BJJ); no aparecen K-1 ni jiu-jitsu en la clasificación. Nosotros cubrimos las seis.
3. **Solo actas de federación:** deja fuera a quien compite sin acta o sin federación. Nuestro recorrido de «declarar y respaldar» cubre ese hueco, pero cada dato lleva su origen visible para que no se confunda con uno verificado.
4. *(Hipótesis)* La clasificación es larga (445 líneas de texto) y mezcla varias listas en una página: probar con personas si se entiende sin ayuda; nuestra respuesta sería **una lista por pantalla, con filtros y una frase que diga qué mide**.
5. *(Hipótesis)* El valor para el peleador individual depende de que su gimnasio y su federación aparezcan: nuestra ficha debe poder usarse **desde el primer día sin depender de terceros**.

### Qué hacer a partir de esto (propuesta de Claude; decide el fundador)

1. **Ficha nueva «Información práctica del gimnasio»** (horarios por clase, disciplinas, contacto, fecha de actualización, editable solo por su titular). Nivel N3 (modelo de datos y permisos). No incluir reservas ni pases hasta que existan reglas, pagos y un responsable.
2. **Explicación de qué mide cada ránking junto a la lista** (nivel N1, mejora de claridad).
3. **Jiu-jitsu y K-1 en la clasificación pública y en la comunicación** como diferencia verificable.
4. **Pruebas con personas reales** de las dos hipótesis anteriores antes de decidir cambios de diseño.
5. **BoxRec (portada, 6 oct):** buscador con filtros por sexo y por unos 25 códigos de deporte y nivel (`Box-pro`, `Box-am`, `Mt-am`, `Kb-pro`, `Mf-pro`…), por funciones (entrenador, juez, árbitro, promotor, matchmaker, médico, inspector…) y periodo («últimos 3 años» o «todo el tiempo»); calendario de combates y banner de un socio oficial. Confirma lo anotado arriba: códigos abreviados que un público nuevo no entiende sin ayuda. **Aprovechar:** buscar también por entrenador, árbitro o promotor. **Mejorar:** palabras completas y una sola búsqueda sencilla. No se ha visto su sistema de pago ni sus precios.
