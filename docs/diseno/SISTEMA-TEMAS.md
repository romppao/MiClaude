# Sistema de temas por deporte (especificación para desarrollo)

**Autor:** Claude (diseño visual) · **Para:** Codex (desarrollo) · **Fecha:** 6 de octubre de 2026 · **Estado:** propuesta a falta del visto bueno del fundador sobre la maqueta · **Maqueta de referencia:** [`direcciones/mezcla-por-deporte.html`](direcciones/mezcla-por-deporte.html) (se abre en el navegador; `?deporte=boxeo` fuerza un deporte).

## Idea (palabras del fundador)

«Haz una mezcla, de todos los deportes de contacto; luego, cuando el usuario elija su deporte de contacto, la aplicación se sumerge por completo en esa temática.»

- **Base «Todos los deportes»:** mezcla de las tres direcciones (A·Revista, B·Aparato, C·Lona): estructura limpia y editorial, cifras grandes, filetes como cuerdas, violeta de marca.
- **Siete ambientes:** la base más un tema por cada disciplina (`BOXEO`, `MMA`, `MUAYTHAI`, `KICKBOXING`, `K1`, `JIUJITSU`).
- **Inmersión:** al elegir deporte cambian a la vez **color, tipografía, texturas, formas, regla decorativa y vocabulario** (rondas o asaltos, cinturón, torneo…). La **estructura** de las pantallas, los permisos y los datos **no cambian**.

## Qué es fijo y qué cambia

| Fijo en todos los ambientes | Cambia con el deporte |
|---|---|
| Violeta de marca `#BE33F5` (botón principal y logotipo) con texto oscuro `#0C0B0F` (contraste 4,6:1) | Fondo, texto, gris de apoyo, líneas |
| Estructura, navegación (5 enlaces como máximo), orden de la información | Tipografía de títulos y cifras |
| Tamaños mínimos: texto 16–17 px, etiquetas 14–15 px, zonas táctiles 44 px | Regla decorativa y textura de fondo |
| Accesibilidad: contraste AA, foco visible, teclado | Forma de botones y tarjetas (corte octogonal, paralelogramo…) |
| Cada dato con su origen visible («Confirmado por el rival»…) | Vocabulario y ejemplos (asaltos / rondas / torneos / cinturón) |

## Los siete ambientes (variables de la maqueta)

| Ambiente | Fondo / texto | Acento de texto | Tipografía de títulos | Regla y textura | Forma | Idea |
|---|---|---|---|---|---|---|
| **Todos** | Papel `#F3EFE6` / tinta `#111014` | `#8E1FBD` | Newsreader + Barlow Condensed (cifras) | Doble filete; líneas finas | Recta | Revista de deportes de contacto |
| **Boxeo** | Lona `#0C0B0F` / hueso `#F2EEE8` | `#D77CFB` | Big Shoulders Display, mayúsculas | Tres cuerdas (violeta, hueso, violeta); líneas horizontales | Casi recta | Un ring de noche |
| **MMA** | Acero `#101214` / `#E9EDF0` | `#FF8A4C` | Saira Extra Condensed, mayúsculas | Malla de jaula en rombos | Esquinas cortadas (octógono) | La jaula |
| **Muay Thai** | Vendaje `#F5EADB` / marrón `#2A1810` | `#9E1F17` | Archivo Narrow, mayúsculas | Bandas de vendaje (rojo, crudo, negro); trama diagonal | Recta | Vendas y cuerda |
| **Kickboxing** | Negro `#0A0A0A` / blanco | `#FFD400` | Teko, mayúsculas | Franjas amarillas en diagonal | Paralelogramo en botones | Velocidad |
| **K-1** | Blanco roto `#F6F6F4` / negro | `#B50018` | Bebas Neue, mayúsculas | Barra roja y negra; cuadrícula de cuadro de eliminatorias | Recta | Torneo y eliminatoria |
| **Jiu-jitsu** | Kimono `#EFF1F6` / índigo `#14183A` | `#6A1B9A` | Spectral (serif) | Cinco tramos de cinturón (blanco, azul, morado, marrón, negro); cuadrícula de tatami | Esquinas suaves (6 px) | Tatami y graduación |

Contrastes medidos en la maqueta (texto sobre fondo, gris sobre fondo y acento sobre fondo, en los siete ambientes): **el menor es 5,8:1** (mínimo exigido 4,5:1). Sin desbordes horizontales ni zonas táctiles menores de 44 px en 390 y 1280 px.

## Cómo implementarlo (propuesta técnica)

1. **Tokens como variables CSS** en `src/app/globals.css` bajo `:root` (marca) y `[data-deporte="…"]` (ambiente). Los nombres son los de la maqueta (`--bg`, `--bg-2`, `--fg`, `--fg-2`, `--line`, `--on-bg-accent`, `--card`, `--on-fg`, `--display`, `--num`, `--regla-h`, `--regla-bg`, `--motif`, `--cut`, `--btn-cut`, `--radius`, `--upper`). **Ningún componente lleva un color escrito a mano**: todo sale de variables.
2. **Elección persistente:** cookie funcional `deporte` (valores: `todos`, `boxeo`, `mma`, `muaythai`, `kickboxing`, `k1`, `jiujitsu`; un año; `SameSite=Lax`). El `layout.tsx` la lee en el servidor y pone `<html data-deporte="…">`: **sin parpadeo y sin depender de JavaScript**.
3. **Selector «Tu deporte»:** formulario con una acción de servidor que guarda la cookie (funciona sin JavaScript). Aparece bajo la cabecera (como en la maqueta) y en el alta. Si la persona tiene ficha de peleador con una sola disciplina, esa es la sugerida por defecto.
4. **Registro de temas** en `src/lib/common/temas.ts`: correspondencia `Discipline` ↔ clave de tema, nombre visible y **vocabulario** (rondas/asaltos, graduación, torneo). Los textos del vocabulario viven aquí, no esparcidos por las pantallas.
5. **Tipografías:** `next/font` (alojadas por la propia aplicación, no desde Google en tiempo de ejecución), cargando **solo las del ambiente activo**. Verificar la licencia de cada una (todas son de código abierto en Google Fonts; comprobarlo al implementar).
6. **Más adelante (no ahora):** campo `User.favoriteDiscipline` (migración aditiva) para recordar el deporte en cualquier dispositivo.

## Qué NO cambia (decisiones que ya están tomadas)

- Los datos, los permisos y las reglas del aura, la verificación y los menores no dependen del tema.
- La comunicación pública sigue siendo igual para todas las disciplinas (`CLAUDE.md`, 3 de octubre): el **ambiente por defecto es «Todos los deportes»** y nunca prioriza uno. El fundador pidió inmersión por deporte **cuando la persona lo elige**; esa es una decisión suya del 6 de octubre de 2026 y complementa esa regla, no la sustituye.

## Preguntas abiertas para el fundador

1. **¿La elección también filtra los listados?** Propuesta: los listados empiezan filtrados por el deporte elegido, con un enlace visible «Ver todos los deportes». Sin tu respuesta, el tema solo cambia el aspecto y el vocabulario.
2. **¿Una persona con varias disciplinas?** Propuesta: puede cambiar de ambiente cuando quiera con el selector; el de su ficha es solo una sugerencia.
3. **Cookie funcional:** guarda una preferencia, no datos personales. Hay que decidir (con asesoramiento jurídico si procede) si exige aviso; **no se afirma aquí que no lo exija**.
4. **¿Modo claro u oscuro independiente del deporte?** Hoy cada ambiente tiene el suyo. Propuesta: no ofrecerlo en esta fase.
5. **Fotografía real:** cada ambiente necesita sus imágenes (gimnasios, veladas, peleadores) y su autorización de uso. Las maquetas usan marcadores.
6. **¿Falta algún deporte?** (por ejemplo lucha, sambo o taekwondo). Hoy el modelo de datos admite seis disciplinas: añadir otra es un cambio de datos, no de diseño.

## Comprobaciones obligatorias de cada ambiente (para Codex)

- `npm run test:a11y` con **cada** ambiente activo: 0 incumplimientos graves o críticos.
- Prueba de unidades que **calcula el contraste** de cada par de variables de cada tema y falla por debajo de 4,5:1 (3:1 para texto grande).
- `tests/e2e/temas.mjs` (nuevo): elegir deporte, comprobar que se guarda, que persiste al recargar y que `data-deporte` es el esperado; sin desbordes horizontales en 390 px; zonas táctiles ≥ 44 px; ningún texto por debajo de 14 px.
- Captura de cada ambiente en 390 y 1280 px adjunta al PR; **Claude las revisa** contra la maqueta.
