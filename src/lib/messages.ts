/**
 * Mensajes que se muestran al usuario tras una acción. Van en la URL como código (?aviso=… / ?problema=…)
 * y se traducen aquí, para que el texto esté en un solo sitio y sea claro, amable y profesional.
 */
export const AVISOS: Record<string, string> = {
  ficha_creada: "Tu ficha de peleador se ha creado. Ya puedes registrar tus combates.",
  combate_registrado: "Combate registrado. Aparecerá como «pendiente de confirmar» hasta que tu rival lo confirme.",
  combate_confirmado: "Has confirmado el combate. Gracias.",
  combate_rechazado: "Has indicado que el combate no es correcto. No contará en el récord mientras no se aclare.",
  valoracion_guardada: "Tu valoración se ha guardado. Gracias por ayudar a dar a conocer a este peleador.",
  evidencia_guardada: "El enlace de evidencia se ha guardado.",
  evidencia_quitada: "Has quitado el enlace de evidencia.",
  velada_creada: "La velada se ha creado. Ahora puedes añadir los combates del cartel.",
  cartel_anadido: "El combate se ha añadido al cartel.",
  resultado_guardado: "El resultado se ha guardado.",
  reporte_enviado: "Gracias. Hemos recibido tu aviso y un moderador lo revisará.",
  siguiendo: "Ahora sigues a este peleador. Verás sus próximas veladas en «Mis peleadores».",
  siguiendo_quitado: "Has dejado de seguir a este peleador.",
  solicitud_enviada: "Solicitud enviada. Un moderador la revisará y te avisaremos.",
};

export const PROBLEMAS: Record<string, string> = {
  combate_datos: "Revisa los datos del combate: hacen falta el nombre de la velada, la fecha y el nombre y los apellidos de tu rival.",
  combate_duplicado: "Este combate ya está registrado en esa velada. Si lo registró tu rival, respóndele desde «Mi ficha».",
  cartel_duplicado: "Ese combate ya está en el cartel de esta velada.",
  combate_mismo: "Tu rival no puede ser tú mismo. Escribe el nombre de la otra persona.",
  nombre_ficha: "Escribe tu nombre y tus apellidos para crear la ficha.",
  valorar_nota: "Elige una nota de 1 a 5 estrellas.",
  valorar_propio: "No puedes valorar un combate en el que has participado.",
  valorar_futuro: "Solo se puede valorar un combate cuando ya se ha celebrado.",
  valorar_revision: "Este combate está en revisión y por ahora no se puede valorar.",
  valorar_limite: "Has llegado al límite de 20 valoraciones al día. Vuelve a intentarlo mañana.",
  valorar_no_existe: "No hemos encontrado ese combate. Inténtalo de nuevo desde la ficha del peleador.",
  url_invalida: "El enlace no es válido. Debe empezar por http:// o https://.",
  reporte_repetido: "Ya nos avisaste de esto y lo estamos revisando. Gracias por tu paciencia.",
  reporte_limite: "Has enviado muchos avisos hoy. Inténtalo de nuevo mañana.",
  reporte_datos: "Elige el motivo del aviso para poder enviarlo.",
  seguir_propio: "Tu propia ficha no se puede seguir.",
  seguir_no_existe: "No hemos encontrado a ese peleador.",
  sin_permiso: "No tienes permiso para hacer esta acción.",
  cartel_peleadores: "Elige dos peleadores distintos de la lista.",
  resultado_futuro: "Solo puedes poner resultados cuando la velada ya se ha celebrado.",
  velada_datos: "Revisa el nombre y la fecha de la velada.",
  nombre_organizacion: "Indica el nombre de tu organización.",
};
