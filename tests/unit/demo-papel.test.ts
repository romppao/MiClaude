/** Demostración: el tipo de cuenta que se prueba manda sobre la ficha de peleador vinculada (aviso del fundador, 16-10-2026). */
import { describe, expect, it } from "vitest";
import { ignorarFichaVinculada, papelDe } from "../../src/lib/accounts/landing";

describe("probar como otra persona en la demo", () => {
  const conFicha = (role: string) => ({ role, fighter: { id: "f1" } });
  it("el aficionado con una ficha de cuando probó «Peleador» ve la pantalla de aficionado", () => {
    const user = conFicha("FAN");
    // Sin la regla, la ficha vinculada hacía que «Aficionado» viera al peleador (el fallo que se corrige).
    expect(papelDe(user)).toBe("peleador");
    const visto = ignorarFichaVinculada(user.role, true) ? { ...user, fighter: null } : user;
    expect(papelDe(visto)).toBe("usuario");
  });
  it("el peleador conserva su ficha", () => expect(ignorarFichaVinculada("FIGHTER", true)).toBe(false));
  it("fuera de la demo nada cambia: una cuenta con ficha vinculada sigue siendo de peleador", () => {
    expect(ignorarFichaVinculada("FAN", false)).toBe(false);
    expect(papelDe(conFicha("FAN"))).toBe("peleador");
  });
  it("entrenador, organizadora y moderador no arrastran la ficha en la demo", () => {
    for (const role of ["TRAINER", "ORGANIZER", "ADMIN"]) expect(ignorarFichaVinculada(role, true)).toBe(true);
  });
  it("cada tipo probado da su pantalla", () => {
    const sinFicha = (role: string) => ({ role, fighter: null });
    expect(papelDe(sinFicha("FAN"))).toBe("usuario");
    expect(papelDe(sinFicha("FIGHTER"))).toBe("peleador");
    expect(papelDe(sinFicha("TRAINER"))).toBe("entrenador");
    expect(papelDe(sinFicha("ORGANIZER"))).toBe("entidad");
  });
});
