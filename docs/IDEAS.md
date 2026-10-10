# Ideas de Ring España

Registro vivo de las ideas: de dónde salieron, en qué estado están y qué queda por probar.
Sirve para revisar los principios del proyecto y para recuperar ideas aparcadas. Se actualiza en cada sesión (ver [`DIARIO.md`](DIARIO.md)).

Estados: 🟢 hecho · 🟡 en marcha / parcial · 🔵 planificado · ⚪ aparcado · 🔴 descartado

## Ideas fundacionales (no negociables)

| # | Idea | Origen | Estado |
|---|---|---|---|
| F1 | Dar visibilidad a la comunidad española de deportes de contacto | Visión inicial ampliada por el fundador a varias disciplinas; comunicación inclusiva del 3 de octubre | 🟡 |
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
## Aplicación de los diseños aprobados — 3 de octubre de 2026

Origen: el fundador pidió «ya puedes aplicar todo esto a la aplicación en GitHub» para verlo en Render. Se implementa #BE33F5 con brillo, esquinas redondeadas, portada de comunidad adaptable y la misma cabecera para peleadores, gimnasios, entrenadores, promotores y federaciones. Las fotos y banners son independientes, con encuadre horizontal/vertical y eliminación. La imagen de portada es ilustrativa y sus personas ficticias.

Los peleadores conservan nivel amateur/profesional y categoría por disciplina. Jiu-jitsu incorpora cinturón y grados opcionales, marcados como declaración del deportista; no son una acreditación federativa. Se conservan récords por disciplina y aura por combate.

### Implementación y permisos

Nuevo módulo `src/lib/profiles`, componentes ProfileHeader/ProfileEditor y editor `/perfiles/[kind]/[id]/editar`. Peleadores y promotores editan su propio perfil; moderación puede editar todos. Moderación asigna gimnasios, entrenadores y federaciones a cuentas con correo confirmado; el titular encuentra sus perfiles en Mi cuenta. Las federaciones se crean desde el directorio por moderación y no llevan acreditación automática. No se inventan perfiles de entidades ni se asigna su control automáticamente.

La migración `20261003140000_identidad_perfiles` añade Profile y cinturón/grados; no borra registros existentes. Fotos WebP en PostgreSQL para persistir entre despliegues de Render sin disco persistente. Sharp comprueba formato real, tamaño máximo 4 MB por imagen, máximo 25 millones de píxeles, descarta animaciones, retira metadatos y reduce dimensiones. La ruta de imágenes verifica visibilidad y permisos; no publica imágenes de fichas ocultas. La exportación de cuenta incluye las imágenes; anonimizar un peleador retira su personalización y graduación.

### Validación y despliegue

339 pruebas unitarias pasan y la compilación de producción pasa. Nueva prueba de navegador `tests/e2e/perfiles.mjs`: subida real, persistencia, encuadre, cinturón visible, otra cuenta rechazada, eliminación e imágenes ocultas. La validación completa de PostgreSQL, migraciones, navegador y accesibilidad se ejecuta en CI antes de integrar. No hay PostgreSQL disponible en este entorno local. Se incorporan correcciones verificadas de los selectores y datos de las pruebas antiguas; no se desactiva ninguna prueba. El estado final de CI y publicación se registrará en el PR.

Render está configurado en `render.yaml` para la rama `claude/ring-espana-mvp`; `scripts/arranque-demo.sh` aplica migraciones. La actualización se ha combinado con la rama vigente de la demo (7580902), preservando las categorías por edad, la comunicación inclusiva y el calendario incorporados durante el trabajo.

## Verificación opcional, trayectoria y menú — 3 de octubre de 2026

Origen: fundador. «Va a ser complicado que entre rivales se acepten los resultados […] pueden haber piques post combate». «Un peleador que haya sido campeón de su comunidad o de España, no puede partir con los mismos puntos de AURA». «Debemos darle la oportunidad de ser honestos […] el ring no miente». «La verificación por entrenadores y federaciones también es opcional […] al ser verificado por una federación obtendrá más puntos de AURA». Autoriza: «Perfecto empieza a configurar todo esto».

**Implementado en rama:** declaraciones de títulos, revisión opcional sin veto del rival, permisos de acreditación separados de perfiles, bonus federativo superior, desglose y conservación histórica. Escala v1 inicial de Codex: 20/50/80; documentación +25 %, entrenador/organizador +50 %, federación +100 %; no sumas de niveles ni títulos repetidos por categoría. **Pendiente:** calibración con datos reales, importación asistida de carreras extensas, detección de patrones de fraude y puntuación deportiva futura con información suficiente. No se exige un mínimo de resultados verificados para participar en el aura.

Menú: «Me gusta como tiene distribuido el menú raunder lo debemos coger y mejorarlo», con captura. **Implementado en rama:** cuatro grupos por actividades, panel accesible y accesos según permisos. La captura aporta distribución, no aprobación de otras funciones. Sparring, formación y reservas siguen siendo ideas futuras; no se muestran como servicios implementados. Se conserva el diseño trabajado con ChatGPT Work.

Estado final de este bloque: #14 integrada y comprobada en Render, CI #131 aprobado. Los estados «en rama» de los párrafos anteriores quedan superados; los pendientes de calibración y funciones futuras se mantienen.

## Pulido funcional y diseño aplazado — 3 de octubre de 2026

Origen: fundador. «Que más queda por hacer? pulamos la aplicación hasta el más mínimo detalle, luego al final volveremos al diseño […] se ve muy desorganizado y saturado». El diseño actual es provisional. No rehacer ahora paleta, tipografía o composición; retomar con un briefing al final.

Implementado en esta rama: colas e historial paginados, continuación tras decidir, avisos visibles, categoría/respaldo efectivo en revisión, control de resultados/respaldos concurrentes y decisiones desconocidas. La búsqueda de acreditaciones dispone de respuesta vacía y limpieza de filtros. Se actualiza el relevo: varias tareas estaban resueltas pero seguían descritas como pendientes. La hoja vigente está en PULIDO-FUNCIONAL; los catálogos deportivos incompletos, herramientas de entidades, servicio real y pruebas con personas siguen abiertos.

El bloque de pulido funcional se integra en #15 con CI #137 aprobado. Próximo orden: integridad del historial/catálogos deportivos, herramientas de entidades, recorridos reales y preparación de servicio; pruebas con personas y briefing visual al cerrar la fase funcional. El diseño continúa provisional según la última petición; #13 sigue sin integrar. Evidencia completa y cierre de demo en APORTACIONES-CODEX.

El retorno a respaldos se integra en #16; CI final #142 aprueba 406 unitarias, 395 checks de navegador y axe en 37 pantallas sin incumplimientos. La hoja PULIDO-FUNCIONAL mantiene los siguientes bloques abiertos; la composición sigue provisional y no se ha adelantado un rediseño.

- **Registro por tres paneles A/B/C** (6 de octubre de 2026, petición del fundador: «Panel A para el usuario normal… Panel B peleadores. Panel C promotoras, federaciones»): **hecha** (T-011). Siguen para la fase de diseño los perfiles ricos de peleadores y federaciones. Idea abierta: que el panel de peleador pida ya la disciplina y la provincia (hoy se piden al crear la ficha, para no alargar el alta).
- **Imágenes con ETag y 304** (6 de octubre de 2026, de la revisión de escalabilidad): hecha. Falta sacar las fotos de PostgreSQL (T-004 parte 2, a la espera del proveedor que elija el fundador).

- **Presupuesto mínimo y proveedores intercambiables** (6 de octubre de 2026, el fundador: «el mínimo capital posible […] fáciles de modificar en un futuro»): **propuesta hecha**, a la espera de aprobación (ADR-003). Ideas derivadas: copia nocturna `pg_dump` a R2 con prueba de restauración (T-012); interfaz `ImageStore` con drivers `db` y `s3` (T-004); filtro de datos personales antes de enviar errores a Sentry (T-010); caché de lecturas públicas para bajar el coste del tramo de 100.000 usuarios (T-005).
- **Política de menores con la edad como parámetro** (6 de octubre de 2026, de la investigación legal): edad mínima 14 (podría subir a 16 por una ley en trámite); menores de 14 solo con perfil gestionado por un adulto; perfiles de menores de 18 sin foto, con apellido abreviado y solo provincia (T-014). Pendiente de criterio jurídico.
- **Dominio propio (~7 €/año)** como primer gasto real: sin él no hay correos reales ni verificación de cuentas. Idea derivada: cuenta de correo del dominio con reenvío gratuito para el contacto de privacidad.

- **Prueba de ingreso objetiva «La escalera»** (6 de octubre de 2026, el fundador: «algo para medir bien el nivel de nuestros ayudantes»): **hecha** ([PRUEBA-ESCALERA.md](PRUEBA-ESCALERA.md)). Ideas derivadas: repetirla cada vez que cambie un modelo («examen de reválida»), con retos nuevos para que no se memoricen; añadir un reto de nivel 5 cuando alguien saque todo.
- **Límites para menores al final de la fase básica** (6 de octubre de 2026, el fundador: «no quiero impedir a los más pequeños que puedan utilizar esta app […] limitaremos alguna cosilla, será el último punto, después del diseño»): decidida la política de **no pedir edad al crear la cuenta**; fecha de nacimiento solo en la ficha. Pendiente: T-014 (límites de comentarios, fotos e imágenes delicadas) y decidir si la fecha de nacimiento es obligatoria en la ficha.
- **Brevo como recambio de Resend** (6 de octubre de 2026, segunda verificación): 300 correos al día gratis y empresa europea; se activa si se superan los 100 diarios antes de querer pagar.

## Diseño v3 — propuestas del fundador (7 de octubre de 2026, Claude Design)

Palabras del fundador: «Me gustaría incluir estas propuestas y en caso de que ya estén, quisiera pulirlas».
1. **Propuestas de combate y sparring entre peleadores** — **hecho (8 oct):** «Retar a combate» y «Proponer sparring» en la ficha, y «Retos y sparrings» (`/propuestas`).
2. **Cuarto registro: entrenadores**, que se promocionan y venden clases individuales y colectivas — **hecho en parte (8 oct):** cuenta de entrenador, perfil público y clases con precio. Pendiente: reservas y pagos (decisión del fundador: ¿cobro dentro de la aplicación?).
3. **Veladas creadas por clubs o promotoras con inscripción de peleadores** — **hecho (9 oct):** el organizador abre la inscripción; los peleadores piden participar; el organizador filtra, ordena, acepta o rechaza (también varias a la vez) y descarga la lista.
4. **Récord amateur privado** (solo el número de combates, salvo que el peleador lo publique) — **hecho (8 oct).**
5. **El aficionado da aura también a promotoras y clubes, y comparte vídeos y fotos de una velada** — vídeos y fotos **hechos (8 oct, fase 2a)**; el aura a promotoras y clubes sigue pendiente (fase 2).
6. **Highlights del peleador en su ficha** («ya luego retocaré cosas de código con Claude Code») — **hecho (8 oct):** vídeo por enlace o foto, uno destacado.
7. «Las formas de terminar deben encajar con la disciplina y la modalidad; en boxeo no tiene sentido la sumisión» — **hecho en parte (8 oct):** el formulario solo ofrece las de la disciplina; los nombres amateur propuestos por el diseño (RSC, RSC-I, W/O…) **no se aplican** hasta confirmarlos con las federaciones (decisión del fundador: mantener la lista del repositorio por ahora).


## 8 de octubre de 2026 — Mantenibilidad sin asistentes de IA

- **Transferencia completa a un programador humano** (fundador, 8 oct: «absolutamente todo el código […] esté bien explicado»): implementada como propuesta en rama `codex/documentacion-mantenibilidad-2026-10-08`; manual, contratos y explicación individual de cada archivo mantenido. Pendiente de revisión/integración y prueba de transferencia independiente.
- **Detectar documentación omitida/desactualizada en CI** (Codex, derivado de esa petición): implementado catálogo explícito y generador sin dependencias; obliga a explicar archivos nuevos y regenerar salida, sin fingir que cobertura automática certifica calidad del texto.
- **Verificar autonomía de un programador nuevo** (Codex, derivado de la petición): pendiente; arrancar en base local propia, seguir un flujo, localizar regla/permisos/prueba y hacer un cambio sin chats. Registrar atascos para mejorar las guías.

## Fase 2a del diseño v3 (8 de octubre de 2026)

Palabras del fundador: «después de iniciar sesión a todos los usuarios les aparece la misma pantalla de inicio […] noticias actuales de la escena de los deportes de contacto», de fuentes fiables y variadas («canales de YouTube, periódicos, federaciones»); «una subpantalla de inicio específica de cada disciplina»; «en el menú solo te pueden aparecer las opciones del usuario», salvo el entrenador (entrenador, club y promotora); «el entrenador podrá crear veladas e interclubs»; un espacio para que el aficionado suba lo grabado en la velada «para que los peleadores puedan obtener contenido de sus combates», «en la app de verdad y, si no es viable, mediante enlaces».
- **Portada común con noticias** — **hecha (8 oct)**; fuentes por comprobar en la demo (`TRASLADO.md` §7.23).
- **Portada de cada disciplina** — **hecha (8 oct).**
- **Menú por tipo de cuenta** — **hecho (8 oct)**; lo propio de cada cuenta en «Mi panel».
- **Entrenador organiza veladas e interclubs** — **hecho (8 oct).**
- **Vídeos y fotos del público** — **hechos (8 oct)**; subida real con R2 cuando el fundador cree el cubo (`VIDEOS.md`).
- **Highlights con vídeo subido** — **hecho (8 oct).**
- Ideas derivadas (Claude, 8 oct), **pendientes**:
  - Limpieza automática de vídeos subidos que nadie llegó a publicar, y miniaturas de los vídeos.
  - «Añadir a mis highlights» desde un vídeo del público de su propio combate (con aviso a quien lo grabó).
  - Avisar al peleador cuando alguien comparte un vídeo de su combate (correo opcional, como los avisos a seguidores).
  - Que cada persona elija qué fuentes de noticias quiere ver, o silenciar una.
  - Canales RSS propios de medios y federaciones españolas en lugar de Google Noticias, si el fundador lo prefiere por las condiciones de uso.

## Publicación en las tiendas (8 de octubre de 2026)

Palabras del fundador: «el proceso para publicar la aplicación oficialmente al mercado […] tanto a Apple Store como a Google Store» y «limitar un poco el uso de la aplicación en web para incitar a que la gente descargue la aplicación». Guía completa: [`PUBLICACION.md`](PUBLICACION.md).
- **App en las dos tiendas con Capacitor** (Claude, 8 oct) — **propuesta**; sustituye la recomendación abierta de `MOVIL.md`.
- **Limitar la web para empujar a la app** (fundador, 8 oct) — **propuesta de Claude:** la consulta pública sigue abierta en la web; avisos y subida desde la cámara, solo en la app; **dar aura solo desde la app**, a decidir por el fundador (ventaja: comprobación de dispositivo contra cuentas falsas; contra: se pierde el voto desde enlaces compartidos).
- **Bloquear a otro usuario** (Claude, 8 oct, requisito de Apple 1.2) — **pendiente**, necesario para publicar.
- **Condiciones de uso aceptadas al registrarse y filtro de palabras** (Claude, 8 oct, Apple 1.2 y Reglamento de Servicios Digitales) — **pendiente**.
- **Avisos en el teléfono** (combate de un peleador seguido, vídeo nuevo de tu combate, aura recibida) con Firebase (Claude, 8 oct) — **pendiente**; es lo que más justifica descargar la app.
- **Banner «Abrir en la app» y QR en carteles de veladas** (Claude, 8 oct) — **pendiente**, después de publicar.

## Portada y cuenta del creador (8 de octubre de 2026)

- **La portada inicial reúne la actualidad de todos los deportes y, al elegir uno, se abre «otra pantalla como la inicial, pero exclusivamente de esa disciplina»** (fundador, 8 oct) — **hecho**: una sola portada (`_inicio/Portada.tsx`) con selector «Todos / cada deporte» y noticia destacada; la del visitante también abre con la actualidad.
- **Usuario especial del creador para entrar desde cualquier sitio y gestionar cualquier aspecto** (fundador, 8 oct) — **hecho** ([`CREADOR.md`](CREADOR.md)): permisos de moderación + Administración (cuentas, moderadores, sesiones). Claude añadió un segundo paso obligatorio (aplicación de códigos o códigos de emergencia en papel) porque es la cuenta que más interesa robar.
- **Borrar o suspender cuentas ajenas desde Administración** (Claude, 8 oct) — **propuesta**, a decidir por el fundador.
- **Segundo paso también para los moderadores** (Claude, 8 oct) — **propuesta**.
- **Avisar por correo al creador de cada entrada en su cuenta** (Claude, 8 oct) — **pendiente** de tener correo real (dominio).

## Iconos y noticias por disciplina (8 de octubre de 2026)

- **Imágenes o iconos de cada deporte en el panel de disciplinas** (fundador, 8 oct) — **hecho** con pictogramas propios; las fotografías reales quedan para la fase de diseño (derechos de imagen, fotógrafo).
- **Noticias solo en español y solo de su disciplina** (fundador, 8 oct) — **hecho** (`clasificar`, `enEspanol`, fuentes españolas especializadas); falta comprobar en la demo qué fuentes leen bien.
- **Buscar medios en español dedicados a K-1, kickboxing y Muay Thai** (Claude, 8 oct) — **pendiente**: no se encontró ninguno; quizá clubes o promotoras españolas con canal de noticias, o pedir al fundador sus referencias.
- **Noticias solo del panorama español**, para «apoyar a los nuestros» y crear comunidad en cada comunidad autónoma y municipio (fundador, 8 oct) — **hecho** (`espana.ts`, `NewsSource.local`).
- **Antigravity mantendrá las fuentes de noticias tras el despliegue** (fundador, 8 oct) — **acordado**; guía en `NOTICIAS.md`.
- **Sección «Talento local» o noticias por comunidad autónoma** (Claude, 8 oct, a partir de «en cada comunidad autónoma, en cada municipio») — **propuesta**: la detección de provincias ya existe y permitiría filtrar las noticias por la provincia de cada persona.

### Fotos que se ajustan solas (8 de octubre de 2026)
- Origen: el fundador, al rechazarse una foto de su móvil: «hay que ponérselo fácil a los usuarios». Estado: hecho (`InputFoto`).
- Pendiente de probar en Safari de iPhone y Android reales. Posible mejora: recorte con vista previa antes de subir.

### Arreglos del 8 de octubre de 2026 (fundador, probando la demo en el móvil)
- **Deslizar en horizontal en vez de bajar** («con las cosas bien agrupadas»). Estado: hecho en la ficha, «Mi ficha» y las noticias de la portada (`Pestanas`). Pendiente de valorar con el fundador en otras pantallas largas (velada, gimnasio, moderación).
- **Reservar clases privadas.** Estado: hecho como **solicitud** (el entrenador acepta o rechaza). Ideas siguientes, sin decidir: calendario con huecos del entrenador, recordatorio el día antes, valoración tras la clase y, más adelante, cobro dentro de la aplicación (es monetización: necesita la decisión del fundador y un proveedor de pagos aprobado).
- **Quitar disciplinas.** Estado: hecho (peleador sin combates en ella; moderación siempre).
- (8 oct, revisión) Pestañas también en Moderación y Mi cuenta; «Más filtros» plegado en Peleadores, Veladas y Ránking. Pendiente de valorar: velada (cartel largo) y gimnasio.

### Panel con acciones, calendario de clases y retos (8 de octubre de 2026, fundador)
- **Acciones principales arriba en cada panel**: hecho.
- **Reservar clase con calendario y barra de horas**: hecho. Ideas siguientes, sin decidir: que el entrenador marque sus huecos disponibles y la barra solo ofrezca esos; recordatorio el día antes.
- **Retos a combate y sparring** (propuesta n.º 1 del diseño v3): hecho. Siguientes posibles: que un reto aceptado pueda convertirse en combate de un cartel con el organizador; filtros «busco sparring» por peso y provincia.

## Inscripciones — ideas derivadas (9 de octubre de 2026)

- **Cupos por categoría y lista de espera** (Claude, 9 oct, al implementar las inscripciones): «8 plazas en -71 kg»; al llenarse, las siguientes quedan en espera. Pendiente de que el fundador lo quiera.
- **Sugerir emparejamientos entre los aceptados** (Claude, 9 oct): parejas de la misma categoría con récord parecido, como ayuda y nunca automático. Pendiente de decisión del fundador.
- **Cupos por categoría y lista de espera** — **hecho (9 oct):** el fundador lo aprobó («me parece bien que se especifiquen los pesos para los combates, las plazas por categoría»).
- **Sugerir emparejamientos entre los aceptados** — **hecho (9 oct)** como ayuda, nunca automática («siempre con ayuda […] que se vea el nivel, la popularidad, el número de combates»). Idea derivada (Claude, 9 oct): permitir al organizador ajustar qué pesa más en el parecido (experiencia, peso, aura) si la escala inicial no le convence.
- **Buscar rival o sparring por gimnasio y características** (el fundador, 9 oct: «sé que está en tal gimnasio pero no me sé su nombre […] que tenga X peleas, que sea zurdo») — **hecho (9 oct)** en `/propuestas`. Idea derivada (Claude, 9 oct): guardar una búsqueda y avisar por correo cuando aparezca un peleador que encaje (pendiente de decisión).


## 10 de octubre de 2026 ? Conservar dise?o, optimizar uso
- Fundador: le gusta el dise?o actual y solicita optimizar las pantallas sin redise?o ni prioridad entre ellas. Correcciones compartidas preparadas por Codex; pendientes de revisi?n/integraci?n.
- Logo: sigue sin elegir; se aplaza al final. La entrega de un kit no constituye por s? sola aprobaci?n de ese logo.
