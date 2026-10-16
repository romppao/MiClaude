// Vigila docs/APROBADO.md: cada función aprobada por el fundador tiene que seguir teniendo la prueba que la protege.
// Falla si una fila cita un archivo que ya no existe o una comprobación (texto exacto) que ya no está en ese archivo.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const filas = readFileSync(join(raiz, "docs", "APROBADO.md"), "utf8")
  .split("\n")
  .filter((l) => /^\| APR-\d+ \|/.test(l))
  .map((l) => {
    const celdas = l.split("|").slice(1, -1).map((c) => c.trim());
    const ref = celdas[2].match(/^`([^`]+)`\s+—\s+«(.+)»$/);
    return { id: celdas[0], funcion: celdas[1], archivo: ref?.[1], texto: ref?.[2], celdas };
  });

test("el registro de funciones aprobadas tiene filas bien formadas y sin identificadores repetidos", () => {
  assert.ok(filas.length >= 10, "el registro no puede quedarse vacío");
  const ids = filas.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length, `identificadores repetidos: ${ids.filter((x, i) => ids.indexOf(x) !== i)}`);
  for (const f of filas) {
    assert.equal(f.celdas.length, 3, `${f.id}: debe tener tres columnas (ID, función, dónde se comprueba)`);
    assert.ok(f.funcion.length > 15, `${f.id}: describe la función aprobada`);
    assert.ok(f.archivo && f.texto, `${f.id}: la tercera columna debe ser \`archivo\` — «texto de la comprobación»`);
  }
});

for (const f of filas) {
  test(`${f.id} sigue protegida por su prueba (${f.archivo})`, () => {
    const ruta = join(raiz, f.archivo);
    assert.ok(existsSync(ruta), `${f.id}: ya no existe ${f.archivo}. Quitar una prueba de una función aprobada necesita la aprobación del fundador.`);
    const contenido = readFileSync(ruta, "utf8");
    assert.ok(contenido.includes(f.texto), `${f.id}: ${f.archivo} ya no contiene «${f.texto}». Si la función cambió con permiso del fundador, actualiza la fila; si no, se corrige el cambio, no la prueba.`);
  });
}
