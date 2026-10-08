# Cuenta del creador

> Petición del fundador (8 de octubre de 2026): «tener un usuario especial, yo como creador de la aplicación, en caso de que no tenga a mi disposición mi ordenador o mi móvil, poder entrar desde cualquier sitio con esa clave, con ese usuario, para poder modificar cualquier aspecto y gestionar cualquier aspecto dentro de la aplicación».

## Qué es

Una cuenta normal (la tuya, con tu correo electrónico) que la aplicación reconoce como **la del creador**. Puede:

- **Todo lo de moderación** (`/moderacion`): avisos, reclamaciones de fichas, solicitudes de organizador, combates, gimnasios, acreditaciones, noticias, historial de cambios… y editar fichas, perfiles y veladas de cualquiera.
- **Administración** (`/moderacion/usuarios`), que **solo ve el creador**:
  - buscar cualquier cuenta por nombre o correo;
  - cambiar su tipo (aficionado, peleador, entrenador, club o promotora, moderador). Así se **nombran o se quitan moderadores** sin tocar la base de datos;
  - cerrar todas sus sesiones (si crees que alguien ha entrado con esa cuenta);
  - ver tus últimas entradas y crear códigos de emergencia nuevos.

Cada cambio queda en el **historial** (`/moderacion/historial`), con quién lo hizo y cuándo.

## Por qué pide un segundo paso

Es la cuenta que más le interesa robar a alguien: con ella se puede cambiar todo. Por eso, además de la contraseña, al entrar pide **uno** de estos dos:

1. **Un código de 6 cifras** de una aplicación de códigos del móvil: Google Authenticator, Microsoft Authenticator o el gestor de contraseñas que uses. Son gratuitas, y el código cambia cada 30 segundos.
2. **Un código de emergencia**, para cuando **no tienes el móvil a mano**. Son diez códigos del tipo `ABCD-EFGH` que la aplicación te da una sola vez. Apúntalos en papel o en tu gestor de contraseñas. Cada uno sirve una vez.

Así puedes entrar **desde cualquier ordenador o móvil** (de un amigo, de un cibercafé…) con tu correo, tu contraseña y un código de emergencia. Y si alguien te roba la contraseña, sin el código no entra.

## Cómo activarla (una sola vez)

1. **Dile a la aplicación cuál es tu correo.**
   1. En el panel de Render, abre el servicio de la aplicación.
   2. En **Environment**, pulsa **Add Environment Variable**.
   3. Escribe:
      - nombre: `CREADOR_CORREO`;
      - valor: tu correo electrónico.
   4. Guarda. Render vuelve a desplegar la aplicación, y tarda unos minutos.
2. **Crea tu cuenta con ese correo** (o usa la que ya tengas con ese correo) y **confirma el correo**. Sin el correo confirmado no cuenta como creador: así nadie puede adelantarse registrando tu correo.
3. **Entra** con tu correo y tu contraseña. Aparecerá «Protege la cuenta del creador»:
   1. Instala la aplicación de códigos.
   2. Añade la cuenta: pulsa el enlace si estás en el móvil, o escribe la clave que se muestra.
   3. Escribe el código de 6 cifras.
4. **Guarda los diez códigos de emergencia** que aparecen. Puedes imprimirlos. No se vuelven a mostrar.

Desde entonces, en el menú tendrás **«Administración»**.

## Consejos

- Usa una **contraseña larga y que no uses en ningún otro sitio**, por ejemplo tres o cuatro palabras al azar.
- Guarda los códigos de emergencia **separados del móvil**, por ejemplo uno en la cartera y otro en casa.
- Si te quedan pocos o crees que alguien los ha visto, crea otros en **Administración → Tu acceso de creador**. Te pedirá un código de la aplicación, y los anteriores dejan de servir.
- Revisa de vez en cuando **«Tus últimas entradas»**. Si ves una que no reconoces, cambia la contraseña y crea códigos nuevos.
- En un ordenador que no es tuyo, pulsa **Salir** al terminar.

## Si lo pierdes todo (móvil y códigos de emergencia)

Por seguridad, desde la aplicación no hay otra forma de entrar con esta cuenta. La persona con acceso a la base de datos puede volver a preparar el segundo paso con esta orden. Cambia el correo por el tuyo:

```sql
update "User" set "totpSecret" = null, "totpConfirmedAt" = null, "totpLastStep" = null, "recoveryCodes" = '{}'
where email = 'tu-correo@ejemplo.es';
```

Al volver a entrar se repite el paso 3 de la activación. Si has olvidado también la contraseña, primero elige una nueva con «¿Has olvidado tu contraseña?».

## En la demo

En la demo cualquiera puede confirmar un correo con un botón, porque la demo no envía correos. Por eso, en cuanto pongas `CREADOR_CORREO` en la demo, **crea tú la cuenta con ese correo enseguida**. De todos modos, la demo tiene datos ficticios y ya deja a cualquiera hacerse moderador para probarla. En la versión de verdad, confirmar el correo exige abrir el enlace que llega a tu buzón.

## Para quien mantiene el código

- Qué cuenta es: `src/lib/accounts/creador.ts` (`esCreador`). Hacen falta `CREADOR_CORREO` y el correo verificado.
- Sesión: `src/lib/accounts/auth.ts`. Una sesión de la cuenta del creador sin `Session.secondFactorAt` no cuenta como iniciada (`getUser` devuelve `null`), aunque se abriera antes de que la cuenta fuera la del creador. La guarda es `requireCreador` (`permissions.ts`).
- Códigos: `src/lib/accounts/totp.ts`.
  - Códigos de la aplicación según la RFC 6238 (probada con sus vectores oficiales), sin dependencias.
  - Un código no vale dos veces (`User.totpLastStep`).
  - De los códigos de emergencia solo se guarda su SHA-256.
- Acciones: `src/app/actions/creador.ts`. Pantallas: `/entrar/segundo-paso` y `/moderacion/usuarios`. Pruebas: `tests/unit/creador.test.ts` y `tests/e2e/creador.mjs`.
- Pendiente, si el fundador lo pide:
  - borrar o suspender cuentas ajenas desde Administración (hoy se hace con los avisos de moderación y con «borrar mi cuenta» de cada persona);
  - exigir el segundo paso también a los moderadores;
  - cifrar `totpSecret` con una clave del servidor.
