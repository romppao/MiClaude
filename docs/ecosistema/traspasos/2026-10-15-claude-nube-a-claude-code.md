# Relevo: Claude (nube) → Claude Code (portátil), 15-10-2026 por la tarde

> **El fundador:** «pausa las cosas, prepara un documento para que cuando llegue a casa y coja el portátil, le diga a Claude Code que continúe con toda esta labor que has hecho… Sin pisar el trabajo que hayamos realizado… con Claude Code tengo muchísima más flexibilidad y capacidad».
>
> **Lo primero:** `git fetch`, `node scripts/estado.mjs` y lee `docs/ESTADO.md`. Después, este documento de arriba abajo. **No empieces nada nuevo hasta cerrar la sección 2.**

## 1. Qué hizo hoy Claude (nube): todo fusionado en `claude/ring-espana-mvp`

| Versión | PR | Qué |
|---|---|---|
| 0.15.1 | #72 | La demo no sale en los buscadores (noindex y mapa del sitio vacío) |
| 0.16.0 | #73 | Bloquear usuarios, `/avisar` (avisos sin cuenta) y correos de decisión de moderación (DSA) |
| 0.16.1 | #74 | Fotos fuera de la base de datos (`lib/media/fotos.ts`: R2, o disco en pruebas) |
| 0.17.0 | #75 | Paneles F y G (sustituye a #56, #62, #69 y #70) |
| 0.18.0 | #76 | Gimnasios reales (D) y campanita de avisos (H) de Codex, corregidos (sustituye a #64 y #71) |
| 0.18.1 | #79 | Cola de correos con reintentos y límite diario (`lib/common/cola-correo.ts`) |
| 0.18.2 | #80 | Botón de GitHub «Cargar gimnasios reales en la demo» y `docs/DOMINIO.md` |

## 2. Lo que quedó a medias: ciérralo, por este orden

Cada PR: si sus pruebas pasan, fusiónalo. Si la rama se ha quedado atrás, actualízala con `git merge origin/claude/ring-espana-mvp`. **En los conflictos de `package.json`, une a mano los scripts y las dependencias, sin tomar un lado entero**, y sube la versión por encima de la de la demo (`node scripts/version.mjs subir parche`).

1. **#81, avisos de fallos a Sentry (0.18.3)**, rama `claude-nube/avisos-de-fallos-sentry`. El primer CI falló al compilar por `node:crypto`; ya está corregido con `globalThis.crypto` y el CI se estaba repitiendo. Comprueba que pasa y fusiónalo.
2. **#82, lista investigada de gimnasios**, rama `claude-nube/gimnasios-investigados`. Va también en 0.18.3: al fusionarlo después de #81, renumera a 0.18.4. Trae:
   - `docs/datos/gimnasios-investigados.json`, con 191 clubes;
   - `scripts/importar-gimnasios-lista.ts`;
   - las opciones «lista-recuento» y «lista-cargar» del botón de GitHub.
3. **Integración de T-013 y T-002 de Codex**, rama `claude-nube/integrar-t013-t002`. **Está subida pero no tiene PR.**
   - Junta #77 (enlaces que abren otra pestaña) y #78 (cinco actualizaciones de Dependabot, con `package-lock.json` regenerado). Ya se resolvieron los conflictos y se recuperó el enlace «Gimnasio» de los avisos de moderación, que la versión de Codex borraba.
   - Incluye el traspaso a Codex (`docs/ecosistema/traspasos/2026-10-15-claude-a-codex-pendientes.md`).
   - **Falta:** actualizarla con la demo, subir la versión, regenerar el catálogo (`node scripts/generar-catalogo.mjs`, apartando antes `next-env.d.ts`) y el mapa (`npm run mapa`), abrir el PR y fusionarlo cuando pase.
   - Después, cierra #77, #78 y los de Dependabot #17, #18, #19, #65 y #66, con un comentario que diga «sustituido por <tu PR>».
4. **Este documento** está en la rama `claude-nube/relevo-a-claude-code`, con su PR. Fusiónalo también.

## 3. El trabajo grande que sigue: gimnasios reales y actualizados

Peticiones del fundador, con sus palabras:
- «los gimnasios de la vida real… todos los perfiles de clubes de boxeo, de jiu-jitsu, de muay thai, de todas las disciplinas… Solo gimnasios de deportes de contacto… No gimnasios simplemente de fitness».
- «no te olvides de hacerlo con todas las comunidades autónomas».
- «intenta que la información sea actual… De no más de un año». Él es socio del **Club de Boxeo Ludus** (Móstoles), que hoy da **boxeo y K-1**; el jiu-jitsu y el MMA ya no.

**Desde la nube no se pudo terminar:** se agotó el límite de búsquedas, no se podía abrir ninguna web y OpenStreetMap estaba bloqueado. Tú sí puedes.

1. **Revisar las 190 entradas de `docs/datos/gimnasios-investigados.json`.** Abre la fuente, la web o el perfil de cada una y confirma:
   - que sigue abierta;
   - sus disciplinas **de hoy** (códigos: `BOXEO`, `KICKBOXING`, `K1`, `MUAYTHAI`, `MMA`, `JIUJITSU`);
   - la dirección, la web y el Instagram.

   Apunta en `fechaFuente` (AAAA-MM-DD) la fecha de una fuente de **menos de un año**. Si está cerrada o no se puede confirmar, bórrala o déjala en `"confidence": "media"` con una `nota`. **Solo se publica lo que tiene `confidence: "alta"` y `fechaFuente` reciente** (lo comprueba `prepararFila`).
2. **Completar las comunidades que faltan.**
   - Sin ningún club: Castilla-La Mancha (Albacete, Ciudad Real, Cuenca, Guadalajara y Toledo), Extremadura (Badajoz y Cáceres), Canarias (Las Palmas y Santa Cruz de Tenerife), Huesca y Castilla y León menos León y Valladolid (Ávila, Burgos, Palencia, Salamanca, Segovia, Soria y Zamora).
   - Con pocos clubes: Andalucía (Almería, Córdoba, Huelva y Jaén no tienen ninguno), Castellón, Murcia y Baleares.
   - **Cataluña no**: es decisión del fundador.
3. **Fuentes.** Valen la web del club, los directorios de las federaciones (de boxeo y de kickboxing y muay thai, regionales y españolas), las listas de afiliados de jiu-jitsu, las noticias y los perfiles públicos de Instagram o Facebook.
   - **No copies datos de Google Maps**: sus condiciones lo prohíben. Puedes usarlo solo para descubrir clubes y confirmarlos en otra fuente.
   - No guardes datos de personas: ni teléfonos personales ni nombres de particulares.
4. **Carga en la demo.** Hazla tú, si tienes la `DATABASE_URL` de la demo:

   ```
   DEMO_MODE=si npx tsx scripts/importar-gimnasios-lista.ts
   DEMO_MODE=si npx tsx scripts/importar-gimnasios-lista.ts --aplicar
   ```

   El primer comando solo hace el recuento; enséñaselo al fundador. Si no tienes esa dirección, lo hace el fundador desde GitHub: Actions → «Cargar gimnasios reales en la demo», con «lista-recuento» y después «lista-cargar».
5. **OpenStreetMap:** `npm run gimnasios:osm -- --comparar-base --demo` y, con su visto bueno, `--aplicar --demo --plan …` (`docs/GIMNASIOS-REALES.md`). También se puede lanzar desde el botón de GitHub, con «recuento» y «cargar». Nunca en la versión real sin el fundador.

## 4. Reglas nuevas de hoy (están en `CLAUDE.md` y `ESTADO.md`)

- **Dominio lonaclub.es:** ningún asistente toca el dominio, la zona DNS ni la cuenta de Infomaniak (`docs/DOMINIO.md`). El fundador teme perderlo. El orden seguro para separarlo de la demo es **primero el DNS y después Render**.
- **Agilizar:** si Codex falla o deja algo a medias, Claude lo corrige en su propia rama, nunca en la de Codex, le deja instrucciones escritas y lo fusiona. Al fundador no se le informa de cada paso, solo de lo que necesita de él.
- **Bloqueos:** todo contacto nuevo entre personas comprueba `hayBloqueo`, y toda lista de lo que publica otra persona filtra `bloqueadosPor`.
- **Fotos:** solo con `guardarFoto`, `leerFoto` y `borrarFotos`. **Correos:** solo con `sendMail`, que ya pasa por la cola.
- **Lo que importe `fallos.ts` no usa `node:*`**, porque también se carga en el middleware. Ejecuta `npm run build` antes de subir un módulo común.
- **Pruebas en local:** arranca el servidor con `node node_modules/next/dist/bin/next start` y guarda su PID. Mata ese PID, nunca `pkill -f` ni `kill $(pgrep -f …)`. Comprueba que `EADDRINUSE` sale 0.

## 5. Lo que necesita al fundador (recuérdaselo solo si sale el tema)

- **Gimnasios en la demo:** el secreto `DEMO_DATABASE_URL` en GitHub, con el mismo valor que la `DATABASE_URL` de Render.
- **Dominio:** las protecciones de Infomaniak (renovación automática, bloqueo de transferencia y verificación en dos pasos) y, cuando quiera, separar el dominio de la demo con `docs/DOMINIO.md`.
- **Para publicar la versión real:**
  - Google Cloud con facturación (alerta de 1 €);
  - Cloudflare R2 (fotos, vídeos y copias);
  - Resend (correo);
  - Sentry (avisos de fallos, región UE) y UptimeRobot sobre `/salud`;
  - repositorio privado;
  - decisión sobre los menores;
  - abogado.

  Todo está en `docs/PRODUCCION.md` y `docs/LANZAMIENTO.md`.
- **Codex** vuelve cuando el fundador recupere sus créditos. Lo suyo está en `docs/ecosistema/traspasos/2026-10-15-claude-a-codex-pendientes.md`, en la rama de integración del punto 2.3. **Revisa y corrige siempre lo que entregue.**
- **Enfoque del producto (RFC-001):** se decide al final, cuando el fundador confirme qué versión aceptó. No lo apliques.
