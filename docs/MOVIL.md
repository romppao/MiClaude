# Móvil primero: iOS y Android (y después, las tiendas)

**Petición del fundador (6 de octubre de 2026):** «principalmente nos tenemos que enfocar al mil por mil en cómo funciona la aplicación en dispositivos móviles, tanto de Apple, iOS, como de Android, ya que es el principal método por el cual los usuarios van a utilizar nuestra aplicación. El objetivo después de todo esto es poder agregarlo en las plataformas de descarga, ya sea Apple Store o Google Play.»

Esto es **funcionalidad y usabilidad, no diseño visual**: se aplica ya.

## Reglas para todo el equipo

1. Cada pantalla se piensa y se prueba **primero en móvil** (360–430 px, táctil, una mano). El escritorio se adapta después.
2. Nada se sale por la derecha ni obliga a desplazar en horizontal (salvo tablas con su propio desplazamiento visible).
3. **Zonas táctiles de al menos 44 × 44 px** (iOS: 44 pt; Android recomienda 48 dp). Un enlace que es una acción (seguir, dar aura, entrar) se presenta como botón, no como una línea de texto.
4. **Campos de formulario con letra de 16 px o más:** si no, iOS amplía la pantalla al tocarlos y la maqueta se descoloca.
5. Texto corrido de 16 px o más; nunca bloquear el zoom con los dedos (`viewport` sin `user-scalable=no`).
6. La barra fija inferior no puede tapar el final de ninguna pantalla (se deja margen = su altura + la zona segura del iPhone).
7. Los formularios no pierden lo escrito y el teclado no debe tapar el botón de enviar; los mensajes de respuesta se ven sin desplazarse (el aviso recibe el foco).
8. Todo se prueba con `tests/e2e/movil.mjs`: emula iPhone SE, iPhone 14, Pixel 7 y un Android de 360 px, como cada papel, y falla si hay desbordes, zonas táctiles pequeñas, letra pequeña, viewport que bloquea el zoom o barra que tape contenido.

**Límite honesto de las pruebas:** solo disponemos de Chromium. Se emulan medidas y táctil de iPhone y Android, **pero no el motor de Safari (WebKit)** ni el teclado, la barra de direcciones o las zonas seguras reales de iOS. Hay que comprobar en un iPhone y un Android reales (o con un servicio de pruebas en dispositivos) antes de publicar.

## Hacia las tiendas (App Store y Google Play): qué hay que decidir

La aplicación es una web (Next.js). Hay tres caminos, de menos a más trabajo:

| Camino | Qué es | Pros | Contras |
|---|---|---|---|
| **1. PWA** (web instalable) | Manifiesto, iconos y service worker; se «instala» desde el navegador | Rápido; sin tiendas | iOS la trata peor (sin avisos fiables, sin presencia en App Store) |
| **2. Envoltorio (Capacitor / TWA)** | La misma web dentro de una aplicación nativa que se sube a las dos tiendas | Un solo código; presencia en ambas tiendas; acceso a avisos y cámara | Apple exige que la app aporte valor más allá de «una web en una caja» (norma 4.2) y revisa el contenido generado por usuarios (1.2: moderación, denuncia y bloqueo) |
| **3. Aplicación nativa** (React Native / Swift + Kotlin) | Reescritura de la interfaz | Máxima calidad | Mucho coste; hay que mantener la API |

**Recomendación (a validar con el fundador):** primero cerrar la usabilidad móvil de la web y convertirla en PWA; después envolverla con Capacitor y añadir lo que Apple espera de una app de contenido de usuarios: denunciar contenido (ya existe «avisar de un error»), bloquear usuarios, borrar la cuenta desde la app (ya existe), política de privacidad y soporte. Requisitos de cuenta: Apple Developer (99 €/año), Google Play (25 € una vez). La política de **menores** debe estar resuelta antes de publicar (decisión del fundador abierta).

## Estado (6 de octubre de 2026)

- Auditoría automática en `tests/e2e/movil.mjs`. Hallazgos de la primera ejecución y su corrección en [`APORTACIONES-CLAUDE.md`](APORTACIONES-CLAUDE.md).
- PR #13 de Codex/Work (menú compacto y perfiles adaptables) sigue abierta y **debe conciliarse con `NavigationMenu`** antes de integrarse; no duplicar controles de menú.
- Pendiente: PWA (manifiesto, iconos, `theme-color`, página sin conexión), pruebas en dispositivos reales, teclado y zonas seguras de iOS, pantallas largas (moderación) en móvil.
