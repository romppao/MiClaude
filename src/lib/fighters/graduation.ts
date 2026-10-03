import { lookup } from "../common/safe";
export const BELTS: Record<string, string> = {
  WHITE: "Blanco", GREY_WHITE: "Gris y blanco", GREY: "Gris", GREY_BLACK: "Gris y negro",
  YELLOW_WHITE: "Amarillo y blanco", YELLOW: "Amarillo", YELLOW_BLACK: "Amarillo y negro",
  ORANGE_WHITE: "Naranja y blanco", ORANGE: "Naranja", ORANGE_BLACK: "Naranja y negro",
  GREEN_WHITE: "Verde y blanco", GREEN: "Verde", GREEN_BLACK: "Verde y negro",
  BLUE: "Azul", PURPLE: "Morado", BROWN: "Marrón", BLACK: "Negro",
  RED_BLACK: "Rojo y negro", RED_WHITE: "Rojo y blanco", RED: "Rojo",
};
export function parseGraduation(discipline: string, belt: string, degrees: string) {
  if (discipline !== "JIUJITSU") return { belt: null, beltDegrees: null };
  if (!belt && !degrees) return { belt: null, beltDegrees: null };
  if (!lookup(BELTS, belt) || (degrees && !/^(?:[0-9]|10)$/.test(degrees))) return null;
  return { belt, beltDegrees: degrees ? Number(degrees) : null };
}
export function graduationLabel(belt: string | null, degrees: number | null) {
  const name = belt && lookup(BELTS, belt);
  return name ? `Cinturón ${name.toLocaleLowerCase("es")}${degrees === null ? "" : ` · ${degrees} ${degrees === 1 ? "grado" : "grados"}`}` : null;
}
