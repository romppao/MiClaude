/** Explica solo evidencias registradas. Un 503 no demuestra por sí solo un bloqueo de IP. */
export function diagnosticoFuente(f: { url: string; lastError: string | null; lastOkAt: Date | null }): string | null {
  if (!f.lastError) return null;
  const historial = f.lastOkAt ? "La fuente funcionó anteriormente. " : "Nunca se ha completado una lectura correcta. ";
  const error = f.lastError;
  if (/503/.test(error)) return historial + "El servidor de la fuente responde HTTP 503 (servicio no disponible). Puede ser una incidencia o una restricción de acceso; el código no permite confirmar un bloqueo de IP. Revisar un RSS directo como alternativa, previa aprobación.";
  if (/403|401/.test(error)) return historial + "El servidor deniega el acceso. Comprobar sus condiciones y la dirección pública de su RSS; no intentar saltar la restricción.";
  if (/404|410/.test(error)) return historial + "La dirección del canal no existe o ha sido retirada. Comprobar el RSS publicado en la web del medio antes de sustituirla.";
  if (/HTML|RSS|Atom|legibles/.test(error)) return historial + "La respuesta no contiene noticias RSS/Atom válidas. Puede ser una página HTML, un canal vacío o entradas sin título, enlace o fecha válida. Revisar la URL del canal y su formato.";
  if (/tiempo|Timeout|fetch failed/i.test(error)) return historial + "No se pudo completar la conexión desde este servidor. Revisar conectividad y disponibilidad de la fuente; no implica que no publique noticias.";
  return historial + "Última causa registrada: " + error;
}
