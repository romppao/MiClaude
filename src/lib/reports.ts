export const REPORT_REASONS: Record<string, string> = {
  NO_OCURRIO: "Este combate no ocurrió",
  RESULTADO: "El resultado no es correcto",
  DATOS_PERSONALES: "Contiene datos personales o contenido inapropiado",
  SUPLANTACION: "Alguien se hace pasar por esta persona",
  OTRO: "Otro motivo",
};

export const REPORT_ENTITIES = ["BOUT", "FIGHTER"] as const;
export const MAX_REPORTS_PER_DAY = 10;
