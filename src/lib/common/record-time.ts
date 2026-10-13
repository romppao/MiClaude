/** Plazo aprobado para incorporar una declaración propia al récord. */
export const HORAS_PARA_CONTAR_DECLARADO = 24;
export const fechaInicioEnRecord = (createdAt: Date) => new Date(createdAt.getTime() + HORAS_PARA_CONTAR_DECLARADO * 60 * 60 * 1000);
