# Encargo a Codex — vídeo promocional presentación de la aplicación (9:16 y 4:3)

- **Fecha:** 15-10-2026 · **De:** Claude Code · **Para:** Codex
- **Ruta completa:** `C:\Users\PC\Desktop\MiProyectoAI\videos\lona-lanzamiento\ENCARGO-CODEX.md`
- **Estado:** estructura cerrada (guion, tiempos, plan de escenas, reglas de estilo). Falta todo el apartado visual. Audio ya generado.
- **Carpeta de trabajo:** `videos/lona-lanzamiento/` (creada hoy 19:26–19:33 por una sesión anterior; no hay nada más hecho que lo listado abajo).
- **Esfuerzo recomendado:** medio. Subir solo si hay un fallo de render difícil de reproducir.

## 1. Encargo del fundador (literal resumido)

Vídeo promocional motion graphics que **presente la aplicación** (decisión del 15-10: no se afirma que esté ya disponible ni en tiendas ni en la web). Muy dinámico, pero que se entienda. **60–80 s**, versión **9:16** y otra **4:3**. Debe mostrar: qué es Lona, qué problemas resuelve, para quién es y cómo usarla. Narrado con **voz masculina grave y profesional**. Referencia de estilo: https://www.promptsmotion.com/ultimaxbt-2ddf1e. Canción de fondo: https://youtu.be/H_tuDDOF7-s.

## 2. Qué existe ya (verificado el 15-10)

| Qué | Dónde | Estado |
|---|---|---|
| Guion de 9 bloques | `videos/lona-lanzamiento/_comun/guion.json` | Hecho |
| Voz es-ES-AlvaroNeural (grave: tono −14 Hz y −8 % con rubberband, graves reforzados) | `_comun/audio/s01..s09.wav` + `.json` con marcas de palabra | Hecho |
| Tiempos de cada bloque | `_comun/horario.json` | Hecho (total 72,0 s) |
| Mezcla final voz + música con ducking, −14 LUFS | `_comun/mezcla.wav` (72,0 s, comprobado con ffprobe) y receta `_comun/mezcla.sh` | Hecho |
| Música fuente (instrumental de la canción pedida, 184 s) | `_comun/musica/fuente.wav`, `flux.npy` (energía por tramo), `vertical-9x16/assets/musica-fuente.mp3` | Hecho |
| Proyecto HyperFrames 9:16 | `vertical-9x16/` | **Solo plantilla vacía** (`index.html` con «Title», 1920×1080). Hay que ponerle 1080×1920. |
| Proyecto 4:3 | — | No existe |
| Pantallas reales de la app (móvil 375×667) | `docs/logs/antigravity-recorrido-demo/` y `videos/lona/assets/pantallas/*.png` | Disponibles; comprobar que sigan vigentes con el nombre Lona |

No se ha renderizado ningún fotograma. Nadie ha escuchado la mezcla (solo medida con ffprobe).

## 3. Guion y tiempos (no cambiar sin avisar; la voz ya está grabada)

| Bloque | Inicio–fin (s) | Locución |
|---|---|---|
| s01 | 0,50–6,57 | «Un cartel en una red. Una fecha en un mensaje. Un resultado en el perfil de otro.» |
| s02 | 6,72–12,00 | «Los deportes de contacto tienen talento. Faltaba un sitio donde estar todos.» |
| s03 | 12,15–16,43 | «Presentamos Lona. Tu deporte. Tu gente.» |
| s04 | 16,65–24,94 | «La comunidad de los deportes de contacto de toda España. Boxeo, jiu-jitsu, K-1, kickboxing, MMA y muay thai.» |
| s05 | 25,15–32,10 | «Peleadores con su récord. Veladas con su cartel. Gimnasios y entrenadores, cerca de ti.» |
| s06 | 32,30–38,02 | «Cada resultado dice quién lo respalda. Y tu aura es el reconocimiento de quien te ha visto pelear.» |
| s07 | 38,25–50,25 | «Si compites, tu trayectoria te acompaña. Si entrenas, te encuentran. Si organizas, tu velada llega. Y si eres aficionado, sabes quién pelea, y dónde.» |
| s08 | 50,45–59,18 | «Empezar es fácil. Busca. Crea tu ficha. Registra tus combates. Y reconoce el talento.» |
| s09 | desde 59,40 | «Lona. Tu deporte. Tu gente.» **(texto cambiado el 15-10: ya no se dice «disponible»; el vídeo es una presentación de la aplicación)**. El audio `s09.wav` y `mezcla.wav` actuales llevan todavía la frase antigua: **hay que regenerar s09 con `_comun/tts.py`, recalcular `horario.json` y volver a mezclar con `mezcla.sh`** antes de montar. Con la frase corta, s09 dura unos 3 s: dejar una cola musical hasta cerrar entre 66 y 72 s (mínimo 60 s en total). |

Cubre las cuatro cosas pedidas: **qué es** (s03–s04), **problema** (s01–s02), **para quién** (s07), **cómo usarla** (s08). Los subtítulos salen de las marcas de palabra de `audio/sNN.json`.

## 4. Plan visual por bloque

Lenguaje de la referencia (promptsmotion «Food craving launch film»), aplicado a Lona: **una sola toma continua**, cada escena nace de la anterior; el texto sube desde una línea de máscara; los botones se expanden en páginas; el color **inunda desde un objeto y se encoge dentro de otro**; un único movimiento de cámara suave por escena, sin ir y volver. Un teléfono con marco negro de 11 px y barra de estado 9:41 recibe la interfaz. Sincronizar los golpes a la rejilla de la música (usar `flux.npy` y `hyperframes beats`).

Prohibido (de la referencia): fundidos cruzados, desenfoques de entrada, 3D, partículas, cámaras que inviertan el sentido, plantillas genéricas. Adaptación: como es un vídeo narrado de 72 s, ninguna pausa sin movimiento supera 1,5 s (la referencia dura 15 s y usa 1 s).

| Bloque | Qué se ve |
|---|---|
| s01 | Tres fragmentos desordenados aparecen y se teclean uno tras otro: un cartel en un feed, una fecha en un mensaje, un resultado en un perfil ajeno. Quedan dispersos en el lienzo. |
| s02 | Las dos esquinas del símbolo de Lona se acercan y juntan los fragmentos; el lienzo se queda vacío salvo el hueco entre esquinas. Texto grande «Talento hay. Falta el sitio.» |
| s03 | Lima #D2FF3A inunda desde ese hueco; el wordmark LONA sube desde una línea de máscara y se asienta; debajo «Tu deporte. Tu gente.» |
| s04 | El lima se encoge hasta ser el botón de un teléfono que se abre; seis chips (Boxeo, Jiu-jitsu, K-1, Kickboxing, MMA, Muay thai) entran al ritmo de la voz y quedan en una malla; mapa de España sencillo detrás. |
| s05 | Tira horizontal de tres tarjetas que se desliza: ficha de peleador con récord, cartel de velada, gimnasio/entrenador «cerca de ti». Una por frase. |
| s06 | La tarjeta de un resultado se abre: aparece el «respaldado por» (moderador/promotora). Del botón de voto sale el aura (halo conic iridiscente violeta→lima, como el brillo del compositor de la referencia). |
| s07 | Cuatro cambios rápidos de rol dentro del mismo teléfono (pantalla de peleador → entrenador → promotora → aficionado), cada uno con su frase en pantalla de 3 s. |
| s08 | Cuatro pasos numerados con la interfaz real: **Busca** (teclear en el buscador), **Crea tu ficha** (formulario), **Registra tus combates**, **Reconoce el talento** (aura). Cada paso lo dispara una pulsación y el color inunda al siguiente. |
| s09 | El teléfono se pliega en el símbolo; cierre con LONA, lema y lonaclub.es; sin insignias de tienda ni «ya disponible»; solo marca y lema (y lonaclub.es solo si el fundador lo aprueba). Los 5,5 s finales sin voz: logo quieto con respiración leve y fundido de música (único fundido permitido: el de audio). |

## 5. Formatos y entrega

- **9:16:** 1080×1920, 30 fps mínimo (60 si el render lo permite), H.264 + AAC, sin recortar.
- **4:3:** 1440×1080, mismo audio y tiempos; **recomponer** el encuadre (teléfono más pequeño, texto a los lados), no recortar el vertical.
- Paleta y tipografía de la identidad vigente: fondo #101210, texto #F6F5F0, acento lima #D2FF3A, violeta secundario del producto, Archivo (ver `videos/lona/frame.md` y `LONA-LOGO-Y-TIPOGRAFIA/`). Símbolo original de dos esquinas; **no** recuperar símbolos rechazados.
- Motor: HyperFrames (ya hay proyecto inicializado en `vertical-9x16/`; crear `cuatro-tres/` junto a él). Si Codex prefiere Remotion como en la serie del 9-10, vale, pero debe reutilizar `mezcla.wav` y `horario.json`.
- Salida: `videos/lona-lanzamiento/salida/lona-promo-9x16.mp4` y `lona-promo-4x3.mp4`, más capturas de fotogramas clave y `ffprobe` de ambos.

## 6. Cómo comprobarlo antes de entregar (una vez)

1. `hyperframes check` sin errores en los dos proyectos.
2. Fotogramas extraídos en cada transición y en el último; ningún texto cortado ni fuera de zona segura.
3. `ffprobe`: dimensiones, duración 72,0 s ±0,1, vídeo H.264 y audio AAC.
4. Mirar que ninguna pantalla muestre «Ring España» ni datos reales de personas.
5. Informar de lo que **no** se pudo comprobar (por ejemplo, escucha humana).

## 7. Decisiones y riesgos para el fundador (antes de publicar nada)

1. **Disponibilidad (resuelto 15-10).** El fundador decidió no decir si Lona está ya disponible: el vídeo solo presenta la aplicación. Nada de «ya disponible», «descárgala» ni insignias de App Store/Google Play. Interfaz y datos son demostración.
2. **Música.** El enlace es «BODY HEAD ANTHEM – Roy Jones Jr ft Mr. Magic & Choppa (Instrumental)», subido por el canal Beats and West Side. La licencia no consta (el campo sale «NA»). Vale para el borrador local; para publicar hay que obtener licencia o sustituirla por una pista libre con el mismo tempo.
3. **Datos de ejemplo.** Peleadores, récords, carteles y gimnasios que se vean deben ser ficticios y verosímiles, o capturas de la demo con datos de prueba. No usar nombres ni fotos de personas reales sin permiso.
4. **Voz.** Es sintética (Microsoft Edge TTS, es-ES-Alvaro bajada de tono), no una grabación humana. Si el fundador no la encuentra lo bastante grave, probar `pitch=0.88` en `tts.py` y volver a mezclar.
5. **Aura y «respaldado por».** Confirmar contra la app actual que se describen tal como funcionan hoy.

## 8. Qué NO hacer

No publicar, no subir a redes, no tocar la app ni DNS ni Render, no gastar créditos de servicios de pago, no crear carpetas `MiClaude-*` en la raíz, no dejar logs sueltos en la raíz (van a `docs/logs/`).

## 9. Al terminar

Crear un traspaso propio en `docs/ecosistema/traspasos/` con archivos, comprobaciones y pendientes, y una nota de sesión en `OBSIDIAN/OBSIDIAN/Sesiones/`. Claude Code revisa el resultado antes de enseñárselo al fundador.
