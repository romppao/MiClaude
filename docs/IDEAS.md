# Ideas de Ring España

Registro vivo de las ideas: de dónde salieron, en qué estado están y qué queda por probar.
Sirve para revisar los principios del proyecto y para recuperar ideas aparcadas. Se actualiza en cada sesión (ver [`DIARIO.md`](DIARIO.md)).

Estados: 🟢 hecho · 🟡 en marcha / parcial · 🔵 planificado · ⚪ aparcado · 🔴 descartado

## Ideas fundacionales (no negociables)

| # | Idea | Origen | Estado |
|---|---|---|---|
| F1 | Hacer crecer la comunidad boxística española y dar visibilidad a sus boxeadores | Visión inicial del fundador | 🟡 |
| F2 | **Amateur primero**: hoy son aficionados, mañana la cara del boxeo español en el mundo | Giro tras ver el primer MVP | 🟡 |
| F3 | **El público valora**: un aficionado puede reconocer a un peleador después de verlo pelear (idea original: puntuarlo con estrellas; hoy es el aura) | Giro tras ver el primer MVP | 🟢 |
| F4 | **Madrid primero**, luego España; adelantarse a la competencia de Barcelona | Visión inicial del fundador | ⚪ Prioridad operativa histórica; no comunicarla al público ni usarla como filtro inicial (petición del 3 de octubre de 2026, F16) |
| F5 | **Arquitectura y estructura antes que diseño gráfico** | Fundador | 🟢 (se aplaza el diseño) |
| F6 | Ver es público; **votar, registrar y publicar exige registro** | Fundador | 🟢 |
| F7 | **Veracidad de los datos** sin depender de trámites federativos al principio; colaborar con las federaciones a medio plazo | Fundador | 🟡 (estrategia escrita) |
| F8 | Documentar todo el proceso para poder contarlo y retomarlo | Fundador | 🟢 (estos documentos) |
| F10 | **El diseño visual se deja para el final** y debe tener **identidad propia**, sin el aspecto genérico que suele producir Claude, para que la app no se asocie con una IA. Se trabajará con briefing, varias direcciones y, a ser posible, un diseñador humano | Fundador (reiterado) | ⚪ (aplazado a propósito; principio documentado en `CLAUDE.md`) |
| F11 | **Ecosistema de todos los deportes de contacto en España** (MMA, kickboxing, K-1, jiu-jitsu…) con **el boxeo en cabeza**. Ser pioneros | Fundador | 🟡 Seis disciplinas implementadas, con categorías por reglamento; «boxeo en cabeza» queda como antecedente interno y se sustituye en comunicación pública por F16 |
| F12 | **Todo en español** (interfaz, correos, documentación, commits y direcciones visibles) | Fundador | 🟢 (aplicado a lo visible; el código interno sigue en inglés: preguntar si también debe cambiar) |
| F13 | **Monetizar la aplicación** con funciones premium, **después** de terminar la estructura básica. Sin vender verificación ni posiciones de ránking | Fundador | ⚪ (aplazado a propósito) |
| F9 | **Muy intuitiva para todo el mundo** (niños, jóvenes, adultos y mayores, con cualquier nivel tecnológico), siempre con tono serio y profesional. Aplica a esta y a toda aplicación futura | Fundador | 🟡 (aplicado a los flujos principales; falta organizador, moderación, medición de accesibilidad y pruebas con personas reales) |
| F14 | **Funcionalidad completa y sin fallos antes que diseño; organización clara para poder ampliar el equipo.** «Quiero que sea perfecta, cómoda de usar, que no haya ningún fallo»; «no puede ser una maraña de cables: tiene que estar todo reglado, medido y estructurado» | Fundador, 1 de octubre de 2026 | 🟡 (código por dominios, guía `DESARROLLO.md`, mapa funcional generado y pruebas por personas en marcha) |
| F16 | **Ninguna ciudad ni disciplina debe sentirse excluida**: no presentar Madrid o boxeo como prioridad pública; filtros iniciales nacionales y multidisciplina, altas sin suposiciones | Fundador, petición urgente del 3 de octubre de 2026 | 🟢 Integrado con #11 y comprobado en la demo pública el 3 de octubre de 2026 |

## Ideas de producto

| Idea | Origen | Estado | Notas |
|---|---|---|---|
| **Aura en vez de estrellas:** los aficionados dan «aura» a un peleador (cultura de redes, público joven); el ránking se ordena por su aura **dentro de su categoría de peso y disciplina** | Fundador | 🟢 (v1) | Decisión del fundador: una aura por persona y combate. Se puede quitar. Ránking por disciplina, zona y periodo |
| **Récord de partida:** al crear la ficha, el peleador indica cuántos combates lleva; si recuerda su récord, lo pone (V-D-E); si no, solo el total. Desde ahí registra los nuevos | Fundador | 🟢 (v1) | Autodeclarado y no comprobable: se muestra siempre etiquetado. Riesgo abierto: se puede editar después |
| **Varias disciplinas** con resultados y divisiones propias (KO/TKO/decisión; sumisión y puntos en jiu-jitsu/MMA) | Fundador | 🟢 (v1) | Boxeo, MMA, kickboxing, K-1 y jiu-jitsu; una ficha por persona; récord separado por disciplina |
| **Hasta 3 clics de aura por combate como función premium** | Fundador | ⚪ | Aplazado hasta terminar la estructura básica. Riesgo: que pagar dé más peso al aura desvirtúe el ránking |
| Otras funciones premium candidatas (no se venden verificación ni ránking): ficha ampliada con galería y estadísticas avanzadas, herramientas para organizadores (carteles, entradas, estadísticas), páginas de gimnasio con más funciones, avisos y comparador ampliados, sin publicidad | Propuesta | ⚪ | Decidir con el fundador |
| Estadísticas de carrera por disciplina (porcentaje de KO, racha, actividad) | Análisis de competencia | 🔵 | Falta hoy |
| Comparador «cara a cara» e historial de rivales | Análisis de competencia | 🔵 | |
| Tarjeta para compartir fichas y ránkings en redes | Análisis de competencia | 🔵 | Da audiencia a los peleadores |
| Preparación para buscadores (mapa del sitio, datos estructurados) | Análisis de competencia | 🟡 | Mapa del sitio, `robots.txt` y títulos hechos; faltan datos estructurados |
| Avisos al propio peleador cuando alguien toca su ficha o le da aura | Análisis de competencia | 🔵 | |
| Aura ponderada o normalizada (por número de combates, por «lo vi en directo», por antigüedad de la cuenta) | Riesgo detectado | 🔵 | El aura absoluta favorece a quien compite más |
| Bloquear o moderar la edición del récord de partida una vez hay combates registrados | Riesgo detectado | 🔵 | Evita inflarlo a posteriori |
| Validar categorías de peso y formas de terminar con las federaciones de cada disciplina | Estrategia con federaciones | ⚪ | Hoy son orientativas |
| Récord calculado desde los combates, nunca guardado | Diseño | 🟢 | Evita desincronización |
| Valoración anclada a un combate concreto | Diseño (anti-manipulación) | 🟢 | Ahora aplicada al aura: una por persona/combate/peleador; participantes no la dan |
| Media bayesiana en el ránking de estrellas | Diseño | 🔴 | Sustituida por el aura; con un total de aura ya no hay una media de notas |
| Niveles de respaldo del combate (autodeclarado → confirmado → verificado) | Necesidad: el amateur se registra a sí mismo | 🟢 | Se muestra en la ficha |
| Reclamar una ficha creada por otro | Necesidad: el rival ya existe sin cuenta | 🟢 | Aprobación de moderador |
| Rol organizador (cartel y resultados verificados) | Necesidad: fuente natural de verdad | 🟢 | Aprobación de moderador |
| Enlace de evidencia en el combate (acta, cartel, vídeo) | Estrategia de veracidad | 🟢 | Solo http(s); editable por participantes, organizador y admin |
| Historial de cambios (audit log) | Estrategia de veracidad | 🟢 | Solo visible para moderadores; ¿hacerlo público por combate? |
| Sello de verificado para gimnasios y organizadores | Estrategia de veracidad | 🟢 | Nota de evidencia obligatoria, interna |
| Avales cruzados entre entidades verificadas | Estrategia de veracidad | 🔵 | Requiere cuentas de responsable de gimnasio |
| Historial de cambios público por combate | Transparencia | ⚪ | Decidir qué se muestra y qué no |
| Auditoría de usabilidad de lo ya construido frente al principio F9 (lenguaje llano, mensajes de confirmación y de error, etiquetas, contraste, accesibilidad) | Fundador | 🟡 | Hecha en los flujos principales; pendiente el resto y la medición | Sin cambiar el estilo visual sin consultar |
| Comprobaciones automáticas de coherencia (mismo día, duplicados, edades) | Estrategia de veracidad | 🟡 | Duplicados bloqueados y señales de proximidad hechas; falta la de edades |
| Botón «reportar dato» | Estrategia de veracidad | 🟢 | Un aviso abierto por usuario/elemento, máx. 10 al día |
| Puntuación de fiabilidad de organizadores | Estrategia de veracidad | 🔵 | |
| Detección de colusión en auras y confirmaciones | Riesgo detectado | 🔵 | |
| Seguir a peleadores + avisos de veladas | Fomentar afición | 🟢 | «Peleadores que sigo» (en Mi cuenta) y aviso por correo con enlace de baja; solo combates de organizador |
| Preferencias de aviso por correo (poder darse de baja) | RGPD / usabilidad | 🟢 | Interruptor en «Mi cuenta» y enlace de baja en cada correo (sin iniciar sesión) |
| Página «¿Cómo funciona?» | Principio F9 | 🟢 | `/ayuda` |
| Explicaciones en el primer uso de cada función (guías breves) | Principio F9 | 🔵 | |
| Avisos dentro de la app (además del correo) | Fomentar afición | ⚪ | |
| Fotos y vídeo de combates | Comunidad | ⚪ | Cuidado con menores y derechos |
| Perfiles de gimnasio gestionados por su responsable | Comunidad | ⚪ | |
| Mapa de gimnasios de Madrid | Descubrimiento | ⚪ | |
| Grupo de moderadores locales de confianza (entrenadores, antiguos peleadores, árbitros) | Ventaja de operar en una ciudad | 🔵 | No es código: es organización |
| Colaboración con Federación Madrileña / Española (actas y licencias como nivel máximo) | Fundador | ⚪ | Cuando haya tracción demostrable |
| Campo opcional de nº de licencia (sin verificar hasta que haya acuerdo) | Estrategia de veracidad | ⚪ | |
| API pública, app móvil, importación de datos federativos | Escala | ⚪ | |
| SEO: mapa del sitio, `robots.txt`, títulos propios y comprobación de salud | Análisis de competencia / escala | 🟡 | Hecho; faltan favicon e imagen para compartir (son diseño) |
| **Selector de tres opciones al registrarse y al entrar:** A) usuario normal (ver peleadores, cuándo se pelea), B) peleador (ficha, torneos…), C) organizador, promotora, federación. «No sé, eso ya lo veremos más tarde» (el detalle de B queda abierto) | Fundador, 1 de octubre de 2026 | 🔵 | En diseño (ver `docs/ORGANIZACIONES.md` cuando exista) |
| **«Una especie de CRM» para federaciones y promotoras:** «si quiero que publiquen ahí cosas como veladas, administración de peleadores, todo ese tipo de cosas, debemos darle las facilidades para ello» | Fundador, 1 de octubre de 2026 | 🔵 | Hoy el organizador solo crea veladas, monta el cartel y pone resultados. Diseño con flujo de agentes (3 enfoques + jurado) en curso |

### Ideas surgidas en la auditoría del código (30 de septiembre de 2026)

Origen de todas: la auditoría multiagente (ver [`AUDITORIA.md`](AUDITORIA.md)) y el criterio del asistente al corregirla. El fundador pidió «arregla lo confirmado por prioridad»; estas ideas son **propuestas del asistente a validar**, salvo que se indique.

| Idea | Origen | Estado | Notas |
|---|---|---|---|
| Recuperar la contraseña por correo (que además verifica el correo, para que nadie retenga un correo ajeno) | Auditoría (hallazgo 4) | 🟢 | `/recuperar` |
| «Mi cuenta»: corregir datos, descargar una copia de los datos y eliminar la cuenta (la ficha con combates queda anónima) | Auditoría (RGPD, hallazgo 19) | 🟢 | Criterio del asistente: los combates pertenecen también al récord de los rivales, así que se conservan |
| Cola de combates «en revisión» en moderación, con «Restaurar» | Auditoría (hallazgo 11) | 🟢 | |
| Fichas provisionales de rivales: solo nombre e inicial, sin listados ni buscadores hasta que se reclamen o el combate se confirme | Auditoría (hallazgo 17) | 🟢 | Protege a quien no tiene cuenta |
| Denunciar y retirar comentarios de aura | Auditoría (hallazgo 21) | 🟢 | |
| Límite de intentos de acceso, registro y reenvío | Auditoría (hallazgo 2) | 🟢 | |
| Plazos de conservación de datos (cuentas sin verificar 30 días, solicitudes 90 días, avisos 12 meses, historial 3 años) | Propuesta del asistente | 🟡 | **Los plazos los puso el asistente; el fundador debe validarlos** (con criterio jurídico) |
| Texto de privacidad en `/privacidad` | Propuesta del asistente | 🟡 | **Requiere revisión jurídica** y definir responsable y contacto |
| Búsqueda sin tildes y por varias palabras; listados paginados | Auditoría (hallazgos 42, 43, 50) | 🟢 | Si crece la base de datos, pasar a `pg_trgm` |
| Informar a quien envía un aviso de cómo se ha resuelto | Auditoría (hallazgo 60) | 🔵 | |
| Exigir nota de evidencia al aprobar a un organizador (como en el sello de gimnasio) | Auditoría (hallazgo 93) | 🟢 | |
| Moderar las veladas publicadas por usuarios antes de que salgan en el calendario | Auditoría (hallazgo 22) | 🔵 | Decisión del fundador |
| Conservar lo escrito en los formularios tras un error | Auditoría (hallazgo 77) y principio F9 | 🟢 | Bloque 6; mejorada el 1 de octubre (también si el error se repite y se abre el desplegable) |
| Migraciones de Prisma en lugar de `db push` | Despliegue | 🟢 | `prisma/migrations`; el CI comprueba que reproducen el esquema |

### Ideas surgidas de las pruebas por personas y la revisión (1 de octubre de 2026)

Origen: el flujo de personas de prueba (ver [`pruebas/hallazgos-2026-10-01.md`](pruebas/hallazgos-2026-10-01.md)) y el criterio del asistente.

| Idea | Origen | Estado | Notas |
|---|---|---|---|
| Recordar a dónde iba la persona (sin sesión, o al registrarse desde «Entra para…») y devolverla allí | Persona «visitante» | 🟢 | Cookie de 2 horas con la ruta interna; `/verificar` ofrece volver |
| Tablas de combates que se apilan en el móvil, con la acción principal siempre a la vista | Persona «visitante» | 🟢 | `table.apilada` |
| Mostrar siempre por qué algo no se puede hacer (por ejemplo, «Se podrá dar aura cuando se celebre») en lugar de dejar un hueco | Persona «visitante» | 🟢 | |
| Mapa funcional generado del código (pantallas → acciones → permisos → tablas) y comprobado en el CI | Fundador (1 de octubre: «una red clara de a dónde seguir») | 🟢 | `npm run mapa` |
| Guion de personas de prueba como práctica fija antes de dar por bueno un bloque | Fundador y asistente | 🟡 | Primera tanda incompleta por el límite de uso; repetir por fases |
| Restaurar una ficha ocultada por moderación durante unos días | Revisión de acciones (hallazgo A6) | 🔵 | Decisión del fundador: choca con el derecho de supresión |
| Devolver a la pantalla de elegir rival (con los datos) cuando hay un error tras elegir entre homónimos | Revisión de interfaz (I5) | 🔵 | |
| Icono de la pestaña (favicon) e imagen para compartir | Persona «visitante» (V17) | ⚪ | Es diseño: entra en la fase de diseño visual |
| Una persona de moderación distinta a quien denuncia: hoy puede resolver sus propios avisos | Propuesta del asistente | 🔵 | Cuando haya más de una persona en moderación |

## Ideas descartadas

| Idea | Por qué se descartó |
|---|---|
| Copiar el modelo BoxRec tal cual (foco profesional, datos de fuentes oficiales) | El valor está en el amateur y en la comunidad; no hay fuentes oficiales abiertas para el amateur español |
| Empezar por app móvil nativa | Sin SEO y más coste; la web responsive llega antes y se indexa |
| Guardar el récord como número en la ficha | Se desincroniza; se calcula |

## Preguntas abiertas

- **Nombre:** «Ring España» encaja peor ahora que hay MMA, kickboxing, K-1 y jiu-jitsu. El vocabulario ya es «peleador»; falta decidir el nombre de la marca.
- **Jiu-jitsu:** en torneos con muchos combates el mismo día se ha desactivado la señal de «combates muy seguidos»; falta decidir cómo modelar un torneo (varias eliminatorias) de forma más natural.
- **Aura:** ¿se normaliza por número de combates o se pondera (lo vi en directo, antigüedad de la cuenta)? Hoy es el total absoluto, con filtro de periodo.
- **Récord de partida:** ¿se bloquea su edición tras el primer combate registrado, o lo revisa un moderador?

- **Privacidad:** ¿se validan los plazos de conservación y el texto de `/privacidad`? Hace falta revisión jurídica, definir el responsable del tratamiento y un correo de contacto.
- **Registro:** hoy el formulario dice «ya hay una cuenta con ese correo» (claro para la persona, pero revela quién tiene cuenta; se limita por IP). ¿Se acepta?
- **Veladas:** ¿se moderan antes de publicarse cuando no las crea un organizador aprobado?
- **Aura:** ¿una por persona y combate, o por persona, combate y peleador? Hoy vale la segunda.
- **Usabilidad (F9):** ¿tratamiento de «tú» o de «usted»? Hoy la app tutea; para un público con personas mayores conviene decidirlo con criterio y mantenerlo en toda la app.
- **Usabilidad (F9):** ¿qué grupos de personas reales (edades, familiaridad con la tecnología) probarán la app y cuándo?

- ¿Qué prueba concreta de identidad se pide al reclamar una ficha o pedir ser organizador (sin burocracia federativa)?
- ¿Cuántos combates confirmados exige el ránking para que un peleador aparezca?
- ¿Cómo se trata a los peleadores menores de edad (privacidad, consentimiento parental, visibilidad de su ficha)?
- ¿Modelo de sostenibilidad del proyecto (gratis, patrocinio de gimnasios y promotoras, entradas…)?
- ¿Nombre definitivo y marca? («Ring España» es un nombre de trabajo.)

- **Modo demostración con cambio de papel** (2 de octubre de 2026, surgió de «lánzame una demo» desde el móvil): botón para probar como aficionado / peleador / organizador / moderador con una sola cuenta. Es un andamio para probar, no una función de producto; pero anticipa el selector A/B/C que pidió el fundador (tarea 13).


## Aportaciones de la comparación — 3 de octubre de 2026

Origen: petición del fundador de comparar Raunder y BoxRec; propuestas de Codex tras inspección pública. Detalle y límites en `COMPETENCIA.md`.

- **Preparado en rama de aportaciones:** entrada por objetivos usando rutas existentes, ránking explicado, ayuda sobre respaldo, filtros individuales de veladas y calendario coherente. Integración pendiente de CI; no es rediseño gráfico.
- **Propuesto, no implementado:** información práctica de gimnasios (horarios, disciplinas, contacto y fecha de actualización) con responsable de mantenimiento; trayectoria con últimos resultados y estadísticas separadas por disciplina/nivel/respaldo.
- **No priorizado ahora:** reservas/pagos/sparrings y CRM amplio; primero validar recorridos básicos y la gestión de una velada. No se descartan definitivamente.
- **Corregida la premisa competitiva:** no basar la diferenciación en que BoxRec sea exclusivamente boxeo/inglés/sin público, ni en que Raunder no cubra Madrid. Nuestra propuesta debe demostrarse por utilidad y fiabilidad.

## Continuación — 3 de octubre de 2026

Origen: «continua el trabajo» del fundador y pendiente de validación de `APORTACIONES-CODEX.md`.

- **Validado en CI (propuesta #9, ejecución `37110167176`):** recorrido real de récord amateur y profesional en la misma disciplina, categorías correctas por nivel, resultados históricos, NC y enlace al respaldo. Sus 17 comprobaciones pasan en las fichas privada y pública, con datos ficticios propios. Integración pendiente.
- **Prioridad mantenida:** cerrar validación antes de ampliar funcionalidades. Las pruebas con personas reales, la paginación de moderación y las decisiones del fundador siguen pendientes.


## Categorías por edad y reglamento — 3 de octubre de 2026

Origen: fundador, «hay infinidad de categorías desde schoolboys hasta élite […] informaros bien y aplicarlo correctamente».

- **Implementado en rama de categorías:** divisiones versionadas de edad/sexo y pesos RFEBoxeo 2026, IFMA y WAKO ring/tatami; edades IMMAF 2026 e IBJJF. Ficha actual y categoría del combate independientes; búsqueda, ránking histórico, formación sin combate y guardas de edad. Validación final local aprobada (327 unitarias, 289 comprobaciones E2E, axe 0); integración pendiente. Detalle en `APORTACIONES-CODEX.md`.
- **Pendientes explícitos:** tablas de peso IMMAF vigentes; IBJJF con cinturón y kimono/sin kimono; licencias, modalidades específicas, reglas de rounds y emparejamientos por edad y torneos de varios días. Un catálogo no resuelve por sí solo consentimiento/publicación de menores.
- **Descartado:** asignar automáticamente élite/masculino a los datos anteriores, o compartir los pesos masculinos adultos con juveniles y mujeres. Daría una clasificación inventada.


## 3 de octubre de 2026 — identidad opuesta a Raunder

Origen: petición expresa del fundador de propuestas visuales y de una gama opuesta a Raunder. Estado: exploración; petróleo/marfil recomendado por Codex, pendiente de elección del fundador. Se descartan rojo óxido y naranja como marca. Referencia completa en [DISENO.md](DISENO.md). No cambia la prioridad funcional ni aplica colores a la demo.

Ajuste en la misma sesión: el fundador no se mostró convencido con petróleo/marfil y pidió más garra y valentía. Recomendación actual: azul noche, amarillo oro y blanco cálido; propuesta mostrada, todavía no elegida. Véase DISENO.md.


## Decisión del fundador — 3 de octubre de 2026 — color oficial

«He decidido que el color oficial de la aplicación será este #be33f5». Estado: **color decidido**, sustituye las paletas anteriores. Diseño todavía abierto: busca más energía juvenil y comunidad. Fuentes aportadas en una imagen de quince recursos, revisadas con límites en DISENO.md. No interpretar como aprobación de la última maqueta ni como autorización para desplegarla ya.

## Integración y publicación de la demo — 3 de octubre de 2026

Petición expresa del fundador: «Actualiza ya la página en GitHub para que pueda ver la demo actualizada con todos estos cambios». La propuesta #11 integra el trabajo funcional de #8/#9/#10 y la comunicación inclusiva en la rama de la demo. Comprobación pública: portada nacional, ránking sin filtros de disciplina/nivel/provincia, ayuda con división por edad y salud de aplicación/base, todas 200. Los pendientes normativos y de diseño anotados anteriormente siguen abiertos.
