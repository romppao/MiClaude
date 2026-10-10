# Experiencia web y móvil: revisión de Codex

Encargo del fundador, 10 de octubre de 2026: optimizar la aplicación conservando su diseño y añadir interacción, GSAP, shaders y 3D. Rama `codex/optimizacion-visual-20261010`, base `d1e7ace`, propuesta #41. Logo y nombre pendientes de elección; no se sustituyen.

## Arquitectura y límites

`Experience` recibe los Server Components como hijos; no convierte sus consultas en peticiones del cliente. El contenido del servidor aparece sin esperar a GSAP, Sonner o Three.js. Animación y avisos se importan después de montar; las escenas solo cuando su superficie está cerca de la vista. `EffectBoundary` aísla fallos de módulos decorativos, incluidos errores de descarga de un chunk. Las guardas, Server Actions y permisos existentes se conservan.

El inicio utiliza un Map para buscar Aura por identificador en lugar de repetir búsquedas lineales. La ficha de peleador obtiene usuario y combates en paralelo, después de encontrar la ficha. No se cachean sesiones de autenticación entre peticiones. Se conserva la entrega de páginas completas: un loading global introducía streaming en todos los formularios y el CI detectó una regresión en moderación; se retiró esa frontera global, sin cambiar ni omitir las pruebas.

La aplicación sigue siendo Next.js para navegador. Las pautas de Expo, Android y Swift se aplican a interacción y física; no se ha creado ni compilado una aplicación nativa. No hay SDK de Android ni compilador Swift comprobados en este entorno. beUI Pro no tiene conexión autenticada: se usan componentes propios, sin copiar recursos de pago.

## Interacción y movimiento

- `Pestanas` mueve el riel con referencias y `translate3d`, como máximo una escritura por fotograma. El resorte amortiguado parte de la posición visible y velocidad del dedo; se cancela al desmontar, al redimensionar y con gestos cancelados. Teclado y movimiento reducido cambian inmediatamente. Los campos, filas con scroll y zoom conservan sus gestos nativos.
- `MotionRuntime` utiliza `useGSAP`, contexto, limpieza, `matchMedia`, ScrollTrigger por lotes, timeline y CustomEase. Solo tarjetas marcadas, máximo 30, seis por lote y 180 ms. No oculta contenido antes de hidratar ni fija formularios al hacer scroll.
- La inclinación de superficies decorativas usa `quickTo` y `clamp`, solo con puntero preciso. No mueve cifras oficiales ni bloquea gestos táctiles. El menú conserva el diálogo nativo, foco y Escape; su entrada CSS dura 240 ms.
- `Feedback` monta un solo Toaster y actualiza el mismo aviso al perder/recuperar conexión. Los errores de formularios siguen teniendo sus mensajes accesibles existentes. Los reconocimientos del laboratorio son ficticios y no llaman a ninguna acción de voto.

Se conserva Archivo, paleta, fotografía, estructura y navegación. Hover solo en ratón; viewport-fit, altura dvh, safe areas, controles táctiles y barra inferior reciben ajustes. El cristal está limitado a navegación fija, con alternativa opaca para contraste/transparencia reducida. No se añade desenfoque a cada fila.

## GPU y objetos 3D

`GpuSurface` observa visibilidad, documento oculto, movimiento reducido y ahorro de datos. Desmonta efectos cuando no se necesitan; conserva SVG estático o superficie habitual. `Arena3D` genera geometría propia, sin descargar GLB ni texturas externas: ring y medalla decorativa. Material PBR metálico, iluminación de estudio, entorno PMREM, textura CanvasTexture pequeña para Aura, tono ACES y aura GLSL. La escena se limpia liberando geometrías, materiales, texturas, entorno y renderer.

El ring aparece discretamente en bienvenida. La medalla e inclinación avanzada se revisan en el laboratorio; no se asigna una acreditación deportiva inventada. DPR máximo 1,5; baja a 1 si detecta lentitud repetida. No hay sombras multipaso, SSAO ni bloom a pantalla completa: el halo es un shader acotado para contener el coste del postprocesado. La escena local medida produjo 18 draw calls.

`ShaderAmbient` utiliza `shaders/react`: malla WebGPU violeta/negra y estela lima/violeta, telemetría desactivada, colores explícitos sin los stops predeterminados de la biblioteca. `onUnavailable` conserva la tarjeta habitual si falta WebGPU. Se importa aparte del contenido inicial y no se manipula el canvas interno de la biblioteca.

## Revisión y pruebas

`/laboratorio` solo existe al responder la página si `DEMO_MODE=si` y `EXPERIENCE_LAB=si`; en otro caso devuelve 404. No se enlaza desde la navegación pública. Datos ficticios: nombres largos, correo sin espacios, caracteres internacionales, números grandes, lista vacía y una persona. Puede alternarse ring/medalla y desactivar GPU. Nunca escribe en base de datos.

`tests/browser/experiencia.mjs` solo acepta localhost: capturas, anchuras 320/390/768/1440, casos extremos/vacíos, accesibilidad grave/crítica, avisos offline/online, bienvenida/inicio/listados y movimiento reducido. La alternativa estática es válida en equipos sin aceleración; el informe indica cuántos canvas se renderizaron. La cadencia de requestAnimationFrame es una medición local de cinco segundos, no una certificación de GPU o de 60 fps en teléfonos físicos. No cubre Safari real.

Primera comprobación local de producción: 27 verificaciones correctas, ring y medalla con canvas, sin errores JavaScript; mediana 6,9 ms, p95 7,1 ms y ningún intervalo superior a 25 ms en 722 muestras. Revisión de controles: 12 verificaciones correctas. Unitarias Windows: 647/649; los dos fallos preexistentes usan rutas POSIX de multimedia. La batería completa de usuarios/SQL se ejecuta en CI Linux, sin omitir pruebas. El último CI anterior de #41 (`2f8fee7`) pasó; no valida este bloque nuevo.

El preview local usa una base PostgreSQL ficticia independiente en el puerto 5462. No utiliza datos ni servicios de producción. Las capturas y métricas se guardan en `test-results/experiencia` y no se versionan. La revisión del fundador/Claude y el despliegue quedan separados de esta entrega.

Comprobaciones adicionales después de retirar el loading global: compilación correcta, 16 verificaciones de emulación táctil, viewport ampliable, menú/Escape, campos de 16 px, alternativa sin WebGPU, acciones, zoom de escritorio 200 % y contenido sin JavaScript. Laboratorio desactivado: HTTP 404 comprobado y sin contenido de demostración. No equivale a prueba en Safari físico. Se excluye solo `test-results` del análisis TypeScript: contiene resultados y copias de fixtures descargados, no código mantenido.
