# Escenarios de personas — 15 de octubre de 2026

Estado: ejecución y revisión visual en curso (T-009). No es todavía un informe de lanzamiento aprobado.

Base inicial 059abd9, actualizada a 5625f68 (demo 0.18.7). Servidor propio, PostgreSQL local con semilla ficticia, Chromium e iPhone 14 emulado (390 × 844). Las capturas por paso y `informe.json` se guardan en `test-results/escenarios`; el trabajo independiente del CI los publica como artefacto `escenarios-por-persona`, también si falla.

## Primera pasada y correcciones del guion

La primera pasada detectó nombres de botones antiguos o abreviados (portada, rival, reclamación y recuperación) y una expectativa de confirmación que ya no describe la regla vigente de 24 horas. Se adaptan los selectores a las etiquetas accesibles y se exige que se expliquen la declaración y la fecha en que empezará a contar. En moderación se espera a que el caso salga de la cola antes de comprobar la decisión, evitando leer el aviso anterior. Ninguna de estas correcciones cambia el producto o convierte un error real en éxito.

## Revisión por persona

| Persona | Recorrido | Revisión visual y estado |
|---|---|---|
| Visitante | Portada, ficha, acceso para seguir, menú y búsqueda | Portada legible; el aviso de demo ocupa gran parte de la primera pantalla. Selector de portada actualizado; repetición pendiente. |
| Aficionado | Registro, seguimiento, aura, avisos y salida | Recorrido completo. Confirmación visible; en la captura posterior al guardado se ve el aviso y el pie, y es necesario volver arriba para recuperar el contexto del panel. |
| Peleador | Alta, combate declarado, ficha, trayectoria y retirada | Se ve claramente la confirmación y la fecha de cómputo. Expectativa antigua del estado corregida; repetición pendiente. |
| Promotora | Solicitud, aprobación, velada, cartel y corrección | Recorrido completo. Calendario y filtros legibles; los resultados quedan por debajo del primer pantallazo. |
| Federación | Solicitud, aprobación, presentación y web, permiso para respaldar | Recorrido completo inicial. La denegación de respaldo se explica con acreditación activa; se refuerza su comprobación. |
| Rival | Dos combates, confirmación y revisión motivada | Primera pasada bloqueada por etiqueta accesible abreviada del selector; corregida, repetición pendiente. |
| Reclamación | Ficha provisional creada por rival, reclamación y aprobación | Primera pasada bloqueada por etiqueta abreviada de reclamar; corregida, repetición pendiente. |
| Entrenador titular | Asignación por moderación, presentación, foto y web públicas | Recorrido completo. Foto sintética visible y nombre largo ajustado; el encabezado ocupa casi toda la pantalla. |
| Gimnasio titular | Asignación, edición de presentación/foto/web y perfil público | Recorrido completo. Foto visible y botón de edición accesible. Se observa «Valencia · Valencia» duplicado. |
| Moderadora | Avisos, reclamaciones, organizadores, acreditaciones e historial | La primera pasada llegó a organizadores; se corrige la espera del guion. Repetición y revisión final pendientes. |
| Carmen, 70 años | Letra 150/200 %, registro, ficha, seguimiento con teclado y recuperación | Controles alcanzables y ficha sin desplazamiento horizontal en la primera pasada; recuperación pendiente tras ajustar la etiqueta. Se repetirá manteniendo la ampliación en las navegaciones. |
| Cuenta | Recuperar, cambiar contraseña, descargar datos y eliminar con confirmación | Recuperación bloqueada por selector abreviado; corregido. Resto pendiente. |
| Peleador completo | Foto/banner, título anterior declarado y solicitud de respaldo | Recorrido completo inicial; revisión de sus capturas pendiente. |
| Club | Solicitud como club, aprobación e interclub | Selector de envío corregido; repetición pendiente. |
| Sin verificar | Alta, bloqueo de publicación y confirmación del correo | En ejecución. |
| Creador | Contraseña, activación real del segundo paso y administración | En ejecución. No se modifica la protección del producto. |

## Hallazgos para Claude, fuera del alcance

- La franja de demostración reduce mucho el espacio inicial para las acciones. Solo se ha observado en el entorno con `DEMO_MODE=si`; no se traslada esta observación a producción.
- Algunas capturas posteriores a un envío muestran sobre todo el aviso y el pie: revisar con una persona si recupera fácilmente el contexto al volver al panel.
- La ficha del gimnasio repite ciudad y provincia cuando coinciden («Valencia · Valencia»).

No se han corregido estos aspectos en T-009. Las pruebas emuladas y las capturas no sustituyen una sesión con personas reales ni un teléfono físico.
