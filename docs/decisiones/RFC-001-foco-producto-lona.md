# RFC-001 — Concentrar Lona en un problema recurrente antes del lanzamiento

**Autor:** Codex · **Fecha:** 2026-10-14 · **Estado:** abierta, propuesta para Claude y el fundador.

**Origen:** el fundador solicita un análisis de producto y estrategia y pide dejarlo a Claude porque puede cambiar el objetivo y el lanzamiento. Esta RFC no aprueba un pivote, precios, retirada de funciones, restricción de disciplinas ni cambio de fechas.

## Dictamen

Lona tiene potencial como negocio especializado en la comunidad de deportes de contacto. Todavía no hay evidencia suficiente para afirmar que exista demanda para una red social nacional de seis disciplinas o que el negocio pueda crecer con rentabilidad. Tener una comunidad deportiva y tener clientes dispuestos a cambiar su forma de trabajar son cosas distintas.

El mayor riesgo es construir muchas funciones que necesitan usuarios y datos antes de ser útiles, sin resolver una tarea por la que alguien vuelva: crear una ficha una vez, encontrar poca actividad local y abandonarla. La falta de masa crítica, los datos dudosos y el aura poco interpretable agravan ese riesgo. Añadir funciones puede aumentar el mantenimiento sin mejorar la repetición.

Recomendación: empezar con una herramienta para clubes y organizadores de veladas amateur locales. La comunidad pública se desarrollaría alrededor de eventos que ya ocurren y de un trabajo que se repite. La hipótesis central es ahorrar tiempo y errores al preparar un cartel; tiene que probarse con usuarios antes de reordenar todo el desarrollo.

## Evidencia y lo que no demuestra

- El CSD recoge **719 clubes de boxeo en 2024**. Es una referencia histórica de estructura federada, no una estimación de compradores, usuarios únicos ni mercado de todas las disciplinas. No se ha calculado un tamaño comercial multiplicando licencias por una cuota hipotética. [Memoria de licencias y clubes del CSD, 2024](https://www.csd.gob.es/sites/default/files/media/files/2025-12/Licencias%20y%20Clubes%202024.pdf).
- La Federación Madrileña publica campeonatos y torneos celebrados en 2026 en distintos municipios y clubes: hay actividad organizada sobre la que realizar un piloto. No acredita que esas entidades tengan un problema con su software ni que quieran contratar Lona. [Competiciones de la FMB](https://fedmadboxeo.es/competiciones/).
- Raunder anuncia una oferta muy próxima: comunidad, sparring, gimnasios, clases, veladas y fichas. Por tanto, «todo en un sitio» ofrece poca diferenciación por sí solo. No se ha medido su número de usuarios activos ni la calidad real de sus flujos. [Web de Raunder](https://raunder.es/).
- Smoothcomp anuncia inscripciones, pagos, cuadros y resultados, y se usa en eventos de grappling/BJJ en España. Un pivote hacia gestión de torneos BJJ competiría con una herramienta especializada; no basta reproducir su lista de funciones. [Smoothcomp](https://smoothcomp.com/en), [ADCC Spain Madrid Open 2026](https://adcc-spain.smoothcomp.com/es/event/31768).
- Los sitios federativos ofrecen documentación y gestión propia de licencias/clubes. Lona no debería prometer ser una fuente federativa ni reemplazar sus autorizaciones sin acuerdo real. [RFEBox](https://feboxeo.es/documentos-competicion/).

Las fuentes confirman actividad y alternativas. El dolor operativo, la intención de cambio, el precio, la captación y la retención siguen siendo hipótesis. La web `lonaclub.es` no se pudo inspeccionar con el navegador de investigación; el contraste funcional se basa en los archivos actuales del repositorio, no en una auditoría del servicio publicado.

## Alternativas consideradas

### 1. Preparación de veladas y coordinación entre clubes — opción recomendada

- **Problema:** reunir candidaturas, revisar categorías/experiencia, cubrir huecos, comunicar cambios y cerrar resultados. Se investigará cómo se hace hoy; el uso de WhatsApp/hojas de cálculo es una hipótesis que hay que confirmar en entrevistas.
- **Usuario principal:** organizador de veladas amateur; entrenador que presenta varios competidores. El organizador sería el primer cliente de pago.
- **Propuesta de valor:** «Prepara tu velada con las candidaturas de los clubes, las confirmaciones y los resultados en un único recorrido».
- **MVP:** entidad identificada, evento privado/público, candidaturas de clubes, estado de revisión, categorías, cartel con confirmación humana, avisos esenciales, lista/exportación y resultados con fuente. Sin emparejamiento automático ni autorización deportiva otorgada por la aplicación.
- **Primeros usuarios:** trabajar con 2–3 organizadores y 8–12 clubes de una zona; ayudarles a preparar eventos que ya tengan previstos. Cada organizador invita a sus clubes y cada entrenador incorpora su equipo.
- **Monetización:** cobrar por evento utilizado; más adelante, una cuota a entidades que organicen con frecuencia. Ensayo orientativo de **49–99 € por evento**; es una hipótesis de precio, no tarifa aprobada ni prueba de disposición a pagar.
- **Riesgos:** presupuestos pequeños, eventos esporádicos, soporte manual caro, uso paralelo de canales existentes y confusión entre dato publicado y aprobación federativa. Solo interesa si ahorra trabajo suficiente para compensar el cambio.

### 2. Trayectoria deportiva con evidencia y origen de cada resultado

- **Problema:** resultados dispersos, récords que no explican su procedencia y repetición de comprobaciones al preparar un cartel.
- **Usuario principal:** entrenador/organizador que evalúa candidatos; el peleador es titular de su perfil.
- **Propuesta de valor:** «Comparte tu trayectoria sabiendo de dónde sale cada combate y qué está pendiente de comprobar».
- **MVP:** identidad estable y control de duplicados, resultados por disciplina/nivel, fuente y fecha, separación de declaraciones y resultados confirmados, revisión de errores y privacidad amateur. Un sello tendría un alcance concreto: identidad, hecho o documento, nunca toda la carrera.
- **Primeros usuarios:** un circuito local de organizadores que aporte sus resultados y permita a los titulares reclamarlos; buscar acuerdos, no asumir acceso a una API federativa ni copiar datos personales masivamente.
- **Monetización:** herramientas de consulta y gestión para entidades, con datos básicos gratuitos para peleadores. Validar utilidad antes de vender estadísticas o suscripciones personales.
- **Riesgos:** coste de revisión, desacuerdos, derechos sobre datos, dependencia de colaboradores y poca frecuencia de uso del peleador. Una licencia demuestra algo distinto de un resultado; no garantiza un récord completo.

### 3. Entrenamiento local y acceso a clubes

- **Problema:** encontrar una clase concreta, un entrenamiento de prueba o una sesión durante un viaje, con información fiable de lugar, horario y condiciones.
- **Usuario principal:** practicante recreativo/adulto; comprador profesional: gimnasio o entrenador que quiere captar alumnos.
- **Propuesta de valor:** «Encuentra una sesión de tu disciplina cerca de ti y recibe una confirmación clara del club».
- **MVP:** pocos clubes identificados y activos, ofertas concretas, disponibilidad mantenida, solicitud/confirmación, precio y condiciones de cancelación visibles, contacto y valoración solo después de una experiencia completada. Las clases privadas y los pases colectivos son productos diferentes: probar uno primero.
- **Primeros usuarios:** 5–8 clubes en un área y una oferta concreta —por ejemplo, primera sesión de boxeo o pase de entrenamiento BJJ—, distribuida por los propios clubes y sus canales locales.
- **Monetización:** tarifa por alumno nuevo confirmado o comisión sobre una reserva realmente pagada; elegir y validar una vía antes de integrar cobros. Los proveedores, seguros aplicables y responsabilidades necesitan revisión y aprobación específicas.
- **Riesgos:** horarios desactualizados, sesiones que no se cumplen, captación que no puede atribuirse, trato posterior fuera de la plataforma y escasa diferenciación frente a alternativas locales. Prometer «verificado» sin explicar qué se ha comprobado empeora la confianza.

### 4. Seguir veladas y a los peleadores del entorno

- **Problema:** perder anuncios, cambios de cartel, entradas y resultados de gente que se sigue.
- **Usuario principal:** aficionado y círculo del peleador; cliente de pago: organizador con entradas o patrocinadores.
- **Propuesta de valor:** «Entérate de dónde compiten los tuyos, consigue las entradas y sigue el resultado».
- **MVP:** agenda local actualizada, seguir clubes/peleadores, alertas elegidas por el usuario, entradas mediante enlace del organizador y resultados confirmados. Una página compartible del evento aporta valor antes de instalar una aplicación.
- **Primeros usuarios:** QR/enlaces en carteles y comunicación de 2–3 organizadores; cada participante comparte el evento con su círculo.
- **Monetización:** acuerdos de afiliación por ventas atribuibles y, con audiencia demostrada, patrocinios claramente identificados. No vender «alcance» antes de medirlo.
- **Riesgos:** el organizador no actualiza, poca frecuencia de eventos, conversión baja y calendario fácilmente sustituible por redes sociales. Los vídeos y emisiones requieren derechos adecuados; no son el MVP.

**Alternativa de continuidad:** lanzar las seis disciplinas y todos los módulos actuales. Conserva el trabajo desarrollado, pero divide captación, revisión y soporte antes de probar una utilidad recurrente. Solo la elegiría con colaboradores activos por disciplina y evidencia previa de uso repetido, que hoy no se ha acreditado.

## Elección y posicionamiento de partida

La opción 1 proporciona utilidad a un solo organizador y a sus clubes invitados, incluso antes de existir un directorio nacional. Las inscripciones, categorías, plazas, ayuda de emparejamiento, cartel y resultados ya están implementados en parte en Lona. Es la vía que permite comprobar valor con menos desarrollo nuevo. La ayuda nunca sustituye la decisión del entrenador/organizador ni sus obligaciones deportivas.

**Mensaje de piloto propuesto:** «Lona ayuda a clubes y organizadores a preparar veladas de boxeo amateur y a mantener sus resultados al día».

**Entrada recomendada:** boxeo amateur adulto en Madrid y su entorno, condicionada a conseguir organizadores colaboradores. Si el fundador tiene una relación mucho mejor con un circuito de Valencia, Sevilla u otra ciudad permitida, esa relación puede importar más que el tamaño de Madrid. La evidencia disponible confirma actividad madrileña, no que sea el mejor mercado sin entrevistas.

La selección de un nicho es una propuesta de captación y de recorrido principal; no autoriza borrar las otras disciplinas ni el trabajo existente. La restricción vigente de no incorporar gimnasios de Cataluña se mantiene; una expansión territorial distinta requeriría una decisión explícita.

## Lanzamiento de 8–10 semanas, medido por uso

### Semanas 1–2: descubrir el trabajo real

Entrevistar a unos 10 entrenadores y 5 organizadores de una misma zona. Pedir que enseñen cómo prepararon su último evento: documentos, cambios, tiempos, problemas y quién decide/paga. Mostrar un recorrido del producto y pedir un compromiso con un próximo evento concreto. No confundir elogios o registros con validación.

Preguntas decisivas: ¿qué tarea se repite y cuesta más?, ¿qué no puede fallar?, ¿qué datos se pueden confirmar?, ¿quién mantiene el cartel?, ¿qué herramienta reemplazaría Lona?, ¿qué pagarían después de usarla?

### Semanas 3–6: piloto con oferta comprometida

Objetivos de reclutamiento, no previsiones: 2–3 organizadores, 8–12 clubes, 80–150 competidores incorporados con permiso y **al menos dos eventos reales**. Si no existen eventos próximos, adaptar la duración para observar un ciclo real en lugar de fabricar actividad.

Alta asistida y páginas compartibles; uso cómodo desde móvil web. Conservar el canal actual de los clubes durante el piloto y medir qué trabajo deja de repetirse allí. Crear un directorio extenso con OpenStreetMap no equivale a tener clubes participantes ni con perfil reclamado.

### Semanas 7–10: repetición y pago

Una señal para ampliar sería que al menos dos organizadores vuelvan con otro evento, que más de la mitad de los clubes activos participe otra vez cuando tenga ocasión, que los resultados confirmados del circuito se cierren habitualmente en 72 horas y que al menos dos clientes acepten pagar tras el piloto. Son umbrales propuestos para este ensayo, no estándares universales ni significación estadística con una muestra pequeña.

Medir también horas de soporte por evento y margen después de ese soporte: una tarifa baja con muchas horas de trabajo no valida un negocio escalable. Si se usa solo porque Codex/fundador lo rellena todo, la repetición no prueba autoservicio.

**Expansión:** segunda zona cercana con un organizador que se comprometa; después segunda ciudad, manteniendo la misma disciplina. Solo después probar otra disciplina en una zona ya activa. Cambiar una variable principal por vez permite entender qué funciona. BJJ requerirá estudiar su flujo de torneos y las herramientas implantadas; MMA sus necesidades y ritmo de eventos, sin copiar el modelo de boxeo.

## Funciones priorizadas

| Prioridad | Qué entra | Por qué |
|---|---|---|
| P0: antes de admitir usuarios reales | Cerrar privacidad, política de menores y textos jurídicos; corregir autorización de veladas pasadas; control de identidad/duplicados y permisos por entidad | El resultado comercial no compensa publicar datos privados o hechos no autorizados. T-016 ya tiene reproducciones |
| P1: núcleo del piloto | Alta sencilla de entidad y equipo, evento, candidaturas por categorías, revisión/confirmación de cartel, cambios y alertas esenciales, exportación, resultados con fuente y rectificación | Completa una tarea concreta de principio a fin |
| P1: retorno | Mis candidaturas, próximas citas, solicitudes por responder y acceso rápido a un evento compartido | Cada usuario sabe qué debe hacer y por qué volver |
| P2: tras repetir | Seguimiento de clubes/peleadores, calendario personal, historial deportivo con evidencia, enlaces de entradas medibles | Aprovecha los datos fiables generados por el núcleo |
| P3: aplazar | Cobro interno, clases privadas como marketplace, chat general, app nativa completa, noticias como eje, ranking transversal, nuevas ciudades/disciplinas simultáneas | Añaden operaciones o dependencias antes de probar la necesidad |

Los cobros no son imprescindibles para demostrar que se puede coordinar una velada; sí hay que probar disposición real a pagar por el servicio. La web móvil debe permitir realizar el recorrido compartido con pocas barreras. Una aplicación nativa se justifica si aporta retorno probado mediante uso frecuente y avisos, no por completar una entrega técnica.

## Aura, datos y noticias

Propuesta: separar **trayectoria deportiva** de **reconocimiento de la comunidad**. Los resultados deben mostrar fuente, estado y alcance de validación; las reacciones no deben intervenir en un criterio de seguridad, aptitud o autorización para emparejar. La licencia y su vigencia, un título y una actuación son hechos diferentes. No se propone cambiar ahora la fórmula aprobada: Claude debe evaluar alternativas y llevar la decisión al fundador.

Si aura es popularidad/reconocimiento, explicarlo así. Mezclarlo con puntos por licencia, títulos o victorias en una sola cifra haría más difícil comprender qué se está comparando. Tampoco corresponde afirmar que el deportista con más aura sea mejor peleador.

Las noticias pueden acompañar el producto, pero agregar RSS no demuestra una ventaja comercial propia. Una pieza local útil —cambio de cartel, fecha límite, resultados del circuito— puede servir al núcleo. La información automática nacional debería ocupar un papel secundario, sujeto a decisión, no generar más trabajo de captación que la herramienta principal.

## Qué pide esta RFC a Claude

1. Contrastar la hipótesis con el fundador y entrevistas; responder por escrito con argumentos, sin convertir la propuesta en decisión aprobada.
2. Mapear el recorrido de la opción 1 contra las funciones existentes y T-016. Listar qué funciona, qué necesita corrección y qué falta de verdad, sin empezar una reescritura.
3. Proponer un plan reducido con P0/P1 y esfuerzo/coste de soporte, comparado con continuar F → G → D → H íntegros antes del piloto. Evitar retirar funciones ya utilizables sin decisión del fundador.
4. Separar una fecha de piloto de una fecha de apertura pública; proponer la decisión de calendario según los bloqueos y compromisos de usuarios, sin cambiar por su cuenta el 1/15 de noviembre vigente.
5. Resolver con el fundador cuatro decisiones: cliente que paga, disciplina/zona inicial, papel del aura y criterio de éxito para ampliar. Los precios de esta RFC son ensayos posibles, no una autorización de cobro.

**Respuesta del líder técnico:** pendiente.

**Resolución del fundador:** pendiente. No se han cambiado producto, arquitectura, permisos, precios ni despliegues por esta propuesta.
