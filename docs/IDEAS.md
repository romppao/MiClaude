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

## Ideas de producto

| Idea | Origen | Estado | Notas |
|---|---|---|---|
| Récord calculado desde los combates, nunca guardado | Diseño | 🟢 | Evita desincronización |
| Valoración anclada a un combate concreto | Diseño (anti-manipulación) | 🟢 | Una por usuario/combate; participantes no votan |
| Media bayesiana en el ránking | Diseño | 🟢 | Un solo 5 no supera 40 notas de 4,8 |
| Niveles de respaldo del combate (autodeclarado → confirmado → verificado) | Necesidad: el amateur se registra a sí mismo | 🟢 | Se muestra en la ficha |
| Reclamar una ficha creada por otro | Necesidad: el rival ya existe sin cuenta | 🟢 | Aprobación de moderador |
| Rol organizador (cartel y resultados verificados) | Necesidad: fuente natural de verdad | 🟢 | Aprobación de moderador |
| Enlace de evidencia en el combate (acta, cartel, vídeo) | Estrategia de veracidad | 🟢 | Solo http(s); editable por participantes, organizador y admin |
| Historial de cambios (audit log) | Estrategia de veracidad | 🟢 | Solo visible para moderadores; ¿hacerlo público por combate? |
| Sello de verificado para gimnasios y organizadores | Estrategia de veracidad | 🟢 | Nota de evidencia obligatoria, interna |
| Avales cruzados entre entidades verificadas | Estrategia de veracidad | 🔵 | Requiere cuentas de responsable de gimnasio |
| Historial de cambios público por combate | Transparencia | ⚪ | Decidir qué se muestra y qué no |
| Comprobaciones automáticas de coherencia (mismo día, duplicados, edades) | Estrategia de veracidad | 🔵 | |
| Botón «reportar dato» + puntuación de fiabilidad de organizadores | Estrategia de veracidad | 🔵 | |
| Detección de colusión en valoraciones y confirmaciones | Riesgo detectado | 🔵 | |
| Seguir a boxeadores + avisos de veladas | Fomentar afición | 🔵 | Candidato tras la verificación |
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

- ¿Qué prueba concreta de identidad se pide al reclamar una ficha o pedir ser organizador (sin burocracia federativa)?
- ¿Cuántos combates confirmados exige el ránking para que un boxeador aparezca?
- ¿Cómo se trata a los boxeadores menores de edad (privacidad, consentimiento parental, visibilidad de su ficha)?
- ¿Modelo de sostenibilidad del proyecto (gratis, patrocinio de gimnasios y promotoras, entradas…)?
- ¿Nombre definitivo y marca? («Ring España» es un nombre de trabajo.)
