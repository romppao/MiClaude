# T-009 — Ampliar los escenarios por persona
**Fase:** F1 · **Estado:** lista · **Sugerida a:** cualquiera con PostgreSQL y navegador (o solo CI; entonces entrega solo el guion y las capturas se miran desde el artefacto del CI) · **Depende de:** —

## Objetivo
Que los escenarios (`tests/e2e/escenarios.mjs`, `npm run test:escenarios`) cubran a **todos** los tipos de persona y los recorridos que de verdad harán, y dejen un informe revisable.

## Contexto
Hoy: visitante, aficionado, peleador, promotora y federación (43 pasos, iPhone 14 emulado, capturas en `ESC_DIR`). Faltan personas y recorridos (véase abajo). Cada persona usa un contexto móvil, textos visibles (roles y nombres como los ve una persona) y datos únicos por ejecución (`rnd`).

## Pasos
1. Rama `<asistente>/T-009-escenarios`.
2. Añade personas (cada una con su descripción de una frase y sus pasos, con la misma estructura `persona(...)`/`paso(...)`):
   - **Rival** (Iker): otra cuenta de peleador a la que el rival de Diego avisa; confirma un combate, y otro lo rechaza con motivo; comprueba que el autor ve la respuesta.
   - **Reclamación** (Nuria): su ficha provisional existe (creada por un rival); la reclama y la moderación la aprueba.
   - **Entrenador y gimnasio** (titulares): la moderación les asigna el perfil (`ownerEmail`); editan texto, foto y web; el perfil público lo refleja.
   - **Moderadora** recorre **todas** sus colas (avisos, reclamaciones, solicitudes de organizador, acreditaciones, historial) y resuelve un caso de cada una.
   - **Persona mayor** (Carmen, 70 años): letra ampliada (inyecta `html{font-size:150%}` y `200%`), solo teclado/pulsaciones simples; recorre registro, ver una ficha, seguir y recuperar contraseña; falla si algo se sale de la pantalla o un botón queda sin alcanzar.
   - **Cuenta**: recuperar contraseña, cambiar contraseña, descargar mis datos, eliminar cuenta (con su confirmación).
   - **Peleador completo**: foto y banner (genera un PNG pequeño en el guion), título anterior declarado, petición de respaldo, ver cómo queda la ficha pública.
3. Cada persona debe **fallar con un mensaje claro** si no consigue hacer lo que intenta (no esperas arbitrarias; usa estados visibles).
4. Tras ejecutar, **mira las capturas** (o bájalas del artefacto) y escribe `docs/pruebas/escenarios-<fecha>.md`: por persona, qué se probó, qué se vio a ojo (confusión, texto raro, algo tapado o poco claro) y qué se corrigió o queda abierto. Las cosas que veas y no estén en el alcance se anotan como hallazgos para Claude (sin arreglarlas por la libre).
5. Sube las capturas como artefacto del CI cuando falle (como ya hace `ayudas.mjs`).

## Criterios de aceptación
- Al menos 12 personas/escenarios en total, todos con 0 fallos o con hallazgos documentados.
- Informe con revisión visual por persona.

## No hacer
No convertir los escenarios en comprobaciones sueltas: son recorridos. No tocar el producto salvo que un fallo bloquee el recorrido (en ese caso, PR aparte).

## Documentar
`docs/pruebas/`, `PLAN.md`, `DIARIO.md`, tu registro.
