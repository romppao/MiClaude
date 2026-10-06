# T-014 — Política de menores en la aplicación
**Nivel:** N3 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F2, **último punto de la fase básica, después del diseño visual** (decisión del fundador, 6 de octubre de 2026) · **Estado:** pausada; criterios abajo ya decididos · **Sugerida a:** Codex · **Depende de:** decisión del fundador (aura y comentarios para menores; fecha de nacimiento y sexo en el alta) y, idealmente, revisión jurídica

## Objetivo
Aplicar en la aplicación la política de menores del ADR-003 (borrador, **no es asesoramiento jurídico**) con el mínimo de datos posible.

## Contexto
La edad de consentimiento digital en España es 14 años (LOPDGDD, art. 7); un proyecto de ley podría subirla a 16, así que es un **parámetro**. Existen divisiones de edad en el modelo (`src/lib/common/competition.ts`) y fichas creadas por terceros (inicial del apellido, sin indexar: `src/lib/fighters/`). Registro: `src/app/registro/page.tsx` y `register` en `src/app/actions/accounts.ts`.

## Decisiones del fundador que mandan (6 de octubre de 2026)
- **El alta de la cuenta NO pide fecha de nacimiento ni sexo; no se impide a nadie usar la aplicación por su edad** («no quiero impedir a los más pequeños que puedan utilizar también esta app y disfrutarla»).
- La fecha de nacimiento se pide **solo al crear la ficha de peleador** (para la categoría); hoy el campo `birthDate` ya existe como opcional y en público solo se muestra la edad.
- Se **limitan algunas cosas** a los menores («comentarios, fotos, imágenes delicadas…»), **al final**, después del diseño. Hasta entonces no se limita nada por edad y no se abre la aplicación a menores reales.

## Pasos (esbozo; se detalla cuando llegue su turno)
1. `MIN_AGE`/`MAYORIA_DE_EDAD` configurables en `src/lib/common/`. La edad se deduce de la `birthDate` de la ficha (no del alta). **No** se pide edad al crear la cuenta; valorar si la fecha de nacimiento pasa a ser obligatoria al crear una ficha propia.
2. (Solo si el abogado lo exige) ruta «perfil gestionado por madre, padre o tutor» para menores de 14; no es el diseño actual.
3. Perfil público de menores de 18: sin foto ni banner, apellido abreviado, solo provincia, `noindex`, sin comentarios ni aura de desconocidos (según la respuesta del fundador). Una sola función de decisión (`esPerfilDeMenor`) usada por listado, ficha, buscador, mapa del sitio y rutas de imágenes.
4. Formulario público «Esto soy yo / quiero que se retire» (retirada provisional inmediata, resolución en 1 mes) y cola de moderación para atenderlo.
5. Pruebas unitarias de la función y de navegador de cada pantalla con una cuenta menor y una adulta. Actualizar `/privacidad` y `/ayuda`.

## Criterios de aceptación
- Ninguna pantalla pública, imagen, buscador ni mapa del sitio muestra datos que la política oculta para un menor.
- CI en verde; documentación y `ARQUITECTURA.md` actualizadas.

## No hacer
No pedir documento de identidad. No inventar texto legal: el texto de `/privacidad` lo revisa una persona cualificada.
