# T-015 — Entrar y registrarse con Google

> **Petición del fundador, 14 de octubre de 2026:** «que se pudiera registrar la gente mediante Google […] La parte de Apple lo dejaremos aplazado para cuando lo lancemos. Pero por lo menos la de Google que ya esté».
>
> Estado: **hecha (Claude, 14 de octubre de 2026)**; falta que el fundador ponga las claves y se compruebe en la demo. Si Claude se queda sin créditos, la continúa Codex con esta ficha. Antes de seguir, comprueba en GitHub qué está ya hecho: rama `claude/entrar-con-google` y su PR.

## Qué tiene que poder hacer una persona

1. En **«Entrar»** y en **«Registrarse»** (tipos usuario, peleador y entrenador) hay un botón **«Continuar con Google»**, con el logotipo de Google.
2. **Si ya tiene cuenta con ese correo**, entra en ella. La cuenta queda vinculada a Google y no se crea otra.
3. **Si no tiene cuenta**, se crea con el correo **ya confirmado** (Google lo garantiza, `email_verified`). Después sigue el mismo paso que el alta normal de su tipo: intereses, ficha o perfil. Si venía de «Entrar», se crea como aficionado.
4. **La cuenta del creador** (`CREADOR_CORREO`) sigue pasando por el segundo paso, entre por donde entre. **No se debilita.**
5. Si cancela en Google o algo falla, vuelve a «Entrar» con un mensaje claro y amable.
6. **Sin las claves configuradas, el botón no aparece.** Nada se rompe.
7. **Entidades** (promotora, federación o club): de momento se registran con correo y contraseña, porque su solicitud necesita datos que Google no da. En su paso de registro se explica.

## Cómo (diseño técnico)

- **Protocolo:** OpenID Connect de Google, flujo de código de autorización con **PKCE** (S256), `state` y `nonce`. Permisos: solo `openid email profile`.
  Con solo esos permisos, Google no limita a 100 usuarios de prueba, no muestra aviso y no caduca a los 7 días. Fuentes: ayuda de Google Cloud, «Manage App Audience» (support.google.com/cloud/answer/15549945) y «Unverified apps» (support.google.com/cloud/answer/10311615).
- **Puntos de entrada:**
  - `GET /api/auth/google?modo=entrar|registro&tipo=…&next=…` guarda `state`, `verifier`, `nonce`, `modo`, `tipo` y `next` en una cookie httpOnly de 10 minutos y redirige a `https://accounts.google.com/o/oauth2/v2/auth`.
  - `GET /api/auth/google/callback` comprueba `state`, canjea el código en `https://oauth2.googleapis.com/token` (con `code_verifier`) y valida el `id_token`.
- **Validación del `id_token`:**
  - Viene directo del endpoint de tokens por TLS, así que no hace falta comprobar la firma (OpenID Connect Core, apartado 3.1.3.7, punto 6).
  - Sí se comprueba:
    - `iss` ∈ {`https://accounts.google.com`, `accounts.google.com`};
    - `aud` = nuestro `client_id`;
    - `exp` en el futuro;
    - `nonce` igual al guardado;
    - `email_verified` = true.
- **Datos:** `User.googleSub String? @unique` (el `sub` de Google), con migración aditiva.
- **Decisión de cuenta** (función pura, con pruebas unitarias):
  1. Si existe un usuario con ese `googleSub`, entra.
  2. Si existe un usuario con ese correo, se vincula y entra. **Contra el «secuestro previo»:** si esa cuenta no tenía el correo confirmado (alguien pudo crearla con un correo ajeno), se invalida su contraseña y se cierran sus otras sesiones antes de vincular.
  3. Si no existe, se crea la cuenta: nombre de Google, correo confirmado, contraseña aleatoria imposible de adivinar (puede poner una con «¿Has olvidado tu contraseña?») y el rol del tipo elegido.
- **Límite:** 30 intentos por hora y por IP (`allow`).
- **Historial:** se registran `CUENTA_GOOGLE_VINCULADA` y `CUENTA_GOOGLE_CREADA` con `audit`. Los fallos se guardan con `registrarFallo`, sin datos personales.
- **Configuración:** `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`, en `render.yaml` con `sync: false` y en `.env.example`. **Nunca en el código.** La dirección de vuelta es `${APP_URL}/api/auth/google/callback`.
- **Código:**
  - la lógica, en `src/lib/accounts/google.ts`;
  - las rutas, en `src/app/api/auth/google/`;
  - el botón, en `src/app/components/BotonGoogle.tsx`;
  - el logotipo, en `public/brand/google-g.svg` (colores de marca de Google, no del tema).
- **Textos:** mensajes en `src/lib/common/messages.ts`. Además, actualizar la privacidad (qué datos recibimos de Google y para qué) y la ayuda.

## Pruebas

- **Unitarias** (`tests/unit/google.test.ts`):
  - la URL de autorización (parámetros, PKCE);
  - la validación del `id_token` (cada motivo de rechazo);
  - la decisión de cuenta (los tres casos y el del secuestro previo).
- **Navegador** (`tests/e2e/google.mjs`, con claves de mentira en el servidor de pruebas):
  - el botón aparece en «Entrar» y en «Registrarse»;
  - lleva a `accounts.google.com` con `client_id`, `redirect_uri`, `code_challenge_method=S256`, `state` y `nonce`;
  - una vuelta con `state` falso o cancelada muestra el mensaje y no crea sesión;
  - axe en los dos temas.
- **No se conecta a Google de verdad en el CI.** La prueba real la hace el fundador en la demo con sus claves.

## Lo que hace el fundador (guía en `docs/GOOGLE.md`)

1. Proyecto «Lona» en console.cloud.google.com.
2. Pantalla de consentimiento: externa, solo nombre y correo.
3. «ID de cliente OAuth», tipo aplicación web, con la dirección de vuelta de la demo.
4. Pegar el ID y la clave en Render → Environment.

## Al terminar

- Versión **menor** (`node scripts/version.mjs subir menor`) con su entrada en `CHANGELOG.md`.
- Entradas en `DIARIO`, `IDEAS`, `ARQUITECTURA` y el catálogo; ejecutar `npm run mapa`.
- PR en borrador y CI en verde.
