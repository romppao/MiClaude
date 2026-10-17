# Plan de lanzamiento de Lona

> **Decisión del fundador, 13 de octubre de 2026:** «retrasaremos el lanzamiento para el día 15 de noviembre. En lo que llega esa fecha, por lo menos dejar la aplicación lista ya el día 1 de noviembre, totalmente funcional, a la espera de revisiones jurídicas y legales. Pero dejar la aplicación lista y pasarnos con la promoción de la aplicación mediante los vídeos, mediante los posts y mediante varias estrategias que ya miraremos más adelante».
>
> Antes había propuesto el 1 de noviembre. Claude recomendó abrir primero a un grupo cercano y hacer la promoción pública unas dos semanas después, para comprobar con gente real el correo, la moderación y el servidor sin que lo viera todo el mundo. El fundador lo aceptó y fijó el **15 de noviembre**.
>
> Este documento es la hoja de ruta hasta el lanzamiento. Se actualiza cada vez que cambia algo: cada asistente marca aquí lo que termina, con la fecha.

## 1. Calendario

| Fecha | Hito | Qué significa |
|---|---|---|
| **13–19 oct** | Cuentas y base técnica | El fundador crea las cuentas gratuitas y decide los gastos. Claude monta la versión real (producción) separada de la demo, con copias de seguridad, las fotos fuera de la base de datos y el correo real. |
| **20–26 oct** | Mejoras visuales pedidas y primera ronda de pruebas | Mapa de gimnasios (✅ hecho el 13 de octubre) y mejoras de veladas (a la espera de lo que diga el fundador). Pruebas definitivas por tipo de cuenta (sección 4). |
| **27–31 oct** | Correcciones y segunda ronda | Todo lo encontrado en las pruebas se corrige y se vuelve a probar. |
| **1 nov** | **Aplicación lista** | Totalmente funcional en la versión real, solo pendiente de la revisión jurídica. |
| **1–15 nov** | Grupo cercano y promoción | Gimnasios, peleadores y organizadores conocidos del fundador la usan de verdad. Se preparan los vídeos, las publicaciones y la estrategia de promoción. |
| **15 nov** | **Lanzamiento público** | Promoción abierta. |
| Después | Tiendas (App Store y Google Play) | Entre 6 y 10 semanas desde que se empiece, incluida la prueba cerrada obligatoria de Google ([`PUBLICACION.md`](PUBLICACION.md)). |

## 2. Imprescindible antes de que entren usuarios reales

> **17-10-2026:** el fundador quiere abrir primero un **acceso anticipado** a personas concretas. Pasos en orden y qué hace cada uno: [`ACCESO-ANTICIPADO.md`](ACCESO-ANTICIPADO.md).

Estado a 13 de octubre de 2026. ❌ = no empezado · 🟡 = en marcha · ✅ = hecho.

| # | Qué | Por qué | Quién | Estado |
|---|---|---|---|---|
| 1 | **Versión real separada de la demo** (producción) | La demo deja confirmar el correo con un botón y hacerse moderador: nunca puede tener usuarios reales. | Claude: plano de Render, comprobaciones (unos 2 días). Fundador: cuenta y plan que no se duerma (Render Starter, unos 7 $ al mes: **pendiente de aprobar el gasto**). | 🟡 Código listo (0.13.0, Cloud Run + Neon, [PRODUCCION.md](PRODUCCION.md)); faltan las cuentas y el primer despliegue |
| 2 | **Base de datos gestionada con copias diarias y restauración probada** ([T-012](tareas/T-012-base-de-datos-gestionada.md)) | Que no se pierdan los datos de nadie. Además, la base gratuita de la demo caduca hacia el 1–2 de noviembre. | Fundador: cuentas de Neon y Cloudflare R2. Claude: montarlo y probar a restaurar una copia. | 🟡 Copia diaria preparada (`copia-diaria.yml`); faltan Neon, R2 y la prueba de restauración |
| 3 | **Correo real** ([T-008](tareas/T-008-cola-de-correos.md)) | Sin correo nadie confirma su cuenta, y sin cuenta confirmada no se puede votar ni publicar. | Fundador: dominio `.es` (unos 7 € al año: **pendiente de aprobar**) y cuenta de Resend. Claude: cola y límites. El plan gratuito de Resend envía 100 correos al día y se quedaría corto el día del lanzamiento ([`PUBLICACION.md`](PUBLICACION.md)). | 🟡 Cola de correos con reintentos y límite diario hecha (0.18.1, T-008). Falta la cuenta de Resend y verificar lonaclub.es en ella |
| 4 | **Fotos fuera de la base de datos** ([T-004](tareas/T-004-imagenes-fuera-de-la-base.md), parte 2) | La base gratuita es de 0,5 GB y las fotos la llenarían. | Claude (unos 2–3 días), con el cubo de R2 del fundador. | 🟡 Código hecho (0.16.1, 15-10-2026): las fotos van a R2 en cuanto estén las variables `R2_*`. Falta la cuenta de R2 del fundador y trasladar las fotos que haya ([PRODUCCION.md](PRODUCCION.md), paso 9) |
| 5 | **Condiciones de uso y aviso legal** (no existen) y completar la **privacidad** (responsable y contacto) | Obligatorio por ley. | Claude: borradores **hechos** el 15-10-2026 en la 0.14.0 (`docs/LEGAL.md`). Falta: los datos del titular (variables `TITULAR_*`) y la **revisión de un abogado** (fundador; preguntas en `MiProyectoAI/LEGAL-LONA/02-PARA-EL-ABOGADO.md`). | 🟡 |
| 6 | **Menores** ([T-014](tareas/T-014-politica-de-menores.md)) | Es el riesgo más serio: hay muchos peleadores menores de edad. | **Decisión del fundador:** hacer la política de menores (3–5 días) o abrir solo a mayores de 18 y sin promoción dirigida a menores. | ❌ pendiente de decisión |
| 7 | **Avisos de caídas y fallos** ([T-010](tareas/T-010-observabilidad.md)) | Enterarnos antes que los usuarios. | Fundador: UptimeRobot y Sentry (gratuitos). Claude: medio día. El registro propio de fallos ya existe (`/moderacion/fallos`). | 🟡 Código hecho (T-010, 15-10-2026): con `SENTRY_DSN`, cada fallo nuevo llega a Sentry sin datos personales y `/salud` da la latencia de la base. Falta que el fundador cree Sentry (región UE) y UptimeRobot sobre `/salud` |
| 8 | **Cuenta del creador en producción** (`CREADOR_CORREO` y segundo paso) y **clave nueva de noticias** (`CRON_SECRET`) | Seguridad. | Fundador (1 hora), con la guía de Claude. | ❌ |
| 9 | **Repositorio privado** ([ADR-004](decisiones/ADR-004-repositorio-privado.md)) | Proteger el código. | Fundador: pulsar «Make private». | 🟡 cambios hechos; falta el interruptor |

## 3. Importante, pero puede seguir justo después

- ✅ **Bloquear a otro usuario** (0.16.0, 15-10-2026). Lo exige Apple. También están hechos el aviso sin cuenta (`/avisar`) y los correos con la decisión de moderación (DSA): [`LEGAL.md`](LEGAL.md).
- **Filtro de palabras** en comentarios y pies de foto.
- **Una persona revisando la cola de moderación cada día.**
- **Veladas falsas:** hoy cualquiera con el correo confirmado puede publicarlas sin revisión previa (decisión 6 pendiente en [`TRASLADO.md`](TRASLADO.md)).
- **Detectar abusos del aura** y un **procedimiento contra suplantaciones**.
- **Pruebas en un iPhone real y con lector de pantalla real.**
- **Decisiones abiertas del fundador** ([`TRASLADO.md`](TRASLADO.md), sección 7).
- **Registro de la marca «Lona»** en la OEPM (tiene coste: decide el fundador).

## 4. Pruebas definitivas (fundador y Claude)

Entramos los dos con **cada tipo de cuenta** y recorremos **todas las pantallas** con una lista de comprobación: qué se ve, qué se puede hacer, qué mensaje sale y si algo confunde. Cada fallo se anota con la pantalla, qué se hizo, qué pasó y qué debería haber pasado. Cuando la aplicación esté en marcha, también queda en el registro de fallos.

Tipos de cuenta que se prueban:
1. Visitante sin cuenta.
2. Aficionado.
3. Peleador amateur.
4. Peleador profesional.
5. Entrenador.
6. Promotora, federación o club.
7. Moderador.
8. Creador.

En cada una:
- en el móvil y en el ordenador;
- en tema claro y en oscuro;
- con conexión lenta.

Claude prepara la lista pantalla por pantalla (`docs/pruebas/`) antes del 20 de octubre, a partir del mapa funcional ([`MAPA-FUNCIONAL.md`](MAPA-FUNCIONAL.md)) y del guion de personas ([`pruebas/personas.md`](pruebas/personas.md)).

## 5. Promoción

La estrategia se define más adelante con el fundador: vídeos, publicaciones y otras ideas. Cuando se decida, se apunta aquí con su calendario.
