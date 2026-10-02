# Categorías de peso: de dónde sale cada lista

Petición del fundador (2 de octubre de 2026, probando la demo): «las categorías de peso las estás englobando todas en una misma disciplina […] no son los mismos pesos, no son las mismas categorías en profesional que en amateur […] Tienes que diferenciar cada disciplina de arte marcial con sus pesos divididos en pesos en profesional y pesos en amateur. Esto es muy importante.»

## Regla

Cada pareja **disciplina × nivel** (profesional / amateur) tiene **su propia lista** (`PESOS` en `src/lib/common/disciplines.ts`). La lista de categorías que ve una persona sale de lo que ha elegido arriba (disciplina y nivel) y cada categoría lleva su peso en kilos.

**No se escribe ningún peso que no se haya podido comprobar.** Si no hay una fuente fiable, la lista queda vacía, la pantalla lo explica y se ofrece «todavía no sé mi categoría». Para completarla: añadir las entradas, citar la fuente en `nota` y anotarlo aquí.

Lo guardado en la base de datos es una clave estable (`valor`: «Wélter», «M65», «F51»…), no el texto; el texto (`etiqueta`) puede mejorar sin migrar datos.

## Fuentes (consultadas el 2 de octubre de 2026 por búsqueda web; los sitios de las federaciones no eran accesibles desde el entorno de desarrollo)

| Disciplina · nivel | Qué se muestra | Fuente |
|---|---|---|
| Boxeo · profesional | Las 17 categorías (de minimosca 47,6 kg a pesado, más de 90,7 kg). Iguales para hombres y mujeres | Lista de 17 categorías que reconocen WBC, WBA, IBF y WBO (límites en libras convertidos a kg) |
| Boxeo · amateur | Élite y joven: **masculino** 47-50, 55, 60, 65, 70, 75, 80, 85, 90 y +90 kg; **femenino** 45-48, 51, 54, 57, 60, 65, 70, 75, 80 y +80 kg | Real Federación Española de Boxeo (RFEBoxeo), nuevas categorías al integrarse en World Boxing y European Boxing (noticia «Nuevos pesos en las competiciones nacionales» y su reseña en Espabox). **Cadete y júnior son distintas (de 38-40 / 44-46 kg a +80/+90) y no se han añadido** |
| MMA · profesional y amateur | Mosca 56,7; gallo 61,2; pluma 65,8; ligero 70,3; wélter 77,1; medio 83,9; semipesado 93,0; pesado 120,2; superpesado más de 120,2 kg (versión masculina) | Reglas unificadas (profesional) e IMMAF (amateur): coinciden. Las categorías femeninas más ligeras y las juveniles están **pendientes** |
| Muay Thai · profesional | De 105 a 209 libras (47,6 a 94,8 kg) y superpesado | Consejo Mundial de Muay Thai (WMC). Cada promotora puede usar otras |
| Muay Thai · amateur | **Vacía (pendiente)** | La búsqueda no devolvió la lista oficial de IFMA completa y no se ha querido deducirla |
| Kickboxing y K-1 · amateur | Masculino 51, 54, 57, 60, 63,5, 67, 71, 75, 81, 86, 91 y +91 kg | Categorías masculinas de ring de WAKO, adultos. Femeninas y juveniles **pendientes** |
| Kickboxing y K-1 · profesional | **Vacía (pendiente)** | Cada promotora (GLORY, K-1…) usa las suyas y las fuentes encontradas se contradecían |
| Jiu-jitsu · profesional y amateur | Gallo 57,5; pluma 64; pena 70; ligero 76; medio 82,3; medio-pesado 88,3; pesado 94,3; superpesado 100,5; ultrapesado más de 100,5 kg; absoluto | IBJJF, adultos masculinos con kimono. Iguales en los dos niveles: en jiu-jitsu las categorías se dividen por edad, sexo y cinturón, no por profesional/amateur. Femeninas, juveniles y sin kimono **pendientes** |

## Qué queda por hacer (decisiones y datos del fundador)

1. **Sexo y edad.** La aplicación aún no guarda el sexo ni la edad de la persona. En boxeo amateur el sexo va dentro de la categoría («Masculino · hasta 65 kg»); en el resto, solo están las masculinas. Hace falta decidir si se añade el sexo (y la edad: cadete, júnior, joven, élite, máster) a la ficha.
2. **Datos que faltan** (arriba, «pendiente»): Muay Thai amateur, kickboxing y K-1 profesional, categorías femeninas, juveniles y cadete/júnior de boxeo. Lo ideal es el reglamento de la federación que se quiera seguir en cada disciplina.
3. **«Profesional» es lo que cada peleador declara.** No es una verificación (como el récord de partida). La verificación sigue sin venderse ni regalarse.
4. **Datos antiguos:** una ficha guardada con una categoría que ya no existe en su nivel (por ejemplo «Wélter» en boxeo amateur) se sigue mostrando tal cual, sin kilos, hasta que la persona la vuelva a elegir.

## Dónde está en el código

- Modelo y textos: `src/lib/common/disciplines.ts` (`PESOS`, `weightClassesFor`, `weightClassLabel`, `weightNote`, `parseDisciplineChoice`).
- Selector de tres pasos (disciplina → nivel → categoría): `src/app/components/SelectorCategoria.tsx` (se usa en la ficha, en «Añadir otra disciplina» y en el filtro de peleadores).
- Filtro de peleadores y resumen de filtros aplicados: `src/app/peleadores/page.tsx`, `src/app/components/Filtros.tsx`.
- Ránking por disciplina, nivel y categoría: `src/lib/aura/ranking.ts`, `src/app/ranking/page.tsx`.
- Pruebas: `tests/unit/disciplines.test.ts`, `tests/unit/aura.test.ts`, `tests/e2e/filtros.mjs`.
