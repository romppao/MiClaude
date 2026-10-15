# Avisos y paneles del bloque H

Implementación preparada para revisión, sin despliegue. El seguimiento y aura de entidades (H4) solo tiene propuesta en `decisiones/RFC-002-seguir-y-aura-entidades.md`: requiere revisión de Claude antes de implementar.

## Campanita y privacidad

`Notification` pertenece a una cuenta mediante clave foránea con borrado en cascada. Guarda tipo, título, destino interno, creación y lectura. Se accede desde la campanita y `/avisos`, con paginación y marcado individual o conjunto. Las acciones verifican la sesión y filtran por su usuario: modificar un identificador no permite leer ni marcar avisos ajenos.

Los productores internos están en `src/lib/community/notifications.ts`. Reciben hechos ya autorizados por la acción correspondiente. La clave estable de destinatario y hecho evita duplicados de reintentos. El aura del mismo día se agrupa por peleador y día de Madrid; recibir otra aura puede volver a mostrar ese aviso como no leído. Ningún cliente puede elegir el destinatario de un aviso mediante una acción pública.

Hechos incluidos: anuncio y resultado de peleadores seguidos, aura recibida, combate declarado, reto/sparring, solicitud y respuesta de clase, inscripción y vídeo de un combate. Los resultados a seguidores usan texto genérico, sin nombres ni resultados privados; se excluyen fichas ocultas/provisionales, veladas no públicas y resultados disputados. Los avisos internos no dependen de la preferencia de correo.

Cuando el aviso se escribe dentro de una transacción, se guarda junto al hecho. Los productores posteriores a una escritura confirmada registran el fallo sin convertir el hecho guardado en un falso error para la persona. No son una cola con entrega garantizada ni notificaciones push del teléfono.

La lista, el contador y la exportación excluyen avisos de hace más de 12 meses. `purgeStale` los elimina; borrar la cuenta elimina sus avisos en cascada. No se ha activado un recordatorio de correo antes de las veladas: era opcional y depende del correo real.

## Vídeos del público y highlights

El panel del peleador muestra hasta diez vídeos públicos vinculados a sus combates. «Añadir a mis highlights» exige cuenta verificada y participación en el combate. Se comprueba dentro de una transacción con bloqueo por peleador, con un máximo de doce highlights visibles y una referencia única por peleador/vídeo.

`Highlight.sourceMediaId` referencia `MediaItem`; no duplica ni transfiere el archivo. Retirar u ocultar el original o dejar de publicar su velada hace que la referencia deje de verse. El borrado del original elimina la referencia en cascada. Quitar un highlight propio no borra el archivo ajeno. Restaurar una referencia retirada reutiliza su identidad y respeta el límite. Se avisa a la persona que compartió el vídeo, salvo que sea la misma cuenta.

La entrega del archivo vuelve a comprobar la visibilidad del original. La exportación propia incluye la referencia, sin claves internas de almacenamiento. El panel añade número de seguidores y tres comentarios de aura recientes que no estén ocultos.

## Entrenadores y federaciones

«Mis peleadores» muestra hasta veinte fichas públicas del gimnasio del entrenador con su próximo combate. El enlace al gimnasio permite consultar el resto.

Una entidad de tipo federación ve sus competiciones, títulos y resultados pendientes. Los contadores de respaldo exigen acreditación FEDERATION activa y se limitan a sus disciplinas; no incluyen sus propios hechos ni conceden permisos por tener un perfil visual. `/respaldar` conserva las comprobaciones existentes. Sin acreditación se explica cómo solicitar revisión.

## Moderación

`/moderacion` presenta una sola lista ordenada por urgencia: veladas pasadas, combates con señales, fallos, reclamaciones, organizadores, gimnasios y combates sin señales. Incluye reclamaciones de gimnasio y conserva las anclas antiguas. Cada cola conserva su límite y paginación de cincuenta elementos: la prioridad ordena los elementos de las páginas consultadas, no descarga todas las filas de la base.

Las acciones en línea conservan permisos, auditoría y control de versión de resultados. Los destinos de vuelta solo permiten las pantallas de moderación previstas. La opción de ver todos los gimnasios conserva la retirada del sello de un gimnasio ya verificado.

## Migración y validación

`20261014220000_avisos_y_videos` solo añade Notification, índices y la referencia opcional del highlight. Los highlights existentes permanecen sin referencia y mantienen su comportamiento. No hay migración de H4.

Pruebas: `notifications.test.ts`, guardas en `autorizacion.test.ts` y `paneles-avisos.mjs` (aislamiento de avisos y exportación, referencia/retirada del vídeo, prioridad/anclas y axe). Los guiones existentes se adaptan únicamente al cambio de tablas a artículos de moderación; las tablas deportivas siguen siendo tablas. Las comprobaciones realizadas y las pendientes figuran en el traspaso H: este documento no certifica CI ni migración aplicada.
