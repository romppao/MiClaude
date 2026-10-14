# T-016 — Revisión completa antes de montar la versión oficial

**Estado:** en curso. Parte 1 hecha (14-10-2026, Claude); partes 3-5 encargadas a Codex; parte 2 pendiente.
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

#### Parte 1. Seguridad y moderación
Hecha por Claude Code el 14-10-2026, en la sesión y sin subagentes, sobre `f7204ac` (0.14.0). Solo lectura.

**Revisado y correcto** (comprobado leyendo el código):
- **Sesiones:**
  - token aleatorio de 32 bytes; la base solo guarda su SHA-256;
  - cookie `httpOnly`, `sameSite=lax` y `secure` en producción;
  - los enlaces de verificación y recuperación son de un solo uso, con borrado atómico;
  - la recuperación cierra todas las sesiones (`src/lib/accounts/auth.ts`).
- **Entrar:**
  - el intento se reserva antes de calcular el hash (`reservar`);
  - hay límite por correo y por IP;
  - un correo inexistente tarda lo mismo (`dummyHash`);
  - la recuperación no revela si la cuenta existe (`src/app/actions/accounts.ts`).
- **Google:**
  - PKCE S256, `state` y `nonce` en una cookie de 10 minutos y de un solo uso;
  - se comprueban el emisor, el destinatario, la caducidad y `email_verified`;
  - unión de cuentas: si había una cuenta con ese correo sin confirmar, se invalida su contraseña y se cierran sus sesiones («secuestro previo»);
  - no se cambia en silencio otra cuenta de Google ya vinculada (`src/app/api/auth/google/callback/route.ts`).
- **Segundo paso del creador:**
  - TOTP con protección contra reutilización (`totpLastStep`);
  - códigos de emergencia de un solo uso, con actualización condicionada;
  - 6 intentos por cuarto de hora;
  - `esCreador` exige el correo verificado (`src/app/actions/creador.ts`, `src/lib/accounts/creador.ts`).
- **Autorización:**
  - las 80 acciones exportadas de `src/app/actions/` empiezan por `requireUser`, `requireVerifiedUser`, `requireOrganizer`, `requireAdmin`, `requireCreador` o `requireSupportActor`, salvo las públicas por diseño: registro, entrar, salir, recuperar, verificar y baja;
  - `shared.ts` no lleva `"use server"`, así que sus funciones no se exponen;
  - `saveProfile` usa `profileAccess`, que solo deja editar al titular o a moderación.
- **Modo demo:**
  - `demoConfirmarCorreo` y `demoCambiarPapel` comprueban `demoActiva()` en el servidor;
  - `/laboratorio` exige `EXPERIENCE_LAB=si` y `DEMO_MODE=si`, y si no da 404.
- **Inyección y XSS:**
  - todo el SQL a mano usa plantillas etiquetadas de Prisma (parametrizadas); no hay `$queryRawUnsafe`;
  - el único `dangerouslySetInnerHTML` es una constante (`TEMA_INICIAL`);
  - los enlaces de usuarios pasan por `safeHttpUrl`, que solo admite http y https.
- **Subidas de imágenes:** `sharp` con límite de píxeles; solo JPEG, PNG o WebP de una página; se recodifican a WebP, lo que borra el EXIF y la ubicación (`src/lib/profiles/images.ts`).
- **CSP y cabeceras:** `frame-ancestors 'none'`, `form-action 'self'`, `object-src 'none'`, HSTS, `nosniff` y `poweredByHeader: false`. CSRF: las acciones de Next comprueban el origen, y `/api/fallos` exige el mismo `Origin`.
- **Redirecciones:** `internalPath` rechaza otro origen, las barras invertidas y los caracteres de control.
- **`CRON_SECRET`:** va en una cabecera, con comparación en tiempo constante; sin la variable, el endpoint queda cerrado (503).
- **Registros:** `tacharDatos` quita correos, `?token=`, claves largas y URLs de Postgres. El modo de correo «log» solo se activa fuera de producción o con `MAIL_TRANSPORT=log`.
- **Exportar datos:** `/mi-cuenta/datos` exige sesión y enumera los campos uno a uno, sin el hash, el TOTP ni los códigos.
- **Borrar la cuenta:**
  - anonimiza la ficha si tiene combates;
  - vacía los datos del historial;
  - impide borrar al último moderador;
  - borra después los vídeos del almacén.

**Hallazgos:**
1. **IMPORTANTE. Quien se registra con Google no puede borrar su cuenta ni cambiar la contraseña** (comprobado).
   - **Dónde:** `src/app/api/auth/google/callback/route.ts:236` crea la cuenta con una contraseña aleatoria que nadie conoce. `deleteAccount` y `changePassword` (`src/app/actions/accounts.ts:232`, `confirmOwnPassword`) exigen la contraseña actual, y `/mi-cuenta/eliminar` solo pide la contraseña.
   - **Cómo se reproduce:** entrar con Google, ir a *Mi cuenta → Eliminar*: imposible sin pasar antes por «¿Has olvidado tu contraseña?».
   - **Por qué importa:** Apple 5.1.1 y Google Play exigen poder borrar la cuenta desde la app, y es un derecho del RGPD.
   - **Arreglo:** si la cuenta tiene `googleSub` y la persona nunca ha elegido contraseña (campo nuevo, o comprobar que el inicio de sesión con Google es reciente, de menos de 10 minutos), confirmar escribiendo «ELIMINAR» o volviendo a pasar por Google. En «Cambiar contraseña», ofrecer «Elegir una contraseña» con un enlace por correo.
2. **IMPORTANTE. Comprobar `TRUSTED_PROXY_HOPS` en Cloud Run antes de abrir** (sospecha, no comprobado).
   - **Dónde:** `src/lib/accounts/ratelimit.ts:193` toma la IP del final de `X-Forwarded-For`, contando desde el final.
   - **El riesgo:** si el frontal de Google añade su propia IP detrás de la del cliente, todos los usuarios compartirían una sola «IP». Entonces el límite de 40 intentos de acceso cada 15 minutos o el de 10 registros por hora bloquearían a todo el mundo a la vez.
   - **Arreglo:** en el primer despliegue, mirar el valor real de la cabecera en una petición de prueba (en `/moderacion/fallos` o en un registro temporal) y ajustar `TRUSTED_PROXY_HOPS`. Apuntarlo en `docs/PRODUCCION.md`.
3. **MENOR. El segundo paso del creador se activa con la primera sesión que tenga la contraseña** (comprobado; es por diseño).
   - **Dónde:** `activarSegundoPaso`.
   - **El riesgo:** hasta que el fundador lo activa, quien conozca la contraseña del creador podría activarlo con su propio móvil.
   - **Arreglo (de procedimiento):** en la oficial, activar el segundo paso nada más crear la cuenta del creador. Añadirlo a la lista de `docs/PRODUCCION.md`.
4. **MENOR. Restos de «Ring España»** (comprobado; no se ven en la web).
   - **Dónde:**
     - `src/lib/common/env.ts:13-14` pone `https://ringespana.es` como ejemplo en los mensajes de arranque;
     - `src/app/components/RecordarCampos.tsx:6` usa la clave `ringespana:formulario-enviado` en `sessionStorage`.
   - **Arreglo:**
     - cambiar el ejemplo a `https://lonaclub.es`;
     - renombrar la clave a `lona:` y añadirla a la tabla de `/cookies`, que hoy solo cita el «borrador» sin nombre.
5. **MENOR. `MAIL_TRANSPORT=log` en producción escribiría los enlaces de los correos en los registros** (comprobado).
   - **Dónde:** `src/lib/common/mail.ts:14`.
   - **Arreglo:** en `validateEnv`, error si `NODE_ENV=production`, `MAIL_TRANSPORT=log` y no hay `DEMO_MODE=si`.

**No revisado en esta parte** (queda para las siguientes o para Codex):
- el detalle de cada comprobación de propiedad dentro de los 80 cuerpos de acción, más allá de la guarda inicial. Se han mirado `saveProfile`, las acciones de demo y el creador; el resto se cubre en las partes 3 a 5, recorriendo cada flujo;
- `src/app/actions/media.ts` y la subida directa de vídeos a R2 (URL prefirmadas): solo se vio el límite de tamaño y de cantidad al día.
