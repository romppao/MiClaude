/** Nombre sin tildes, en minúsculas y con los espacios normalizados, para comparar nombres de personas. */
export const normalizeName = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

type NamedFighter = { firstName: string; lastName: string; listed?: boolean; hiddenAt?: Date | null };

/**
 * Nombre que se muestra en público. Una ficha creada por un tercero que aún no ha sido reclamada ni confirmada
 * enseña solo el nombre y la inicial del apellido; una ficha ocultada (anonimizada) no enseña ningún dato.
 */
export function publicFighterName(f: NamedFighter): string {
  if (f.hiddenAt) return "Peleador anónimo";
  if (f.listed === false) return `${f.firstName} ${f.lastName.charAt(0).toUpperCase()}.`;
  return `${f.firstName} ${f.lastName}`;
}

/** Nombre público de una persona usuaria (quien da aura o avisa): nombre de pila e inicial del primer apellido. */
export function publicUserName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Usuario";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}
