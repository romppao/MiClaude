# T-011 — Registro por tres paneles (usuario · peleador · promotora o federación)
**Nivel:** N3 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F1 · **Estado:** hecha por Claude el 6 de octubre de 2026 (petición expresa del fundador: «corrige todo lo que dijiste…») · **Sugerida a:** Codex · **Depende de:** —

## Objetivo
Sustituir el desplegable «¿Qué quieres hacer en Ring España?» del registro por **tres paneles claros** y profesionales, uno por tipo de persona, y llevar a cada una al sitio adecuado al terminar.

## Petición del fundador (palabras literales, 6 de octubre)
«Me he dado cuenta que a la hora de iniciar sesión y registrarse has puesto: "¿Cómo te quieres registrar? Aficionado, no sé qué… peleador para ficha… organizador de veladas". No, no, no. **Tiene que ser profesional. Tiene que haber varios paneles. Panel A, para el usuario normal. No tiene que poner nada, simplemente es usuario, crear usuario. Después el panel B, peleadores. Panel C, promotoras, federaciones. Ya está, simplemente eso.** No tienes por qué complicarte ni poner palabras fuera de lugar. Tiene que estar ordenado, bien.»
Los perfiles ricos (foto, banner, información) y el diseño visual **no** son de esta tarea: «eso ya iremos más adelante cuando empecemos con la fase del diseño».

## Contexto
`src/app/registro/page.tsx` (formulario con `select[name=role]` FAN/FIGHTER), `src/app/actions/accounts.ts` (`register` crea la cuenta con ese rol), `src/app/entrar/page.tsx`, solicitud de organizador en `src/app/organizador/page.tsx` y `src/app/actions/events.ts` (`requestOrganizer` → `OrganizerRequest` con `orgName` y `message`), aprobación en `decideOrganizer` (`src/app/actions/moderation.ts`), federaciones creadas hoy solo por moderación (`createFederation`, `src/app/actions/profiles.ts`), `src/lib/common/messages.ts` (todo código de aviso necesita texto).

## Especificación
**Registro (`/registro`)**: primero se elige el panel; sin desplegables ni frases largas.
- **Panel A — «Usuario»** (botón principal): crea la cuenta con nombre, correo y contraseña. Nada más. Rol `FAN`. Al confirmar el correo: portada (o la página de la que venía).
- **Panel B — «Peleador»**: nombre, correo y contraseña **y** los datos de su ficha mínimos que ya pide `createMyFighter` (nombre y apellidos; disciplina, nivel y provincia se piden **al crear la ficha**, no aquí, para no alargar el alta). Rol `FIGHTER`. Al confirmar el correo: «Mi ficha» (donde sigue creándola).
- **Panel C — «Promotora o federación»**: nombre de la persona, correo, contraseña **y** nombre de la entidad, tipo (**Promotora** | **Federación**), web o redes (opcional) y un mensaje breve. Crea la cuenta (rol `FAN`) y una **solicitud** pendiente. Mensaje claro: «Un moderador revisará tu solicitud y te responderá por correo electrónico».
**Acceso (`/entrar`)**: un único formulario (correo y contraseña): las credenciales identifican a la persona, no hace falta elegir panel (decisión de Claude para no crear una elección sin efecto; el fundador puede revocarla). Tras entrar, cada papel va a su sitio: usuario → portada; peleador → «Mi ficha»; organizadora/federación aprobada → «Mis veladas»; moderación → «Moderación» (si había `next`, gana `next`).
**Moderación**: en la cola de solicitudes de organizador se ve el **tipo** (promotora/federación) y el enlace aportado. Al **aprobar una federación**: rol `ORGANIZER`, se crea su perfil de federación (`Profile kind="federacion"`) con ella como titular (`ownerId`) y se le avisa por correo; al aprobar una **promotora**: lo que ya hace hoy.

## Pasos
1. Rama `codex/T-011-paneles`.
2. Migración **aditiva**: `OrganizerRequest.kind String @default("PROMOTORA")` (valores `PROMOTORA|FEDERACION`; valida en el servidor con una lista, no con `in`).
3. `/registro`: tres paneles como tres enlaces/botones de ancho completo (44 px+) hacia `/registro?tipo=usuario|peleador|entidad`; sin `tipo`, solo se ven los tres paneles y un enlace «¿Ya tienes cuenta? Entra»; con `tipo`, el formulario correspondiente con un enlace «Elegir otro tipo de cuenta». Todo se mantiene en español llano y profesional, **sin** las frases antiguas («Aficionado», «Dar aura a peleadores y consultar veladas»…). Conserva `next` y la cookie de retorno.
4. Acciones: ajusta `register` (o crea `registerFighter`/`registerEntity` en el mismo módulo, **clasificadas** en `tests/unit/autorizacion.test.ts`) para crear la cuenta y, en el panel C, la `OrganizerRequest` en la **misma transacción**. Límites de intentos y errores como `register` hoy.
5. Aterrizaje por papel tras confirmar el correo y tras entrar (función única en `src/lib/accounts/` con prueba unitaria).
6. Moderación: mostrar el tipo y el enlace; aprobar federación crea el perfil y asigna titular (`src/app/actions/moderation.ts` + `src/lib/profiles`); mensajes nuevos en `messages.ts`.
7. Pruebas: unitarias (clasificación, aterrizaje, tipo inválido rechazado); navegador: los tres registros de punta a punta, el aterrizaje, la aprobación de federación (el perfil aparece en `/federaciones` y la titular lo ve en «Mi cuenta»), y que no queda ningún texto antiguo. Actualiza **todos** los guiones que registran cuentas (`ayudas.mjs` `newUser`, `escenarios.mjs`…) usando el panel correspondiente. `enlaces.mjs`, `movil.mjs`, axe en verde.
8. Documentación: `MAPA-FUNCIONAL.md` (`npm run mapa`), `ayuda`, `README`.

## Criterios de aceptación
- Tres paneles, sin textos antiguos, sin desplegable de rol; los tres registros funcionan de punta a punta en móvil.
- Una federación aprobada tiene su perfil y su titular sin pasos manuales de moderación.
- Ninguna acción sin clasificar; CI completo en verde con base vacía.

## No hacer
No tocar colores, tipografías ni composición (diseño provisional). No cambiar permisos ni aura. No añadir roles nuevos. No inventar tipos de entidad fuera de «Promotora» y «Federación» (gimnasios y entrenadores siguen asignándose por moderación).

## Documentar
`DIARIO.md`, `IDEAS.md` (tarea 13 del selector A/B/C → hecha), `ARQUITECTURA.md` (roles y flujos), tu registro.
