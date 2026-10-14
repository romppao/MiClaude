# Entrar con Google: qué tiene que hacer el fundador

> Ficha técnica: [`tareas/T-015-entrar-con-google.md`](tareas/T-015-entrar-con-google.md). El código ya está hecho. Sin estas claves el botón «Continuar con Google» **no aparece** y nada se rompe.
>
> Tiempo: unos 15 minutos. Hace falta una cuenta de Google; mejor una de Lona que la personal, porque su correo puede aparecer en la pantalla de permiso.

## 1. Crear el proyecto

1. Entra en **https://console.cloud.google.com** con esa cuenta.
2. Arriba, en el selector de proyectos, pulsa **«Nuevo proyecto»**.
3. Nombre: **Lona**. Pulsa **Crear** y comprueba que queda seleccionado.

## 2. Pantalla de permiso (lo que verá la persona en Google)

1. Menú → **«APIs y servicios» → «Pantalla de consentimiento de OAuth»** (puede llamarse «Google Auth Platform» → «Marca»).
2. Tipo de usuario: **Externo**.
3. Rellena:
   - Nombre de la aplicación: **Lona**.
   - Correo de asistencia: tu correo.
   - Logotipo: opcional. Si lo subes, Google puede pedir una revisión antes de mostrarlo; se puede dejar sin logotipo.
   - Dominios y enlaces: la página de inicio y la de privacidad de la demo (`https://ring-espana-demo.onrender.com/` y `https://ring-espana-demo.onrender.com/privacidad`).
   - Correo de contacto del desarrollador: tu correo.
4. Permisos (*scopes*): **solo** `openid`, `.../auth/userinfo.email` y `.../auth/userinfo.profile`. **No añadas ninguno más.**
5. Público o estado de publicación: pulsa **«Publicar aplicación»** (pasa de «Prueba» a «En producción»).

   Con solo nombre y correo, Google no limita a 100 usuarios de prueba, no muestra avisos y los permisos no caducan a los 7 días. Fuentes: ayuda de Google Cloud, [Manage App Audience](https://support.google.com/cloud/answer/15549945?hl=es) y [Unverified apps](https://support.google.com/cloud/answer/10311615).

## 3. Crear las credenciales

1. Menú → **«APIs y servicios» → «Credenciales» → «Crear credenciales» → «ID de cliente de OAuth»**.
2. Tipo de aplicación: **Aplicación web**. Nombre: `Lona demo`.
3. **URI de redireccionamiento autorizados** → añade exactamente:
   `https://ring-espana-demo.onrender.com/api/auth/google/callback`
   Cuando haya dominio propio o versión real, se añade otra con esa dirección. Si no coincide letra por letra, Google dará el error `redirect_uri_mismatch`.
4. Pulsa **Crear**. Google te enseña el **ID de cliente** (termina en `.apps.googleusercontent.com`) y el **secreto del cliente**.

> ⚠️ El secreto es como una contraseña: **no lo pegues en el chat ni en ningún documento**. Solo en Render.

## 4. Ponerlas en Render

1. Render → servicio de la demo → **Environment**.
2. Añade dos variables:
   - `GOOGLE_CLIENT_ID` = el ID de cliente;
   - `GOOGLE_CLIENT_SECRET` = el secreto.
3. Guarda. Render reinicia la aplicación sola en un par de minutos.

## 5. Probarlo

1. Abre la demo → **«Entrar»**. Debe aparecer **«Continuar con Google»**.
2. Púlsalo, elige tu cuenta de Google y acepta.
   - Si ya tenías cuenta en Lona con ese correo, entras en ella.
   - Si no, se crea una cuenta nueva con el correo ya confirmado.
3. Con tu cuenta de creador, Lona te pedirá igualmente el **segundo paso**. Es lo esperado.
4. Si algo falla, dile a Claude el mensaje que sale. El fallo queda también en «Moderación → Fallos de la aplicación».

## Coste

Entrar con Google no exige activar la facturación ni poner una tarjeta para estos permisos básicos. Si en algún paso Google pidiera una tarjeta, **para y avisa**: no hay que contratar nada.
