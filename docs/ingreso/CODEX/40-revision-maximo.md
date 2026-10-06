# Parte 4 — revisión a ciegas MÁXIMO

**Resultado: cambios pedidos.** Esta es una revisión estática: no ejecuté ni edité el cambio ficticio, tal como exige el enunciado. Tampoco leí la clave de corrección.

## Críticos

1. **Cualquier cuenta puede borrar cualquier combate.** `removeBoutFromCard()` solo llama a `requireUser()` y no comprueba que la persona sea organizadora de `bout.event`, administradora, ni titular del evento. Una persona autenticada puede enviar cualquier `boutId` directamente a la acción y ejecutar `db.bout.delete`. Debe cargar y autorizar el evento en servidor con la comprobación equivalente a `ownEvent`, y añadir pruebas de cuenta ajena, organizadora titular y moderación.
2. **Se filtra un token de sesión por correo y en una URL HTTP.** El cuerpo construye `http://ring-espana.example.com/...token=${p.user.sessionToken}`. Un token en URL puede acabar en registros, historial y cabecera Referer; con HTTP viaja sin cifrado. Es una toma de cuenta. Nunca se envían tokens de sesión: usar el origen HTTPS configurado, una ruta sin secreto o un token de un solo uso con finalidad y caducidad explícitas.
3. **Borrado destructivo de datos deportivos sin protección ni transacción.** `db.bout.delete` elimina el combate, pudiendo destruir récord, aura, respaldos, avisos y auditoría relacionados. Tampoco hay confirmación ni motivación registrada. La regla del producto exige conservar datos relevantes y avisar antes de acciones irreversibles. Debe definirse el estado correcto (por ejemplo, retirado/cancelado del cartel), conservar historial y auditarlo; si se borra algo permitido, hacerlo de forma transaccional y confirmada.

## Altos

4. **El motivo usa acceso por clave controlada por quien llama.** `motivos[String(f.get("motivo"))]` contradice la regla de no usar `obj[clave]` con datos de usuario; además las propiedades heredadas pueden producir valores inesperados. Validar contra una lista cerrada con `lookup`/`hasOwn` y rechazar valores no permitidos.
5. **Una caída al enviar correo deja el sistema a medias.** El combate ya se ha eliminado antes de que se envíe el primer correo; un fallo posterior no revierte nada y puede avisar solo a una persona. Separar la escritura autorizada/auditada de los avisos posteriores (`after` o cola con reintento), sin declarar que el correo se entregó si solo se solicitó.
6. **La migración no es segura para los datos existentes.** Convertir `weightClass` a `NOT NULL` fallará porque el propio enunciado confirma que hay combates antiguos sin categoría. También altera una propiedad histórica sin plan de relleno ni decisión de producto. Debe ser aditiva o incluir una migración de datos aprobada, comprobada con una copia que contenga nulos y sin inventar categorías.
7. **No se invalida todo lo público afectado.** Solo se llama a `revalidatePath("/organizador")`; permanecen potencialmente desactualizadas la velada pública, fichas/récords de los peleadores, ránking, portada, calendarios y cualquier caché por etiquetas. Invalidar rutas y etiquetas afectadas después de una escritura confirmada.

## Medios

8. **La acción declarada no está conectada a la interfaz.** `<a href="#" onClick={() => removeBoutFromCard}>` devuelve una referencia a función, no la invoca, no envía `FormData` ni `boutId`, y en una página de servidor no es una forma válida de ejecutar una Server Action. El enlace no realiza la operación prometida. Usar un `<form action={removeBoutFromCard}>` con campos validados, motivo y confirmación.
9. **Hay enlaces y controles inaccesibles o engañosos.** El ancla `#` navega al inicio; el `div` con `onClick` no es teclado-operable ni semántico. Además el texto dice «Remove» en inglés, el aviso usa 14 px (el mínimo es 16 px) y `#aaa` sobre fondo claro no garantiza contraste AA. Reemplazar por botones/enlaces reales con etiqueta española, foco visible, zonas táctiles de 44 px y contraste comprobado.
10. **Falta confirmación y explicación de la acción destructiva.** El fragmento no permite elegir un motivo ni confirmar el efecto; tampoco aclara qué sucede con récord, aura y avisos. La pantalla debe presentar la acción principal de forma comprensible, pedir confirmación y mostrar un resultado visible.
11. **`notifyAll` introduce N+1 y no aporta la función requerida.** Hace una consulta por id y envíos secuenciales, no limita destinatarios, no comprueba preferencias/estado y ni siquiera se usa desde la acción. Consultar en conjunto, limitar, reutilizar el mecanismo de avisos existente y no añadir código muerto.
12. **La entrada `boutId` no se normaliza ni limita.** `String(f.get("boutId"))` acepta valores arbitrarios y no aplica el helper común que elimina nulos/espacios ni una longitud máxima. Usar `str`, validar el identificador y responder con un mensaje claro si no existe.

## Pruebas, documentación y veracidad

13. **Se ha saltado una prueba de autorización.** Cambiar `it(...)` por `it.skip(...)` incumple directamente la regla de no saltar pruebas y elimina justo la evidencia de que una persona no autorizada no puede escribir. Restaurarla y añadir cobertura de todas las autorizaciones nuevas.
14. **La afirmación de «todo en verde» no tiene respaldo y contradice el diff.** La descripción afirma navegador, batería y accesibilidad correctos, pero no aporta comandos/resultados y se ve una prueba desactivada. No debe declararse aprobado hasta ejecutar y registrar typecheck, unitarias, build, mapa y los E2E/a11y aplicables.
15. **Documentación insuficiente y falsa precisión.** `DIARIO.md` solo dice «hecho y probado»; faltan la decisión, motivo, errores, límites, próximos pasos, `IDEAS`, `LECCIONES`, `ARQUITECTURA`, mapa funcional y registro de relevo. Debe documentarse la decisión de negocio sobre retirar combates y la evidencia real.
16. **No hay prueba de navegador ni revisión móvil del flujo nuevo.** El cambio altera la fila del cartel y el enunciado exige evidencia móvil, accesibilidad y enlaces reales. Añadir una prueba con organizadora autorizada, otra sin permiso, confirmación, estado visible, y captura/revisión a 390 px.

## Condición para volver a revisar

No aprobaría una corrección hasta que la autorización de servidor, la política de conservación de combates, la migración segura, las invalidaciones y los avisos sin secretos estén decididos e implementados; después, con pruebas restauradas y evidencia real de la batería correspondiente.
