# T-020 — Listados con el diseño «D»
**Nivel:** N3 · **Fase:** F4 · **Estado:** bloqueada hasta T-015 y T-016 (la ficha de peleador T-017 sirve de modelo) · **Sugerida a:** Codex · **Depende de:** T-015, T-016

## Objetivo (una frase)
Que los listados (peleadores, ránking, veladas, gimnasios y entrenadores) usen el diseño «D» manteniendo filtros, paginación y búsqueda.

## Contexto
Sistema de diseño: [`SISTEMA-D.md`](../diseno/SISTEMA-D.md) (§3 correcciones obligatorias, §4 cómo extender el diseño al resto, §7 lista de revisión). Maqueta de referencia: [`referencia/D-awwwards-ring-3.html`](../diseno/referencia/D-awwwards-ring-3.html). Usa **solo** los componentes de `src/app/ui/` (T-016): si falta alguno, pídelo en el PR. Reglas del fundador: móvil primero, español claro, 5 enlaces como máximo, cero enlaces muertos, sin emojis, una acción principal por pantalla.

## Pasos
1. Rama `codex/T-020-listados-d`.
2. Filas con puesto, nombre, datos y cifra grande (Syncopate), filetes blancos al 10 %; filtros como botones de 44 px; paginación existente.
3. El ránking **explica qué mide** junto a la lista (aura = trayectoria + respaldo + comunidad) y conserva su periodo y filtros.
4. Estados vacíos con una acción clara (`AvisoEstado`).
5. Pruebas: `enlaces.mjs`, `movil.mjs` y los recorridos de esas pantallas en verde; `test:a11y` con 0 incumplimientos graves o críticos; capturas en 390 y 1280 px **de cada deporte**; con JavaScript desactivado todo se lee; sin dependencias nuevas.
6. Documentar: `DISENO.md`, `DIARIO.md`, `LECCIONES.md`, mapa funcional (en Linux o CI), tu registro.

## Criterios de aceptación
Capturas comparadas con la maqueta y con la ficha T-017; lista de revisión de `SISTEMA-D.md` §7 cumplida; ningún dato, permiso ni texto de producto cambia salvo el aspecto.

## No hacer
No cambiar datos, permisos ni reglas. No fotos de terceros. No añadir dependencias.

## Documentar
Pasos 5 y 6.
