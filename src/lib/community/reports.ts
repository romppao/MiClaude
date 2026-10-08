export const REPORT_REASONS: Record<string, string> = {
  NO_OCURRIO: "Este combate no ocurrió",
  RESULTADO: "El resultado no es correcto",
  DATOS_PERSONALES: "Contiene datos personales o contenido inapropiado",
  SUPLANTACION: "Alguien se hace pasar por esta persona",
  INAPROPIADO: "Es ofensivo, falso o inapropiado",
  MI_IMAGEN: "Aparezco yo (o un menor a mi cargo) y no doy permiso para publicarlo",
  OTRO: "Otro motivo",
};

export const REPORT_ENTITIES = ["BOUT", "FIGHTER", "AURA", "MEDIA"] as const;
export type ReportEntity = (typeof REPORT_ENTITIES)[number];

/** Motivos que se ofrecen según lo que se avisa. */
export const REASONS_BY_ENTITY: Record<ReportEntity, string[]> = {
  BOUT: ["NO_OCURRIO", "RESULTADO", "DATOS_PERSONALES", "OTRO"],
  FIGHTER: ["DATOS_PERSONALES", "SUPLANTACION", "OTRO"],
  AURA: ["INAPROPIADO", "DATOS_PERSONALES", "OTRO"],
  MEDIA: ["MI_IMAGEN", "INAPROPIADO", "OTRO"],
};

export const MAX_REPORTS_PER_DAY = 10;
