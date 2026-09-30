# Análisis de la competencia

**Estado: incompleto, y este documento dice con claridad por qué.** El fundador pidió estudiar a Raunder (raunder.es) y a BoxRec (boxrec.com), ver en qué fallan y hacerlo mejor, y ver qué hacen bien y mejorarlo.
El 30 de septiembre de 2026 **no fue posible abrir ninguna de las dos webs**: la política de red del entorno de trabajo bloquea esos dominios. Además, las búsquedas públicas no devuelven información de Raunder. Por eso:

- Todo lo que aparece como **«Comprobado»** procede de fuentes públicas consultadas ese día (enlazadas abajo).
- Lo que aparece como **«Conocimiento general, sin comprobar hoy»** es lo que se sabe de BoxRec por su reputación y por documentación previa, y **hay que confirmarlo mirando la web**.
- **De Raunder no se afirma nada.** Inventar sus defectos o virtudes sería engañarse a uno mismo.

## BoxRec

### Lo que se ha podido comprobar (fuentes públicas)

- Las quejas de usuarios se centran en **récords que faltan o son incorrectos** y en errores de clasificación ([BoxRec en PissedConsumer](https://www.pissedconsumer.com/boxrec/RT-F.html), [BoxRec en Trustpilot](https://www.trustpilot.com/review/www.boxrec.com)). Son muy pocas reseñas: **es una señal débil, no una prueba**.
- Un artículo de opinión sostiene que **su proceso de actualización de récords es vulnerable a personas con interés en ellos, como promotores y representantes**, y que dejó de actualizar los récords enviados por varias comisiones reconocidas desde abril de 2016 ([BoxingTalk](http://boxingtalk.com/Op-Ed-Is-BoxRec-suppressing-legitimate-results-And-should-the-ABC-do-something-about-it-)). Es **una opinión de un medio concreto y con fecha**, no un hecho contrastado hoy.
- Se le ha criticado por la exactitud de los récords históricos; en una prueba de la asociación ABC citada por esa fuente, los de otra base de datos salieron 100 % exactos y los de BoxRec «sustancialmente inferiores» (misma cautela).
- Tiene un apartado de preguntas frecuentes propio ([FAQ de BoxRec](https://boxrec.com/forum/app.php/help/faq)) que **no se pudo abrir**.

### Conocimiento general, sin comprobar hoy (verificar antes de darlo por bueno)

- Interfaz y contenido **en inglés**, con foco en el **boxeo profesional**; el amateur tendría una cobertura escasa, sobre todo en España.
- Modelo con **límites para usuarios gratuitos y suscripción de pago** para más búsquedas y datos.
- Datos aportados y revisados por una **comunidad de colaboradores**, sin la figura de que el propio deportista gestione su ficha.
- **Sin valoración del público** al estilo de nuestra aura, ni ecosistema de otros deportes de contacto.

### Qué hace bien (a igualar y mejorar)

| Lo bueno de BoxRec | Estado | Cómo lo mejoramos |
|---|---|---|
| Ficha estándar por peleador con **récord y lista de combates** | Ya lo tenemos | En español, más clara y con nivel de respaldo visible por combate |
| **Identificador único y enlace estable** por peleador y por combate | Ya lo tenemos (enlaces con nombre) | Añadir mapa del sitio y datos para buscadores (ver siguiente tabla) |
| **Estadísticas de carrera** (porcentaje de KO, rachas, actividad) | **Falta** | Hacerlas por disciplina y visibles en la ficha |
| **Historial de rivales** y enfrentamientos entre dos peleadores | **Falta** | Comparador «cara a cara» |
| **Ránkings** | Ya lo tenemos, por aura | Por disciplina y categoría, y explicando cómo se calcula |
| **Búsqueda** por varios criterios | Parcial | Búsqueda avanzada y sugerencias mientras se escribe |
| **Cobertura histórica enorme** | No aplicable | No competimos en historia; competimos en el presente amateur |

### Dónde puede fallar (y cómo lo tenemos cubierto o no)

Se parte de las quejas comprobadas (récords incorrectos, vulnerables a intereses de terceros). Son **hipótesis a validar** con usuarios, no sentencias.

| Posible debilidad | Cómo la abordamos hoy | Falta |
|---|---|---|
| Datos incorrectos o manipulados por quien tiene interés | Niveles de respaldo, confirmación del rival, evidencia enlazada, historial de cambios, avisos de error, señales de coherencia | Comprobar identidad de organizadores; verificación por federaciones |
| Ningún control del propio deportista sobre su ficha | El peleador gestiona su ficha y su récord, y reclama la suya | Que reciba avisos cuando alguien cambie algo de su ficha |
| Idioma y foco ajenos al público español | Todo en español; foco amateur y Madrid | Probar el lenguaje con público real |
| Sin cultura de comunidad | Aura, seguir a peleadores, avisos de veladas | Contenido y notificaciones dentro de la aplicación |
| Solo boxeo | Cinco disciplinas, boxeo en cabeza | Validar categorías con federaciones |

## Raunder

**No analizado.** No se pudo abrir raunder.es y no hay información pública indexable. Según el fundador es una competencia relevante que ha dado mucho que hablar en Barcelona.

Cuando se pueda ver la web (o el fundador aporte capturas o el texto), se revisará esta lista y se completará este apartado:

1. Qué deportes y niveles cubre (¿amateur?, ¿profesional?, ¿solo boxeo?).
2. Cómo se registra un deportista y **qué comprueba** de lo que declara.
3. Cómo se registran los combates y **quién los confirma**.
4. Si hay **valoración o ránking del público** y cómo se evita manipularlo.
5. Calendario de veladas: quién lo publica y con qué filtros.
6. Gimnasios, entrenadores y organizadores: ¿tienen ficha propia?
7. Aplicación móvil o solo web; velocidad y claridad de uso para gente poco acostumbrada.
8. Modelo de negocio: qué es gratis, qué es de pago y a qué precio.
9. Zonas donde tiene fuerza y donde no (¿Madrid?).
10. Defectos visibles: errores, datos vacíos, pasos confusos, lenguaje.

## Mejoras que se proponen a partir de lo comprobado y de lo general

Ordenadas por impacto. Son **propuestas nuestras**, no copia de nadie:

1. **Estadísticas de carrera por disciplina** en la ficha (victorias por KO o sumisión, racha actual, última actividad, años activo).
2. **Comparador «cara a cara»** entre dos peleadores y **historial de rivales**.
3. **Tarjeta para compartir** una ficha o un ránking en redes (imagen y enlace con vista previa): es lo que da audiencia a los peleadores, que es el objetivo de la aplicación.
4. **Preparación para buscadores**: mapa del sitio, títulos y descripciones por ficha y datos estructurados de veladas.
5. **Avisos al propio peleador** cuando alguien registre un combate suyo, lo dispute o le dé aura.
6. **Búsqueda avanzada** con sugerencias.
