# Ideas de Ring España

Registro vivo de las ideas: de dónde salieron, en qué estado están y qué queda por probar.
Sirve para revisar los principios del proyecto y para recuperar ideas aparcadas. Se actualiza en cada sesión (ver [`DIARIO.md`](DIARIO.md)).

Estados: 🟢 hecho · 🟡 en marcha / parcial · 🔵 planificado · ⚪ aparcado · 🔴 descartado

## Ideas fundacionales (no negociables)

| # | Idea | Origen | Estado |
|---|---|---|---|
| F1 | Hacer crecer la comunidad boxística española y dar visibilidad a sus boxeadores | Visión inicial del fundador | 🟡 |
| F2 | **Amateur primero**: hoy son aficionados, mañana la cara del boxeo español en el mundo | Giro tras ver el primer MVP | 🟡 |
| F3 | **El público valora**: un aficionado puede puntuar a un boxeador después de verlo pelear | Giro tras ver el primer MVP | 🟢 (v1) |
| F4 | **Madrid primero**, luego España; adelantarse a la competencia de Barcelona | Fundador | 🟡 |
| F5 | **Arquitectura y estructura antes que diseño gráfico** | Fundador | 🟢 (se aplaza el diseño) |
| F6 | Ver es público; **votar, registrar y publicar exige registro** | Fundador | 🟢 |
| F7 | **Veracidad de los datos** sin depender de trámites federativos al principio; colaborar con las federaciones a medio plazo | Fundador | 🟡 (estrategia escrita) |
| F8 | Documentar todo el proceso para poder contarlo y retomarlo | Fundador | 🟢 (estos documentos) |
| F10 | **El diseño visual se deja para el final** y debe tener **identidad propia**, sin el aspecto genérico que suele producir Claude, para que la app no se asocie con una IA. Se trabajará con briefing, varias direcciones y, a ser posible, un diseñador humano | Fundador (reiterado) | ⚪ (aplazado a propósito; principio documentado en `CLAUDE.md`) |
| F11 | **Ecosistema de todos los deportes de contacto en España** (MMA, kickboxing, K-1, jiu-jitsu…) con **el boxeo en cabeza**. Ser pioneros | Fundador | 🟡 (cinco disciplinas implementadas; falta validar categorías con federaciones y ampliar) |
| F9 | **Muy intuitiva para todo el mundo** (niños, jóvenes, adultos y mayores, con cualquier nivel tecnológico), siempre con tono serio y profesional. Aplica a esta y a toda aplicación futura | Fundador | 🟡 (aplicado a los flujos principales; falta organizador, moderación, medición de accesibilidad y pruebas con personas reales) |

## Ideas de producto

| Idea | Origen | Estado | Notas |
|---|---|---|---|
| **Aura en vez de estrellas:** los aficionados dan «aura» a un peleador (cultura de redes, público joven); el ránking se ordena por su aura **dentro de su categoría de peso y disciplina** | Fundador | 🟢 (v1) | Decisión del fundador: una aura por persona y combate. Se puede quitar. Ránking por disciplina, zona y periodo |
| **Récord de partida:** al crear la ficha, el peleador indica cuántos combates lleva; si recuerda su récord, lo pone (V-D-E); si no, solo el total. Desde ahí registra los nuevos | Fundador | 🟢 (v1) | Autodeclarado y no comprobable: se muestra siempre etiquetado. Riesgo abierto: se puede editar después |
| **Varias disciplinas** con resultados y divisiones propias (KO/TKO/decisión; sumisión y puntos en jiu-jitsu/MMA) | Fundador | 🟢 (v1) | Boxeo, MMA, kickboxing, K-1 y jiu-jitsu; una ficha por persona; récord separado por disciplina |
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
| Detección de colusión en valoraciones y confirmaciones | Riesgo detectado | 🔵 | |
| Seguir a boxeadores + avisos de veladas | Fomentar afición | 🟢 (v1) | «Mis boxeadores» y aviso por correo (aún al log); solo combates de organizador |
| Preferencias de aviso por correo (poder darse de baja) | RGPD / usabilidad | 🔵 | Necesario antes de enviar correos reales |
| Página «¿Cómo funciona?» | Principio F9 | 🟢 | `/ayuda` |
| Explicaciones en el primer uso de cada función (guías breves) | Principio F9 | 🔵 | |
| Avisos dentro de la app (además del correo) | Fomentar afición | ⚪ | |
| Fotos y vídeo de combates | Comunidad | ⚪ | Cuidado con menores y derechos |
| Perfiles de gimnasio gestionados por su responsable | Comunidad | ⚪ | |
| Mapa de gimnasios de Madrid | Descubrimiento | ⚪ | |
| Grupo de moderadores locales de confianza (entrenadores, exboxeadores, árbitros) | Ventaja de operar en una ciudad | 🔵 | No es código: es organización |
| Colaboración con Federación Madrileña / Española (actas y licencias como nivel máximo) | Fundador | ⚪ | Cuando haya tracción demostrable |
| Campo opcional de nº de licencia (sin verificar hasta que haya acuerdo) | Estrategia de veracidad | ⚪ | |
| API pública, app móvil, importación de datos federativos, SEO/sitemaps | Escala | ⚪ | |

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

- **Usabilidad (F9):** ¿tratamiento de «tú» o de «usted»? Hoy la app tutea; para un público con personas mayores conviene decidirlo con criterio y mantenerlo en toda la app.
- **Usabilidad (F9):** ¿qué grupos de personas reales (edades, familiaridad con la tecnología) probarán la app y cuándo?

- ¿Qué prueba concreta de identidad se pide al reclamar una ficha o pedir ser organizador (sin burocracia federativa)?
- ¿Cuántos combates confirmados exige el ránking para que un boxeador aparezca?
- ¿Cómo se trata a los boxeadores menores de edad (privacidad, consentimiento parental, visibilidad de su ficha)?
- ¿Modelo de sostenibilidad del proyecto (gratis, patrocinio de gimnasios y promotoras, entradas…)?
- ¿Nombre definitivo y marca? («Ring España» es un nombre de trabajo.)
