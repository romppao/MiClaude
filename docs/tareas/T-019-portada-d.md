# T-019 — Portada con el diseño «D»
**Nivel:** N3 · **Fase:** F4 · **Estado:** bloqueada hasta T-015 y T-016 (la ficha de peleador T-017 sirve de modelo) · **Sugerida a:** Codex · **Depende de:** T-015, T-016

## Objetivo (una frase)
Que la portada (`/`) presente la aplicación con el diseño «D» y deje elegir el deporte, con las palabras de fondo y la fotografía de cada uno.

## Contexto
Sistema de diseño: [`SISTEMA-D.md`](../diseno/SISTEMA-D.md) (§3 correcciones obligatorias, §4 cómo extender el diseño al resto, §7 lista de revisión). Maqueta de referencia: [`referencia/D-awwwards-ring-3.html`](../diseno/referencia/D-awwwards-ring-3.html). Usa **solo** los componentes de `src/app/ui/` (T-016): si falta alguno, pídelo en el PR. Reglas del fundador: móvil primero, español claro, 5 enlaces como máximo, cero enlaces muertos, sin emojis, una acción principal por pantalla.

## Pasos
1. Rama `codex/T-019-portada-d`.
2. Titular grande con palabras de fondo del deporte activo; selector de deporte (`SelectorDeporte`) con los seis deportes y «Todos»; una sola acción principal («Crear mi ficha»).
3. Secciones: próximas veladas (3), los más respaldados (ránking resumido), cómo funciona (3 pasos) y cierre. Datos reales de la base, **sin cifras inventadas** (nada de «40 clubes» si no hay 40).
4. Barra inferior en móvil con los 5 destinos (Inicio, Veladas, Clubes, Ránking, Cuenta), iconos de línea propios en SVG, sin emojis.
5. Pruebas: `enlaces.mjs`, `movil.mjs` y los recorridos de esas pantallas en verde; `test:a11y` con 0 incumplimientos graves o críticos; capturas en 390 y 1280 px **de cada deporte**; con JavaScript desactivado todo se lee; sin dependencias nuevas.
6. Documentar: `DISENO.md`, `DIARIO.md`, `LECCIONES.md`, mapa funcional (en Linux o CI), tu registro.

## Criterios de aceptación
Capturas comparadas con la maqueta y con la ficha T-017; lista de revisión de `SISTEMA-D.md` §7 cumplida; ningún dato, permiso ni texto de producto cambia salvo el aspecto.

## No hacer
No cambiar datos, permisos ni reglas. No fotos de terceros. No añadir dependencias.

## Documentar
Pasos 5 y 6.
