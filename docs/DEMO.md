# Demo para probar la aplicación

Una copia con **datos ficticios** (peleadores, gimnasios y veladas inventados) para recorrer la aplicación en el navegador como lo haría cualquier persona. Hay dos formas de tenerla; **para probar desde el móvil, la A**.

**Demo activa:** <https://ring-espana-demo.onrender.com/>. El 3 de octubre de 2026 se integró la propuesta #11 en `claude/ring-espana-mvp`: incluye categorías por edad, correcciones de calendario/récords y comunicación inclusiva. Comprobados públicamente portada, ránking, ayuda y salud, todos con respuesta 200 y los contenidos nuevos.

## A. Alojada en internet (funciona desde el móvil)

La demo se publica en [Render](https://render.com) a partir del fichero `render.yaml` del repositorio: una web y una base de datos propias, sin tocar nada de producción. Se hace una sola vez, desde el navegador del móvil:

1. Entra en <https://render.com> y regístrate con tu cuenta de GitHub (autoriza el acceso al repositorio `romppao/MiClaude`).
2. Pulsa **New** → **Blueprint**, elige el repositorio `MiClaude` y la rama `claude/ring-espana-mvp`, y pulsa **Apply**.
3. Espera unos 5–10 minutos a que termine la primera construcción. Cuando el servicio `ring-espana-demo` aparezca como «Live», pulsa su dirección (algo como `https://ring-espana-demo.onrender.com`).

Cosas que conviene saber:

- Es un plan **gratuito**: tras un rato sin visitas la web se «duerme» y la primera carga tarda cerca de un minuto. Los planes gratuitos tienen límites de duración y de uso: compruébalos en Render antes de fiarte de la demo a largo plazo.
- Cada vez que se sube código a la rama, Render vuelve a construir la demo. Los datos que se hayan probado se conservan (los datos de ejemplo solo se cargan cuando la base está vacía).
- **No es producción**: la variable `DEMO_MODE=si` activa botones solo de demostración (ver abajo) y los correos no se envían, se escriben en el registro del servicio. En una instalación real esa variable no existe y esos botones no funcionan.

### Cómo se prueba (modo demostración)

1. Pulsa «Crear una cuenta» y regístrate con **cualquier correo** (no hace falta que exista).
2. En la pantalla «Confirma tu correo electrónico» pulsa **«Confirmar mi correo ahora (solo demostración)»**.
3. Entra en **Mi cuenta**: arriba hay un panel «Versión de demostración» con cuatro botones para **probar como otra persona** con la misma cuenta: aficionado, peleador, organizador o moderador.

## B. En un ordenador

Requisitos: Node 22 y PostgreSQL 16 (con Docker, el script lo arranca solo).

```bash
git clone https://github.com/romppao/MiClaude && cd MiClaude
git checkout claude/ring-espana-mvp
scripts/demo.sh iniciar        # instala, compila, crea la base con datos de ejemplo y arranca en http://localhost:3000
scripts/demo.sh correos        # enlaces de «confirmar correo» (esta forma no usa el modo demostración)
scripts/demo.sh moderador su@correo.es   # da el papel de moderador a una cuenta ya registrada
scripts/demo.sh parar          # detiene y borra la base de la demo
```

## Qué conviene recorrer (guion corto)

| Papel | Qué probar |
|---|---|
| Sin cuenta | Buscar un peleador, abrir su ficha, ver el calendario de veladas, entrar en «¿Cómo funciona?» |
| Aficionado | Seguir a un peleador, dar aura a un combate, avisar de un error en una ficha |
| Peleador | Crear la ficha, registrar un combate (con rival nuevo y con rival homónimo), quitar un combate registrado por error |
| Organizador | Crear una velada, añadir combates al cartel, corregirla, cancelarla |
| Moderación | Revisar avisos y combates en revisión, aprobar solicitudes |

Guion más detallado por personas: [`pruebas/personas.md`](pruebas/personas.md). Si algo no se entiende a la primera o un botón no hace lo que dice, anótalo: es un fallo de la aplicación, no tuyo.

## Detalles técnicos

- `render.yaml`: servicio web + base de datos gratuitos (región Fráncfort). Arranca con `scripts/arranque-demo.sh` (migraciones, datos de ejemplo si la base está vacía, servidor).
- Modo demostración: `src/lib/common/demo.ts` y `src/app/actions/demo.ts` (acciones que se niegan si `DEMO_MODE` no es `si`; probadas en `tests/unit/autorizacion.test.ts`). Prueba de navegador: `node tests/e2e/demo.mjs` contra un servidor con `DEMO_MODE=si` (el CI no la ejecuta porque su servidor no es de demostración).
- Para una dirección pública **definitiva** (con correos reales) hay que alojar la aplicación de verdad: decisión pendiente del fundador, ver `TRASLADO.md` §7.

## Diseño y personalización publicados — 3 de octubre de 2026

PR #12, commit 8a861e7. La demo ya muestra el violeta oficial #BE33F5 con glow, bordes redondeados y cabeceras comunes. Validada por CI #111 y comprobada públicamente tras el despliegue.

- Peleador: Mi ficha → Editar foto y banner. Ajusta el encuadre, guarda o retira imágenes. En la disciplina jiu-jitsu puedes indicar cinturón y grados declarados.
- Promotor: Mi cuenta → su perfil público o su editor.
- Gimnasio, entrenador o federación: moderación asigna una cuenta con correo confirmado desde el editor; esa cuenta ve sus perfiles gestionados en Mi cuenta.
- Federación: moderación crea el perfil desde Federaciones. El directorio no acredita reconocimiento oficial.

Las imágenes se guardan optimizadas en PostgreSQL. Sin imagen se conservan iniciales y fondo violeta; no es un error de carga. La portada usa personas ficticias con fin ilustrativo.
