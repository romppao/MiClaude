# T-002 — Dependabot sin saltos mayores y limpieza de PRs
**Nivel:** N1 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F1 · **Estado:** hecha por Claude el 6 de octubre de 2026 (a petición del fundador: «corrige todo lo que dijiste…»); ya no sirve como prueba de ingreso (la sustituye [T-013](T-013-enlaces-externos-avisan.md)) · **Sugerida a:** — · **Depende de:** —

## Objetivo
Que Dependabot deje de proponer saltos mayores incompatibles (Next 16, Prisma 7, TypeScript 7) y que las PRs obsoletas queden identificadas para cerrar.

## Contexto
Hay 7 PRs de Dependabot abiertas (#1–#7). Las de **Next 15→16**, **Prisma 6→7** y **TypeScript 5→7** fallan el CI y **no se pueden adoptar** sin un trabajo específico: la regla del proyecto es TypeScript 5.x (Next 15 no es compatible con TS 7). Las de acciones (`checkout`, `setup-node`, `upload-artifact`) son saltos mayores de acciones de GitHub: se prueban una a una. La PR #9 ya está incluida en #10 (obsoleta).
Archivo: `.github/dependabot.yml`.

## Pasos
1. Rama `<asistente>/T-002-dependabot`.
2. En `.github/dependabot.yml`, bajo `npm`, añade `ignore` para saltos mayores de `next`, `prisma`, `@prisma/client`, `typescript` y `react`/`react-dom`:
   `ignore: [{ dependency-name: "next", update-types: ["version-update:semver-major"] }, …]` (uno por dependencia). Mantén las menores y los parches.
3. Conserva `open-pull-requests-limit: 5` y el calendario.
4. Abre el PR. En la descripción **lista** las PRs que habría que cerrar (#3, #4, #5, #6 por salto mayor; #9 por duplicada) y las de acciones (#1, #2, #7) que se pueden probar aparte.
5. **No cierres PRs ajenas**: lo hace el fundador (o lo autoriza explícitamente).

## Criterios de aceptación
- El YAML es válido (el CI de GitHub lo comprueba) y las reglas `ignore` cubren las cinco dependencias.
- El PR contiene la lista de PRs a cerrar con su motivo.

## No hacer
No actualizar dependencias. No tocar `package.json`.

## Documentar
Entrada breve en tu registro y en `DIARIO.md`. Si es tu primera tarea, escribe antes tu `APORTACIONES-<NOMBRE>.md` con qué puedes y qué no puedes ejecutar.
