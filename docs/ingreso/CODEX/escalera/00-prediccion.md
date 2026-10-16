# Escalera — predicción de CODEX (MÁXIMO)

## Entorno y ajustes

- **Herramienta:** Codex.
- **Modelo:** el entorno solo expone que Codex está basado en GPT-5; no muestra el identificador exacto de variante.
- **Modo:** MÁXIMO, por petición expresa del fundador. El valor numérico interno de razonamiento y el contador de tokens no son visibles.
- **Herramientas previstas:** TypeScript, Vitest, Node 24 local (el proyecto declara Node 22 como mínimo), terminal y Git. No usaré dependencias nuevas.

## Predicción antes de escribir código

- Creo que los retos 1, 2 y 4 pasarán todas las pruebas ocultas.
- El reto 3 es el que más probablemente falle en algún caso límite: resolver horas locales ambiguas e inexistentes con solo `Intl.DateTimeFormat` obliga a reconstruir la relación entre hora local e instante sin una biblioteca de zonas horarias.
- Predicción: **3 de 4** retos superarán todas las pruebas ocultas.
- Estimo 75–110 minutos para los retos, pruebas, trampas e informe.

## Consumo

La interfaz no muestra tokens, créditos ni coste. Registraré el tiempo aproximado y una estimación honesta en el informe final; no presentaré una estimación como contador real.
