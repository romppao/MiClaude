# Relevo al portátil: qué hace Claude Code cuando el fundador llegue a casa

**Para quién es:** (1) el fundador, que sigue estos pasos con su portátil; (2) la sesión de Claude Code del portátil (con acceso a internet y a la terminal), que **retoma el proyecto desde aquí** sin tener que adivinar nada. Escrito el 6 de octubre de 2026 desde la sesión del móvil.

> Palabras del fundador: «Cuando llegue a casa, Claude Code en el portátil sea el que tome el control del proyecto, porque tiene acceso a internet y muchísimas más funcionalidades.»

## 0. Frase para empezar (el fundador la pega en Claude Code, dentro de la carpeta del proyecto)

> Lee `CLAUDE.md`, `docs/TRASLADO.md` y `docs/RELEVO-PORTATIL.md` y sigue ese plan. Eres el líder técnico. Empieza por la sección 1 (comprobaciones) y guíame paso a paso con las cuentas: yo hago los registros y tú me dices exactamente qué pulsar y qué copiar. No contrates nada de pago ni pegues contraseñas en el repositorio.

Si el proyecto aún no está en el portátil: `git clone https://github.com/romppao/MiClaude.git` y `git checkout claude/ring-espana-mvp`; después `npm install` y `npx prisma generate`.

## 1. Comprobaciones (30 minutos, antes de crear nada)

**Para Claude (portátil, con internet): abre las páginas oficiales y verifica.** Desde el móvil no se pudo (los dominios estaban bloqueados), así que **todas las cifras del [ADR-003](decisiones/ADR-003-proveedores-fase-0.md) vienen de resúmenes de búsqueda**. Revisa la lista «Lo que no está verificado» de ese documento y la sección «Segunda verificación», y **corrige el ADR con lo que leas** (con la fecha). Lo más importante:

| Qué mirar | Dónde | Por qué importa |
|---|---|---|
| Que el plan gratis de **Neon** permita uso comercial; 0,5 GB; precio de Launch | neon.com/pricing y sus términos | Es donde irán los datos |
| **R2**: 10 GB gratis, ¿pide tarjeta para activarlo?, jurisdicción UE | developers.cloudflare.com/r2 | Imágenes y copias; la jurisdicción no se cambia después |
| **Resend**: límites del plan gratis, si exige dominio, ubicación de los datos | resend.com/pricing | Correos de confirmación |
| **Brevo** (recambio): límite diario y condiciones | brevo.com/pricing | Si Resend se queda corto |
| **Sentry**: plan gratuito, región UE, soporte de Next.js 15 | sentry.io/pricing | Errores |
| **OVH**: precio y requisitos del `.es` | ovhcloud.com/es-es/domains | Dominio |

**Para el fundador: mira la fecha de caducidad de la base de datos de la demo.** En <https://dashboard.render.com> → la base `ring-demo-db` → busca la fecha de creación o de caducidad («Expires»). Según el `render.yaml` se creó **hacia el 2 de octubre de 2026**, así que **caduca hacia el 1–2 de noviembre** (y se borraría a los 14 días, hacia el 15–16). Apunta la fecha real en [`DEMO.md`](DEMO.md).

## 2. Cuentas que crea el fundador (Claude le guía; ninguna cuesta dinero al empezar)

Reglas de seguridad para **todas**:
- Regístrate con tu correo y activa la **verificación en dos pasos** cuando la ofrezcan.
- **Nunca pegues claves, contraseñas ni cadenas de conexión en el chat ni en ningún fichero del repositorio.** Las claves van a: (a) los *secretos* de GitHub (Settings → Secrets and variables → Actions) para las copias, y (b) las variables de entorno de Render (panel del servicio → Environment). Claude te dice cuál va a cuál.
- Si alguna cuenta pide **tarjeta de pago** aunque el plan sea gratuito, **para y avisa a Claude** antes de ponerla: el fundador decide. No se activa ningún plan de pago.

| Orden | Cuenta | Para qué | Datos que hay que guardar | Cuándo |
|---|---|---|---|---|
| 1 | **Neon** (neon.com, entrar con GitHub) | Base de datos | Proyecto en la región **Fráncfort (eu-central-1)**; dos cadenas de conexión: la «pooled» (`DATABASE_URL`) y la directa (`DIRECT_URL`) | **Ya** (urgente por la caducidad de Render) |
| 2 | **Cloudflare** (cloudflare.com) → R2 | Copias nocturnas e imágenes | Cubo con jurisdicción **Unión Europea** (elegirla al crearlo: no se puede cambiar después); clave de acceso **limitada a ese cubo** (ID y secreto) | Tras Neon |
| 3 | **Sentry** (sentry.io) | Aviso de errores | Al registrarte elige la región **UE (Fráncfort)**; el «DSN» del proyecto | Tras R2 |
| 4 | **UptimeRobot** (uptimerobot.com) | Avisa si la web se cae | Un monitor sobre `https://…/salud` cada 5 minutos, aviso por correo | Tras Sentry |
| 5 | **Dominio `.es`** (OVH u otro registrador) | Correo real y dirección propia | Titular a nombre del fundador (persona física) | Cuando el fundador quiera correos reales |
| 6 | **Resend** (resend.com) | Envío de correos | Verificar el dominio (Claude da los registros DNS), clave de API (`RESEND_API_KEY`) y remitente (`MAIL_FROM`) | Tras el dominio |

## 3. Qué hace Claude después (en este orden; cada paso con su ficha)

1. **[T-012](tareas/T-012-base-de-datos-gestionada.md) — migrar la demo a Neon** (urgente): crear las dos cadenas, aplicar las migraciones (`prisma migrate deploy`) y la carga de datos de ejemplo en la base nueva, cambiar `DATABASE_URL` en Render, comprobar `/salud` y las pruebas de navegador contra la demo, y **copia nocturna a R2 con una restauración probada** (una copia sin restauración probada no es una copia).
2. **[T-004](tareas/T-004-imagenes-fuera-de-la-base.md), parte 2 — imágenes fuera de la base** (obligatorio antes de abrir: Neon gratis solo tiene 0,5 GB).
3. **[T-010](tareas/T-010-observabilidad.md) — Sentry con filtro de datos personales y UptimeRobot.**
4. **[T-008](tareas/T-008-cola-de-correos.md) — cola de correos y envío real con Resend** (cuando haya dominio).
5. Lanzar a los asistentes: **prueba de ingreso 1** ([`PRUEBA-DE-INGRESO.md`](PRUEBA-DE-INGRESO.md)) y **prueba de ingreso 2, «la escalera»** ([`PRUEBA-ESCALERA.md`](PRUEBA-ESCALERA.md)). Cuando entreguen, corregir y rellenar [`ingreso/RESULTADOS.md`](ingreso/RESULTADOS.md); con eso se ordena el equipo ([`RANGOS.md`](RANGOS.md)).
6. Siguiente fase: T-005, T-006, T-007 (rendimiento) y, al final de la fase básica, **diseño visual** (con briefing, no antes) y **T-014, política de menores** (último punto, después del diseño: decisión del fundador).

## 4. Lo que NO se hace sin el fundador
- Contratar cualquier plan de pago, o dar una tarjeta.
- Abrir el registro al público, o invitar a menores reales (la política de menores se hace al final; mientras tanto, solo datos ficticios).
- Cambiar el diseño visual.
- Ejecutar `prisma migrate reset` / `db push --force-reset` (Prisma lo prohíbe a una IA: se lo pide al fundador).
- Dar por buena una cifra de precios que no se haya leído en la página oficial.

## 5. Estado en el momento del relevo
- Rama de trabajo: `claude/ring-espana-mvp`. CI en verde en la última integración. Demo: <https://ring-espana-demo.onrender.com/> (datos ficticios; correo en modo registro).
- Aprobado por el fundador: **ADR-003** (herramientas) y **no pedir fecha de nacimiento al crear la cuenta**; menores al final ([`ADR-003`](decisiones/ADR-003-proveedores-fase-0.md), sección de decisiones del fundador).
- Pendiente del fundador: fecha real de caducidad en Render; crear las cuentas; comprar el dominio cuando quiera correos reales; lanzar las dos pruebas de ingreso a los demás asistentes.
- Contexto y reglas: [`TRASLADO.md`](TRASLADO.md) (estado y decisiones abiertas), [`PLAN.md`](PLAN.md) (fases y fichas), [`DIARIO.md`](DIARIO.md) (historia).
