/** Acceso anticipado (17-10-2026): leer la lista pegada de correos y decidir quién puede crear cuenta. */
import { describe, expect, it } from "vitest";
import { MAX_CORREOS_POR_ENVIO, decidirAlta, leerCorreos } from "../../src/lib/accounts/acceso-anticipado";

describe("leerCorreos", () => {
  it("acepta uno por línea, separados por comas, puntos y comas o espacios, y los pasa a minúsculas sin repetir", () => {
    const { validos, invalidos } = leerCorreos("Ana@Gym.es\nluis@correo.com, ana@gym.es; pepe@club.org  <maria@lona.es>");
    expect(validos).toEqual(["ana@gym.es", "luis@correo.com", "pepe@club.org", "maria@lona.es"]);
    expect(invalidos).toEqual([]);
  });

  it("separa lo que no es un correo, sin perder los buenos", () => {
    const { validos, invalidos } = leerCorreos("hola\nana@gym.es\n@sin-nombre.es\nno es correo");
    expect(validos).toEqual(["ana@gym.es"]);
    expect(invalidos).toEqual(expect.arrayContaining(["hola", "@sin-nombre.es", "no", "es", "correo"]));
  });

  it("un texto vacío no da ningún correo", () => {
    expect(leerCorreos("  \n ,; ")).toEqual({ validos: [], invalidos: [] });
  });

  it("el límite por envío es razonable", () => expect(MAX_CORREOS_POR_ENVIO).toBe(200));
});

describe("decidirAlta", () => {
  it("apagado, cualquiera crea cuenta", () => expect(decidirAlta({ activo: false, invitado: false, esCorreoDelCreador: false })).toBe(true));
  it("encendido, solo quien está en la lista", () => {
    expect(decidirAlta({ activo: true, invitado: true, esCorreoDelCreador: false })).toBe(true);
    expect(decidirAlta({ activo: true, invitado: false, esCorreoDelCreador: false })).toBe(false);
  });
  it("el creador siempre puede crear su cuenta, aunque no se haya apuntado", () => expect(decidirAlta({ activo: true, invitado: false, esCorreoDelCreador: true })).toBe(true));
});
