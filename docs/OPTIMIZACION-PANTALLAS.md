# Optimización conservando el diseño actual

Petición vigente del fundador, 10 de octubre de 2026: «Es muy importante que no cambies el diseño visual de la página, ya que me gusta como se ve, simplemente quiero que la optimices». El logo todavía no está elegido y queda para el final. No se cambian nombre, logo, colores, Archivo, fondos, imágenes ni estructura de navegación.

## Problemas reproducidos y correcciones

- Un nombre o etiqueta sin espacios puede ampliar las columnas de acciones y desbordar el móvil. Las columnas admiten reducirse y sus textos se parten cuando lo necesitan. Los títulos y enlaces de sección pueden ocupar otra línea si no caben.
- Arrastrar un control dentro de una pestaña cambiaba de sección. Ahora los campos, botones y controles multimedia conservan sus gestos. El zoom con varios dedos tampoco activa un cambio de sección. El contenedor permite los gestos nativos de las filas deslizables y los controles.
- Un `touchcancel` se trataba como una suelta del dedo y podía cambiar la sección. Ahora solo cancela el arrastre.
- Si una foto fallaba, `Foto` conservaba ese error aunque recibiese otra dirección. El fallo se asocia a su dirección y permite cargar una foto nueva. La decodificación de imagen se solicita de forma asíncrona.
- Botones, tarjetas pulsables, barra móvil y pestañas responden con transiciones breves. Se conservan los estados de reposo y los colores existentes. Movimiento reducido desactiva transiciones y escala de pulsación.

## Verificación

`node tests/browser/optimizacion.mjs` abre componentes reales con el CSS real en un servidor temporal local. Comprueba cinco anchuras (320, 360, 390, 430 y 1280 px), controles dentro de pestañas, gestos cancelados, deslizamiento, teclado, foto fallida seguida de una válida y movimiento reducido. No reemplaza los recorridos de la aplicación con usuarios y base de datos.

En Windows: establecer `CHROMIUM_PATH` al Chrome instalado. En CI: utiliza Chromium instalado por Playwright. Esbuild se obtiene de la dependencia existente `tsx`; no se añade una biblioteca al cliente de la aplicación. Las capturas y resultados se guardan en `test-results/optimizacion` (ignorado por Git).

La captura de un título y una fila con textos habituales, antes y después del cambio, tiene los mismos 358×136 píxeles y no presenta diferencias. No es una comparación de todas las pantallas ni una prueba en Safari.

Validación local ejecutada: compilación Next de producción y TypeScript correctos; 12 comprobaciones de navegador correctas; 647 de 649 unitarias correctas. Las dos restantes son preexistentes en archivos sin modificar y usan rutas POSIX en multimedia: su comportamiento difiere en Windows. La validación completa con PostgreSQL debe verificarse en CI; no hay servidor PostgreSQL disponible localmente en el momento de esta tarea.

No publicar ni integrar hasta revisar el cambio y su CI. No interpretar esta optimización como elección de logo ni aprobación de un rediseño.
