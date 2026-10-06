# Sistema de diseño «D» (basado en la maqueta de Antigravity)

**Fuente:** [`referencia/D-awwwards-ring-3.html`](referencia/D-awwwards-ring-3.html), de Antigravity, **elegida por el fundador el 6 de octubre de 2026** («este es el mockup que me ha dado Antigravity; quiero que tú y Codex trabajéis en él para toda la aplicación»). Sustituye a las maquetas de Claude, rechazadas ([`direcciones/LEEME.md`](direcciones/LEEME.md)). El fundador ya había señalado `mockup-peleador-pro.html` como «el mejor diseño que he visto».
**Autor de este documento:** Claude · **Para:** Codex y Claude · **Estado:** propuesta de implementación; **hay una decisión que aprobar** ([ADR-004](../decisiones/ADR-004-animacion-gsap-lenis.md)).

## 1. Qué es el diseño «D»

Oscuro, cinematográfico y tipográfico. Una pantalla de ficha de peleador con tres ideas:

1. **Fotografía en blanco y negro** del deportista, fundida con el fondo negro.
2. **Palabras gigantes de fondo** en tipografía expandida (Syncopate): «BOXEO» y «ESPAÑA» (en MMA: «ARTES / MIXTAS»; en Muay Thai: «NAK / MUAY»).
3. **Tarjetas de cristal flotantes** (categoría, récord, club y próxima velada) con una línea violeta en el borde superior, que se mueven un poco con el ratón (parallax) y cuyos números **cuentan hasta su valor** al entrar en pantalla.

Detalles de cine: grano de película, pantalla de carga que sube, cursor propio con inercia (solo en escritorio), scroll suave, y un **selector de deporte** en píldoras (Boxeo, MMA, Muay Thai) que cambia la foto, las palabras y los datos con un fundido. En móvil: las tarjetas se apilan a todo el ancho, el selector se desplaza en horizontal y desaparecen el cursor y el parallax.

## 2. Ingredientes (para convertirlos en componentes)

| Ingrediente | Valor en la maqueta | Notas para la aplicación |
|---|---|---|
| Fondo | `#050505` | Variable `--fondo`. Siempre oscuro |
| Color de marca | `#BE33F5` (violeta oficial) | Acento: botón activo, números destacados, línea de las tarjetas, cursor. Contraste sobre `#050505`: ≈ 4,8:1 (válido para texto) |
| Tipografías | **Syncopate 700** (títulos, cifras, palabras de fondo) + **Inter** 300–800 (texto) | Alojarlas en la aplicación (`next/font`); no depender de Google en ejecución |
| Tarjeta de cristal | fondo `rgba(15,15,15,.6)`, desenfoque 20 px, borde 1 px blanco 5 %, radio 24 px, línea superior en degradado violeta | Componente `TarjetaCristal` |
| Palabras de fondo | Syncopate, `clamp(4rem,15vw,20rem)`, una rellena (violeta 5 %) y otra en contorno (blanco 5 %) | Decorativas: `aria-hidden="true"` |
| Cifras | Syncopate 4,5 rem (2,5 rem en móvil), contador animado | El valor final debe estar **ya escrito en el HTML**; la animación solo lo recorre |
| Selector de deporte | Píldoras, activa en violeta con resplandor | Debe ser un grupo de opciones accesible (`radiogroup`) y funcionar sin JavaScript |
| Grano | `canvas` a pantalla completa con 10 fotogramas | **Cambiar**: ver §3 (consume mucha memoria) |
| Movimiento | Lenis (scroll), GSAP + ScrollTrigger | Ver ADR-004 y §3 |

## 3. Correcciones obligatorias (lo que la maqueta no cumple y la aplicación sí debe cumplir)

Comprobado al abrir la maqueta el 6 de octubre de 2026 (Chromium, 1440 y 390 px). Estas correcciones **no cambian el aspecto**: lo hacen utilizable por todo el mundo, que es requisito del fundador («intuitiva para todos»).

| # | Fallo en la maqueta | Corrección |
|---|---|---|
| 1 | `viewport` con `maximum-scale=1.0, user-scalable=no`: **bloquea el zoom** en el móvil | Quitar `maximum-scale` y `user-scalable`. El zoom nunca se desactiva |
| 2 | Etiquetas de **10 y 12 px** (`text-[10px]`, `text-xs`) | Mínimo **14 px** en etiquetas y **16 px** en texto corrido |
| 3 | Gris de apoyo `text-white/40` (≈ 3,7:1 sobre `#050505`) | Mínimo **`white/65`** (contraste ≥ 7:1). Nada por debajo de 4,5:1 |
| 4 | Sin `prefers-reduced-motion` | Con «reducir movimiento»: sin parallax, sin grano, sin scroll suave, sin cuenta animada y sin pantalla de carga; fundidos de 150 ms como mucho |
| 5 | Pantalla de carga fija (~2 s) que tapa todo | **Eliminarla** o limitarla a lo que tarde en cargar de verdad (nunca por tiempo fijo). La página debe poder leerse sin esperar |
| 6 | `cursor: none` en toda la página | Cursor propio **solo** con `(pointer: fine)` y **sin ocultar** el cursor del sistema en zonas de texto, formularios ni enlaces. Nunca en táctil |
| 7 | Contenido que empieza invisible (`opacity: 0`) hasta que corre el script | Contenido **visible en el HTML**; las animaciones son una mejora. Sin JavaScript, todo se lee |
| 8 | Imagen con `alt="FOTO DEL PERFIL DEL USUARIO"` y fotos enlazadas desde Unsplash (**una ya no carga**) | `alt` real («Fotografía de {nombre}»). **Fotos propias** alojadas en la aplicación o en el almacén de imágenes (T-004), con autorización |
| 9 | Botones con `onclick` en línea y sin estado para lectores de pantalla | `radiogroup` con `aria-checked`; teclado: flechas para cambiar de deporte; foco visible (la maqueta ya lo hace bien: `outline` violeta de 3 px por dentro) |
| 10 | Scripts y estilos desde CDN (Tailwind, GSAP, Lenis) | Instalar los paquetes y servirlos desde la aplicación; **no usar Tailwind** (la aplicación usa CSS propio con variables) |
| 11 | Grano con 10 fotogramas a pantalla completa en un `canvas` (≈ 50 MB en un monitor de 1440×900) | Grano con un SVG/`CSS` fijo (una imagen pequeña repetida) o suprimirlo en móvil |
| 12 | Texto de las tarjetas sin relación con la aplicación («Récord Verificado», un único club) | Datos reales: el récord muestra **su origen** («Confirmado por el rival», «Respaldado por federación», «Declarado»); ver ficha T-017 |

Además, las reglas de siempre (`CLAUDE.md`): español sin jerga, 5 enlaces como máximo, cero enlaces muertos, sin emojis, móvil primero, zonas táctiles de 44 px (la maqueta ya lo cumple).

## 4. De una pantalla a toda la aplicación

La maqueta diseña **una** pantalla. Para el resto, se aplican los mismos ingredientes (§2) con estas reglas:

- **Todo lo demás es oscuro** (`--fondo`), con Syncopate para títulos y cifras e Inter para el texto.
- **Cada pantalla tiene sus «palabras de fondo»** (la sección o el deporte) y **una sola acción principal** en violeta.
- **Tarjetas de cristal** para datos agrupados; **listas** con filas separadas por filetes blancos al 10 % y cifras grandes en Syncopate.
- **Formularios:** campos de fondo muy oscuro, borde de 2 px visible (contraste ≥ 3:1), etiqueta siempre visible, error con icono y texto («Revisa que tenga una @»), nunca solo en color.
- **Movimiento:** solo para dar contexto (entrada de elementos, cuenta de cifras, cambio de deporte). Nada que se repita sin fin en pantallas de lectura.
- **Los tres deportes de la maqueta** (boxeo, MMA, Muay Thai) tienen palabras, categorías y foto. **Faltan kickboxing, K-1 y jiu-jitsu**: se diseñan con el mismo patrón.

## 5. Decisiones abiertas para el fundador

1. **¿El color cambia con el deporte?** La maqueta mantiene el violeta en los tres. Propuesta: **mantener el violeta** y que cambien la foto, las palabras de fondo, el vocabulario y los datos; así la marca no se diluye. Si quieres un acento propio por deporte, se añade después como variable.
2. **Los seis deportes:** ¿completamos kickboxing, K-1 y jiu-jitsu? (Hoy el modelo de datos admite los seis.)
3. **Fotografía:** ¿hay fotos propias de peleadores y gimnasios, o hay que conseguirlas con autorización? **Sin fotos propias no se puede publicar este diseño.** Mientras tanto se usan marcadores.
4. **Dependencias nuevas** (GSAP y Lenis): [ADR-004](../decisiones/ADR-004-animacion-gsap-lenis.md).
5. **Cursor propio:** ¿se mantiene en escritorio (con las correcciones del punto 6)? Propuesta: sí, es parte de la identidad.

## 6. Reparto del trabajo

| Quién | Qué |
|---|---|
| **Claude** | Este sistema y el ADR; el **kit de interfaz** (T-016: variables, componentes y primitivas de movimiento accesibles); revisión visual y de accesibilidad de cada PR con capturas |
| **Codex** | El motor de temas por deporte (T-015) y las pantallas, una por PR: ficha de peleador (T-017), portada (T-019), listados (T-020), formularios y cuenta (T-021), velada y estados (T-022) |
| **Antigravity** | Autor de la maqueta; resuelve las dudas visuales; entrega los activos de cada deporte (palabras, fotos, categorías) y las pantallas que falten en la maqueta |
| **Fundador** | Aprueba el ADR-004, aporta las fotos y decide las preguntas del §5 |

Orden: **T-015 y T-016 en paralelo** (archivos distintos: Codex toca `layout.tsx` y la acción del tema; Claude crea `src/app/ui/` y las variables) → T-017 → T-019 a T-022.

## 7. Cómo se revisa cada PR visual (lista de Claude)

1. Capturas en 390 y 1280 px de **cada deporte** adjuntas al PR.
2. Zoom del navegador al 200 % sin pérdida de contenido; sin `user-scalable=no`.
3. Con «reducir movimiento» activo: sin parallax, grano, scroll suave ni cuentas.
4. Sin JavaScript: el contenido se lee.
5. Teclado: orden lógico, foco visible, selector de deporte con flechas.
6. Contraste calculado de cada par de colores (prueba automática) y `test:a11y` con 0 incumplimientos graves o críticos.
7. Ningún texto menor de 14 px; ninguna zona táctil menor de 44 px.
8. Sin dependencias externas en ejecución (CDN, fuentes de Google, imágenes enlazadas).
9. Peso medido (JavaScript, tipografías e imágenes de la pantalla) anotado en el PR.
