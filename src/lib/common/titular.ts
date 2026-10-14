/**
 * Identidad del titular de Lona para el aviso legal (LSSI, art. 10) y la política de privacidad (RGPD, art. 13).
 * Los datos los pone quien despliega la aplicación en variables de entorno; aquí no se inventa ninguno.
 * Detalle y lista de pendientes legales en docs/LEGAL.md.
 */
export type Titular = {
  nombre?: string;
  nif?: string;
  domicilio?: string;
  registro?: string;
  contacto?: string;
};

export const titular = (env: NodeJS.ProcessEnv = process.env): Titular => ({
  nombre: env.TITULAR_NOMBRE || env.RESPONSABLE_NOMBRE || undefined,
  nif: env.TITULAR_NIF || undefined,
  domicilio: env.TITULAR_DOMICILIO || undefined,
  registro: env.TITULAR_REGISTRO || undefined,
  contacto: env.CONTACT_EMAIL || undefined,
});

/** Datos que exige el art. 10 LSSI y que faltan; la comprobación de arranque avisa de ellos. */
export const faltanDatosTitular = (t: Titular): string[] =>
  ([["TITULAR_NOMBRE", t.nombre], ["TITULAR_NIF", t.nif], ["TITULAR_DOMICILIO", t.domicilio], ["CONTACT_EMAIL", t.contacto]] as const)
    .filter(([, v]) => !v).map(([k]) => k);

/** Fecha de la última revisión de los textos legales; se cambia a mano al modificarlos. */
export const LEGAL_ACTUALIZADO = "15 de octubre de 2026";
