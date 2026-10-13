# ADR-004 — El código de Lona pasa a un repositorio privado

**Estado:** **APROBADA por el fundador el 13 de octubre de 2026** («haz lo recomendado»).
**Fecha:** 13 de octubre de 2026 · **Autor de la propuesta:** Claude (líder técnico).

## 1. Por qué (el problema)

El fundador vio que el repositorio `romppao/MiClaude` era **público**: cualquiera que conociera su usuario de GitHub, o que buscara el proyecto, podía leer y descargar todo el código. En sus palabras: «no puedo permitir que alguien me robe, me suplante todo el trabajo que llevo dedicándole a este proyecto durante semanas […] hay mucha competencia en ese sector […] antes de lanzar la aplicación al mercado tenemos que solventar este problema». Pidió una solución **gratuita**.

Datos comprobados el 13 de octubre de 2026, antes de cambiar nada:
- El repositorio era público desde su creación, el 24 de septiembre de 2026.
- Tenía 0 bifurcaciones (forks) y 0 estrellas. No hay forma de saber si alguien lo descargó, así que se da por posible.
- **Sin claves reales en el historial.** Se revisaron los 266 commits buscando claves de Resend, OpenAI, GitHub, AWS y cadenas de conexión de bases en la nube. Solo aparecieron:
  - las claves de ejemplo oficiales de AWS en una prueba;
  - una clave por defecto antigua de la tarea de noticias (`ring-cron-actualizar-2026`), quitada el 10 de octubre de 2026. Ver la lección de ese día en `LECCIONES.md`.

## 2. Qué se decidió

**Propuesta A, la recomendada.** El repositorio sigue en GitHub y pasa a **privado**. Es gratis: la cuenta gratuita de GitHub admite repositorios privados sin límite.

Se descartó la **propuesta B**, llevar el código a GitLab o Bitbucket. También son privados y gratis, pero suponía cambiar de proveedor y volver a conectar Render y a todos los asistentes, sin ninguna ventaja (regla de ADR-003: no cambiar de proveedor sin motivo).

## 3. Cómo se hizo (y por qué en este orden)

| Paso | Qué | Por qué |
|---|---|---|
| 1 | **Menos minutos de pruebas automáticas** (`.github/workflows/ci.yml`). Las pruebas se ejecutan en cada PR, al fusionar en `claude/ring-espana-mvp` y a mano; ya no al subir a cualquier rama. | Un repositorio privado gratuito tiene **2.000 minutos de GitHub Actions al mes** ([planes de GitHub](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)); en público son ilimitados. La semana del 6 al 13 de octubre hubo 254 ejecuciones de unos 8 minutos de media, con máximos de 15. Cada cambio se probaba dos veces: al subirlo a su rama y en su PR. A ese ritmo, el cupo se habría acabado en una semana y las pruebas se habrían parado. |
| 2 | **Se desactiva la visita automática que mantenía despierta la demo** (`mantener-demo-despierta.yml`). Se sustituye por **UptimeRobot**, gratuito y aprobado en ADR-003. | Cada visita, cada 10 minutos, cuenta como al menos 1 minuto de GitHub: unos 4.300 minutos al mes, más del doble del cupo. UptimeRobot hace lo mismo desde fuera sin gastar minutos y además avisa por correo si la demo se cae. |
| 3 | **Aviso legal** `LICENSE`: «Todos los derechos reservados». En `package.json`, `"license": "UNLICENSED"`. | Sin licencia, el código ya era legalmente del titular. El aviso lo deja escrito y sin dudas para quien lo vea (colaboradores, futuros programadores) y deja a salvo las licencias de terceros, como las tipografías OFL. |
| 4 | **El repositorio pasa a privado.** | Es lo que protege el código a partir de ahora. Se hace después de los pasos 1 y 2 para que no haya un hueco en el que se agoten los minutos. |
| 5 | **Cambio de la clave de la tarea de noticias** (`CRON_SECRET`), por el fundador (pasos en la sección 6). | Una clave antigua estuvo escrita en el código público. Hoy la aplicación ya no la acepta por defecto, pero si en Render se configuró con ese mismo valor, cualquiera que la viera podría lanzar la actualización de noticias. Cambiarla cuesta 2 minutos y deja a cero el riesgo. |

## 4. Para qué (qué se consigue y qué no)

**Se consigue:**
- Nadie fuera del proyecto puede ver, buscar ni descargar el código desde ahora.
- Siguen funcionando, sin hacer nada:
  - **la demo en Render**: se conecta con su aplicación de GitHub, comprobado en los despliegues que firma «render», y esa conexión vale para repositorios privados;
  - **los asistentes** (Claude, Codex, Copilot, Open Code, Antigravity), que entran con la cuenta del fundador o con sus integraciones autorizadas;
  - **las pruebas automáticas**, ahora dentro del cupo gratuito: se calculan entre 1.000 y 1.500 minutos al mes.

**No se consigue (dicho con honestidad):**
- **Lo que alguien haya descargado** entre el 24 de septiembre y el 13 de octubre no se puede recuperar. Esa copia sigue siendo ilegal de usar sin permiso, porque nunca hubo licencia.
- **La parte que se ejecuta en el navegador** (el JavaScript de las pantallas) se puede ver en cualquier web del mundo, también en las de la competencia. Las reglas importantes (aura, permisos, moderación, datos) están en el servidor y en la base de datos, que no se ven.
- **La idea no se protege ocultando el código.** Lo que protege el negocio es:
  - el nombre registrado: la marca «Lona» en la OEPM tiene coste y está pendiente de que decida el fundador;
  - llegar antes;
  - la comunidad de peleadores, gimnasios y organizadores, que no se puede copiar.

## 5. Reglas desde ahora (para asistentes y programadores)

1. **Las pruebas se lanzan con un PR.** Subir a una rama sin PR no las ejecuta. Si quieres probar antes de abrir el PR, usa «Run workflow» en la pestaña Actions, con moderación, o pásalas en local (`README.md`).
2. **No añadas tareas programadas** (`schedule:`) en `.github/workflows/` sin calcular sus minutos al mes. Cada ejecución gasta al menos 1 minuto: un `*/10` son unos 4.300 al mes.
3. **Vigila el consumo:** GitHub → Settings → Billing and plans → Usage. Si se acerca a 2.000, avisa a Claude y al fundador antes de que se pare.
4. **Ningún secreto en el código**, aunque el repositorio sea privado: los privados también se filtran (un ordenador robado, un asistente con acceso, un cambio de visibilidad por error). Los secretos van en Render (Environment) y en GitHub (Settings → Secrets).
5. **No vuelvas a hacer público el repositorio** sin una decisión escrita del fundador.

## 6. Lo que hace el fundador (pasos)

**A. Comprobar que GitHub no puede cobrar (1 minuto).** En GitHub → tu foto → **Settings** → **Billing and licensing** → **Budgets and alerts**: el presupuesto de Actions debe estar en **0 €**, que es lo normal en una cuenta sin forma de pago. Así, si un mes se acaban los minutos, las pruebas se paran pero no se cobra nada.

**B. UptimeRobot, para que la demo no se duerma (5 minutos).** Los pasos están en [`DEMO.md`](../DEMO.md), en «Mantener la demo despierta».

**C. Clave nueva para la tarea de noticias (3 minutos):**
1. Inventa una clave larga: por ejemplo, 30 letras y números al azar, sin palabras reales. **No la escribas en el chat.**
2. En <https://dashboard.render.com> → servicio `ring-espana-demo` → **Environment** → `CRON_SECRET` → **Edit**, pega la clave nueva y pulsa **Save, rebuild, and deploy**.
3. En GitHub → repositorio `MiClaude` → **Settings** → **Secrets and variables** → **Actions** → `CRON_SECRET` → **Update**, pega la misma clave y guarda.
4. Para comprobarlo: pestaña **Actions** → «Actualización 24/7 de Noticias y Portadas» → **Run workflow**. Debe salir en verde.

## 7. Cómo deshacerlo (si algún día hiciera falta)

GitHub → repositorio → **Settings** → abajo del todo, **Change visibility** → **Make public**. Es reversible, pero solo con una decisión escrita del fundador (regla 5).
