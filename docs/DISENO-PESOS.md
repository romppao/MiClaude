# Divisiones deportivas: edades, sexo, modalidades y pesos

Origen: el fundador pidió diferenciar los pesos por disciplina y nivel el 2 de octubre de 2026. El 3 de octubre añadió: «dentro de la disciplina de boxeo, en especial en el campo amateur hay infinidad de categorías desde schoolboys hasta élite […] informaros bien y aplicarlo correctamente».

La pareja disciplina/nivel resultaba insuficiente. Desde este bloque se guarda además una **división federativa versionada** (`divisionId`) que identifica grupo de edad, categoría masculina/femenina y, en WAKO, ring/tatami. El peso pertenece a esa división. No se deduce una edad ni un sexo de los datos anteriores.

## Fuentes primarias consultadas y leídas el 3 de octubre de 2026

| Referencia | Cobertura aplicada | Regla de edad |
|---|---|---|
| [RFEBoxeo, circular 24/2025 v2, clasificación 2026](https://feboxeo.es/download/104/documentos-competicion/7554/circular-24-2025-clasificacion-en-categorias-y-pesos-ano-2026-rfeboxeo-v2.pdf), pp. 1–2 | Todas las edades y pesos masculinos/femeninos nacionales de boxeo amateur | Año de nacimiento natural; catálogo limitado al año 2026 |
| [IFMA v3.057, 11/05/2026](https://muaythai.sport/wp-content/uploads/2026/05/IFMA-Rules-and-Regulations-v3.057_110526.pdf), reglas 4–6, pp. 20–24 | Élite, U24/U18/U16/U14/U12/U10/U8 y Masters 35+/40+/45+, ambos sexos y sus tablas de peso | Año natural, corte 31 de diciembre |
| [WAKO revisión 3, 25/10/2022](https://www.wako.sport/_files/ugd/6445bf_4945eef1b6a649b7bf055956396dace0.pdf), cap. 1 art. 2.1.1.2; cap. 2 art. 3; cap. 7 art. 3 | Ring: júnior joven/mayor y sénior, ambos sexos; tatami: niños, cadetes jóvenes/mayores, júnior, sénior, veteranos y sus pesos | Año de nacimiento, con acceso de júnior a sénior y veteranos con autorización especial |
| [IMMAF, cambio de Youth desde 2026, 18/11/2025](https://immaf.org/2025/11/18/immaf-adopts-year-born-system-for-youth-divisions-from-2026/) y [criterios anteriores de edad](https://immaf.org/wp-content/uploads/2021/03/IMMAF-Age-Banding-Criteria.pdf) para júnior/sénior | Youth D/C/B/A y júnior/sénior, ambos sexos. **Tablas de peso pendientes de contraste**, sin sustituirlas por la tabla masculina adulta | Youth por año de nacimiento desde 2026; Youth A no puede cumplir 18 antes ni durante la competición. Júnior/sénior por edad cumplida |
| [IBJJF, libro de reglas 6.1, junio 2024](https://ibjjf.com/books-videos), General Competition Guidelines art. 1, p. 41 | Mighty Mite I–III, Pee Wee I–III, Junior I–III, Teen I–III, Juvenile I–II, Adulto y Máster 1–7, ambos sexos. **Pesos, kimono/sin kimono y cinturones pendientes de catálogo conjunto** | Año natural. Adulto y máster tienen mínimos, sin máximo |

WAKO mantiene esa revisión general enlazada en su [página oficial de reglamentos](https://www.wako.sport/rules-overview), junto a cambios específicos de 2026. No se afirma que el catálogo sustituya la convocatoria de cada federación nacional o evento. No se ha copiado una clasificación de IBA como si fuera la de RFEBoxeo.

## Boxeo amateur en España, año 2026

| Grupo | Edad por año de nacimiento | Nacidos en | Pesos masculinos / femeninos |
|---|---|---|---|
| Élite | 19–40 | 1986–2007 | 10 / 10 |
| Joven | 17–18 | 2008–2009 | 10 / 10 |
| Júnior | 15–16 | 2010–2011 | 13 / 13 |
| Cadete (Schoolboys/Schoolgirls como referencia internacional) | 13–14 | 2012–2013 | 17 / 16 |
| Infantil | 11–12 | 2014–2015 | 20 / 20 |
| Benjamín | 9–10 | 2016–2017 | Sin pesos; solo formación, sin combate |
| Prebenjamín | 7–8 | 2018–2019 | Sin pesos; solo formación, sin combate |

RFEBoxeo permite primera licencia de competición hasta 34 años y renovación hasta 40. La aplicación conoce el nacimiento si se declara, pero **no conoce la licencia**: valida compatibilidad de edad y muestra la necesidad de comprobar requisitos federativos; no otorga elegibilidad federativa ni médica. Las licencias de entrenamiento no tienen restricciones de edad según la circular; los siete grupos no limitan la posibilidad de entrenar fuera de esas franjas.

Pesos de la circular (kg; el primer intervalo tiene también límite inferior, `+` significa más de):

- Élite y joven M: 47–50, 55, 60, 65, 70, 75, 80, 85, 90, +90. F: 45–48, 51, 54, 57, 60, 65, 70, 75, 80, +80.
- Júnior M/F: 44–46, 48, 50, 52, 54, 57, 60, 63, 66, 70, 75, 80, +80.
- Cadete M: 38–40, 42, 44, 46, 48, 50, 52, 54, 57, 60, 63, 66, 70, 75, 80, 90, +90. F: la misma secuencia hasta 80 y después +80.
- Infantil M/F: 25–28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 57, 60, 63, 66, 70, +70.

La circular contiene un fragmento superpuesto «+81kg» en la línea de joven masculino. La fila declara diez pesos y enumera los diez de élite: no se añade una undécima categoría a partir de ese fragmento.

## Diferencias que no se deben homogeneizar

- WAKO cap. 1 permite júnior de tatami de 16–18 competir como sénior y júnior mayor de ring desde los 18 **cumplidos**. Los veteranos de 41–55 requieren autorización especial y comprobación médica para sénior. La validación de edad admite esas excepciones y muestra su requisito; no certifica la autorización ni el historial de participación mundial/continental.
- WAKO admite niños en determinadas modalidades de tatami; eso **no habilita K-1, full contact ni low kick**. K-1 solo recibe las tres edades de ring. El selector de kickboxing identifica expresamente ring/tatami; la modalidad concreta permitida se explica en la ayuda y debe comprobarse al inscribir.
- IFMA: los 45 kg élite masculinos son una excepción para determinados eventos multideportivos, no un peso ordinario. Masters 40+/45+ no puede competir en +91 masculino. U8/U10 tienen tablas que no deben completarse inventando pesos abiertos.
- La comunicación IMMAF 2026 publica Youth D 2014–2015, C 2012–2013, B 2010–2011, A 2008–2009, con la excepción de los 18 cumplidos. Se guardan y prueban esos años expresos; no se reutilizan automáticamente los intervalos del PDF de 2021. El modelo de fechas admite comprobar hasta el último día; los eventos actuales de la app son de un día. Un torneo de varios días requiere ampliar el modelo con su fecha final.
- IBJJF divide también por cinturón y por kimono/sin kimono. Profesional/amateur es una declaración local, no una división IBJJF. Las edades se ofrecen en ambos niveles, pero los pesos quedan vacíos hasta disponer del catálogo conjunto verificado; no se asignan pesos adultos masculinos a niños o mujeres. El ránking de aura sigue siendo reconocimiento del público, no un ránking federativo por cinturones.

## Comportamiento de la aplicación

1. El selector de ficha, filtro y combate ofrece la división con edad y categoría; el enlace al reglamento acompaña a la explicación. Cambiar la división borra el peso anterior. Se puede dejar una declaración incompleta, identificada como «Grupo de edad y categoría sin confirmar».
2. `parseCompetitionChoice` valida en el servidor disciplina/nivel/división/peso como una combinación. Para una división con pesos no contrastados solo acepta peso vacío. Un valor de élite no se admite si no existe en la tabla de júnior, ni un peso masculino en una división femenina.
3. La ficha guarda la división actual; el combate guarda **su propia división y peso**. Al registrar historial se elige la categoría de aquel combate, sin copiar la ficha actual. Los campos viajan también al paso de elección del rival y a los reintentos.
4. Antes de registrar un combate se rechazan divisiones formativas y edades incompatibles cuando se conoce el nacimiento. El organizador comprueba ambas esquinas. Una edad conocida fuera de 11–40 impide boxeo amateur de 2026 incluso dejando la división vacía. Cambiar la fecha de una velada con divisiones declaradas vuelve a comprobar la compatibilidad.
5. Búsqueda y paginación conservan división/peso; los criterios se aplican juntos a la misma disciplina. El ránking agrupa por división/nivel/peso **del combate que recibió el aura**; cambiar la ficha no traslada aura entre edades. Un peleador puede aparecer en varias divisiones históricas.
6. El récord agregado sigue por disciplina/nivel: se etiqueta la **categoría actual** por separado y se explica que contiene historial de otras categorías. No se reescribe el récord previo declarado.
7. La migración añade columnas e índice; no rellena edades ni sexos en fichas o combates existentes. Las listas anteriores se conservan para declaraciones sin división, identificadas como incompletas, y para mostrar los valores históricos. No son una certificación de categoría federativa.
8. La descarga de datos incluye las divisiones y pesos actuales e históricos. Esta clasificación deportiva no define ni resuelve la política de consentimiento y publicación de menores pendiente en el proyecto.

## Código y validación

- Catálogo/fuentes y edad: `src/lib/common/competition.ts`; categorías heredadas y validación conjunta: `disciplines.ts`.
- Columnas `divisionId` en `FighterDiscipline` y `Bout`; migración `20261003090000_divisiones_deportivas`.
- Selector compartido: `src/app/components/SelectorCategoria.tsx`; guardas en acciones de peleadores, combates y organizadores.
- Pruebas normativas: `tests/unit/competition.test.ts`; recorrido real: `tests/e2e/categorias.mjs`. Se comprueban pesos falsificados, límites de edad/año, divisiones formativas, búsqueda y aura histórica.

Pendientes identificados: completar pesos IMMAF vigentes y catálogo IBJJF por uniforme/cinturón; catálogos profesionales específicos por promotora, otros reglamentos nacionales/internacionales, licencias y reglas de emparejamiento/rounds por edad. No se presentan como resueltos por haber añadido grupos de edad.

Validación final local: migraciones/paridad, tipos, mapa, 327 unitarias, compilación, 289 comprobaciones E2E (18 en el recorrido de divisiones) y axe sin incumplimientos. La clasificación deportiva no se confunde con una licencia o una política de publicación de menores.
