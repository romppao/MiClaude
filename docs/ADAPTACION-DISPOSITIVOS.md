# Adaptación a móvil, tableta y escritorio

Corrección solicitada por el fundador el 10 de octubre de 2026: retirar el ring flotante sin sentido de bienvenida y adaptar la aplicación al dispositivo. Se conserva identidad, Archivo, paleta, contenido, enlaces y orden de lectura. Rama independiente y PR #41; no despliegue.

La causa del escritorio estrecho era `.pantalla`: 640 px por defecto y solo 720 px en monitores grandes. Los listados heredados que usan `main` ya tenían una cuadrícula flexible; las pantallas nuevas y los paneles permanecían como una columna móvil centrada.

- Hasta 767 px, se conserva la composición móvil. No se detecta el navegador ni la marca del dispositivo.
- Desde 768 px, las pantallas de datos utilizan la anchura disponible, dentro del contenedor máximo de 1240 px con márgenes. Formularios de entrada/registro/compartir usan la clase explícita `pantalla-formulario`, limitada a 640 px para conservar una longitud de lectura cómoda. Formularios de solicitud/propuesta ya tenían ese límite explícito.
- Desde 900 px, bienvenida sitúa la fotografía junto al texto y sus acciones. En móvil conserva la fotografía fundida con el negro y el contenido inferior. El ring y su importación se retiran completamente de esta pantalla; el 3D de demostración sigue en laboratorio.
- Desde 1024 px, los inicios de visitante, aficionado, peleador, entrenador, entidad y portada por disciplina usan dos columnas para sus secciones. Cabecera/portada, navegación y servicios principales abarcan ambas; el orden del DOM y los enlaces se conservan. Las noticias se distribuyen en dos columnas en su listado de escritorio. No se estira contenido sin límite en monitores de 4K.

Las reglas responden al espacio disponible, incluyendo cambios de orientación o redimensionado, sin duplicar páginas ni introducir consultas a datos. Las condiciones existentes de hover/puntero y los controles de teclado/tacto se mantienen.

`tests/browser/adaptacion.mjs` comprueba páginas completas a 320, 390, 844, 1024, 1440 y 2560 px: ausencia de scroll horizontal, bienvenida sin objetos/canvas decorativos, acción Empezar visible, anchura/columnas de inicio y límite de formularios. Incluye axe grave/crítico y capturas de bienvenida/inicio en móvil y escritorio. Solo admite localhost y se ejecuta sobre la demo independiente de CI. Emulación en Chromium: no certifica Safari ni teléfonos físicos.

Validación de este bloque se registra en la propuesta #41 y en el traspaso de Codex. No interpretar las mejoras previas del PR como aprobación de la decoración retirada: el fundador la rechaza y esta corrección prevalece.
