# T-016 — Revisión completa antes de montar la versión oficial

**Estado:** pendiente, sin empezar.
- 14-10-2026: Claude Code lanzó las cinco partes en paralelo y las cinco se cortaron por un fallo del servicio de Anthropic (`[reasoning_extraction]`), no de la app. No hay resultados parciales.
- Se repite desde cero.

**Para quién:** el primer asistente con créditos: Claude (cualquier sesión) o Codex.

## Por qué
Decisión del fundador del 14-10-2026 (`docs/ESTADO.md`, sección 4):
- Primero se comprueba que la app está bien desarrollada.
- Solo después se monta la versión oficial en lonaclub.es y se publica la app de Google.
- La oficial tiene que ser «real y definitiva»: sin datos de prueba, sin avisos de demo y totalmente independiente de la demo.
- La demo (Render) queda como espacio de pruebas.

## Cómo hacerla
- Sobre la rama `claude/ring-espana-mvp` (0.13.0 o posterior). **Solo lectura** mientras se revisa.
- Los arreglos se hacen después, en un PR aparte con su subida de versión.
- Leer antes: `docs/ESTADO.md`, `docs/MAPA-FUNCIONAL.md`, `docs/LANZAMIENTO.md` (sección 4), `docs/PULIDO-FUNCIONAL.md` y `docs/PRODUCCION.md`.
- Hacerla **por partes y de una en una**, guardando el resultado de cada parte en este archivo antes de empezar la siguiente, para que un corte no haga perder lo hecho.
- Cada hallazgo se apunta así:
  - **gravedad:** BLOQUEA EL LANZAMIENTO, IMPORTANTE o MENOR;
  - `archivo:línea`;
  - qué falla y cómo se reproduce;
  - el arreglo en una frase;
  - si se ha **comprobado** o solo se **sospecha**.

## Partes (en este orden)
1. **Seguridad y moderación:**
   - sesiones y contraseñas, y límite de intentos tras el proxy (`TRUSTED_PROXY_HOPS`);
   - OAuth de Google: `state`, correo verificado y unión de cuentas;
   - el 2FA del creador;
   - autorización e IDOR en todas las server actions y rutas `api/`;
   - que sin `DEMO_MODE=si` todas las acciones de demo estén bloqueadas **en el servidor** (`src/app/actions/demo.ts`, `/laboratorio`);
   - XSS, `$queryRaw`, subidas de archivos, CSP, CSRF y redirecciones abiertas;
   - `CRON_SECRET`;
   - que los registros no guarden datos personales;
   - borrado de la cuenta y exportación de los datos.
2. **Preparación de la oficial:**
   - arranque con la base **vacía**: variables obligatorias, nada que dependa del seed y cómo se crea la primera cuenta de moderador o creador sin el modo demo;
   - `docker build` del `Dockerfile`: Prisma en *standalone*, `openssl`, `public/`, el puerto y el trabajador de MapLibre;
   - la conexión *pooled* de Neon con Prisma y las fotos guardadas en la base (el límite es 1 GB);
   - correos reales con Resend;
   - `/salud` y `/moderacion/fallos`.
3. **Visitante y aficionado:**
   - portada, búsqueda, listados, fichas, mapa de gimnasios y noticias;
   - registro, inicio de sesión, recuperar la contraseña y verificar el correo;
   - «Peleadores que sigo», avisos, aura y «Mi cuenta»;
   - páginas legales.
4. **Peleador y entrenador:**
   - perfil, peso y categoría;
   - récord: autodeclarado, regla de las 24 horas y amateur oculto;
   - sparring por ciudad y gimnasio;
   - vínculos, paneles, rangos y escalera;
   - datos sensibles y menores (T-014).
5. **Gimnasios, organizadores y veladas:**
   - alta y reclamación de gimnasios (los reales de OpenStreetMap, **ninguno de Cataluña**, ni en el mapa);
   - veladas: crear, publicar y cartel;
   - resultados y su efecto en récords;
   - veladas pasadas solo con permiso de moderación;
   - permisos entre entidades.

En todas las partes hay que buscar también restos de demo que se vean sin `DEMO_MODE`: «Ring España» (retirado), «ejemplo», «lorem», datos fijos, `onrender.com` y `localhost`.

## Resultado
Se entrega al fundador una lista corta y en lenguaje llano: lo que está bien, lo que hay que arreglar antes de la oficial y lo que puede esperar. Después vienen los arreglos, montar la oficial (`docs/PRODUCCION.md`) y publicar la app en Google.

### Hallazgos
_(vacío: rellenar parte por parte)_
