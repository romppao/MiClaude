# T-014 — Política de menores en la aplicación
**Nivel:** N3 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F2 (antes de abrir el registro al público) · **Estado:** lista **tras** las respuestas del fundador a las preguntas de producto del [ADR-003](../decisiones/ADR-003-proveedores-fase-0.md) · **Sugerida a:** Codex · **Depende de:** decisión del fundador (aura y comentarios para menores; fecha de nacimiento y sexo en el alta) y, idealmente, revisión jurídica

## Objetivo
Aplicar en la aplicación la política de menores del ADR-003 (borrador, **no es asesoramiento jurídico**) con el mínimo de datos posible.

## Contexto
La edad de consentimiento digital en España es 14 años (LOPDGDD, art. 7); un proyecto de ley podría subirla a 16, así que es un **parámetro**. Existen divisiones de edad en el modelo (`src/lib/common/competition.ts`) y fichas creadas por terceros (inicial del apellido, sin indexar: `src/lib/fighters/`). Registro: `src/app/registro/page.tsx` y `register` en `src/app/actions/accounts.ts`.

## Pasos (esbozo; se detalla al cerrar las preguntas de producto)
1. `MIN_AGE` configurable (variable de entorno con valor por defecto 14) en `src/lib/common/`; fecha de nacimiento declarada en el registro (campo nuevo, migración aditiva; **no** guardar más de lo necesario: valorar guardar solo «mayor/menor de 18» y el año).
2. Menores de `MIN_AGE`: mensaje claro y amable en el registro, sin crear cuenta; ruta «perfil gestionado por madre, padre o tutor» (cuenta de adulto) si el fundador lo aprueba.
3. Perfil público de menores de 18: sin foto ni banner, apellido abreviado, solo provincia, `noindex`, sin comentarios ni aura de desconocidos (según la respuesta del fundador). Una sola función de decisión (`esPerfilDeMenor`) usada por listado, ficha, buscador, mapa del sitio y rutas de imágenes.
4. Formulario público «Esto soy yo / quiero que se retire» (retirada provisional inmediata, resolución en 1 mes) y cola de moderación para atenderlo.
5. Pruebas unitarias de la función y de navegador de cada pantalla con una cuenta menor y una adulta. Actualizar `/privacidad` y `/ayuda`.

## Criterios de aceptación
- Ninguna pantalla pública, imagen, buscador ni mapa del sitio muestra datos que la política oculta para un menor.
- CI en verde; documentación y `ARQUITECTURA.md` actualizadas.

## No hacer
No pedir documento de identidad. No inventar texto legal: el texto de `/privacidad` lo revisa una persona cualificada.
