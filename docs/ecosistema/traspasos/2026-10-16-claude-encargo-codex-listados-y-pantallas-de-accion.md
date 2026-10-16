# Encargo para Codex: listados con foto, menos scroll y pantallas de acción

- **Fecha:** 16-10-2026 (tarde). **De:** Claude Code. **Para:** Codex.
- **Por qué te lo paso:** el fundador avisó de que a Claude se le acaba el cupo y pidió que, al llegar al 95 %, todo el esfuerzo pase a Codex. Este es el relevo. Si no tienes créditos, no empieces y avisa al fundador.
- **Modelo y esfuerzo (AGENTS.md):** esfuerzo **medio**. Documentación, versión, CHANGELOG, DIARIO y catálogo: `gpt-6-luna` o esfuerzo bajo. Pruebas completas **una vez** antes de entregar.
- **Regla del fundador para TODO ajuste visual (16-10):** usar siempre las skills `impeccable`, `animate`, `animate-expo` y `motion-design` (en `.agents/skills/`). Si alguna no está en tu cliente, dilo en el PR. Tokens y estilo: `src/app/globals.css` y `docs/DISENO.md` (Diseño v3: negro y lima, Bricolage/Archivo, tarjetas de 24-28 px). Mínimo 16 px de texto, 44 px de zona táctil, contraste AA; sin colores fijos en componentes. Movimiento: tarjetas de listados = uso frecuente, así que solo la entrada `data-reveal` que ya existe y el pulsado; nada más.

## Lo que pidió el fundador (palabras suyas, 16-10)

1. «En todos los usuarios de la aplicación hay muchas pantallas que se ven muy aburridas, como era el caso de las veladas […] ahora tiene un aspecto mucho mejor, mostrando directamente la imagen de la cartelera. Quiero que hagas eso con todas las pantallas de ese estilo»: **peleadores, entrenadores y gimnasios**.
2. Entrenadores: «no hay una pantalla de entrenadores […] el usuario aficionado debe tener esa pantalla sí o sí, ya que quizás quiera tomar clases de un entrenador en concreto».
3. «Tienes que scrollear mucho hacia abajo para encontrar funciones relevantes al fondo de la pantalla […] debo saber alternar entre sliders horizontales y verticales.»
4. «Muchas de las pantallas en las que se hacen acciones se ven muy poco visuales e intuitivas», por ejemplo: **el aficionado cuando sube contenido que ha grabado (`/compartir`) y cuando busca clases (`/clases`), y el peleador cuando configura su perfil y registra su trayectoria (`/mi-ficha`, `/mi-ficha/trayectoria`)**. «Aburridas y poco intuitivas para un usuario que no tenga muchas nociones de usar un teléfono móvil.»

## Hecho por Claude (ya subido)

Rama **`claude-code/listados-con-imagen-peleadores-entrenado-20261016`** (reservada en `ESTADO`; la creó `scripts/estado.mjs reservar`). No tiene versión, CHANGELOG ni registros todavía y **no hay PR**. Tipos y las 887 pruebas unitarias en verde; **no se ha mirado en pantalla ni se han pasado los e2e**.

- `src/app/components/TarjetasDirectorio.tsx`: `TarjetaPersona` (peleador y entrenador) y `TarjetaGimnasioCartel`. Foto a toda la tarjeta (`/imagenes/<tipo>/<id>/avatar`, o `banner` en gimnasios); sin foto, tinte de la disciplina e iniciales. Conservan `class="card"` y el nombre en `<strong>` porque las pruebas e2e los usan (`filtros.mjs`, `flujo.mjs`, `diseno.mjs`, `paneles-agenda.mjs` dependen de `main .grid > a.card`, `main .card strong` y de los textos «1 clase» y «Disponible para pelear · 70.25 kg»). **No los quites; si una prueba debe cambiar, explica por qué y no la debilites.**
- `src/app/components/DirectorioNav.tsx`: selector Peleadores · Entrenadores · Gimnasios en la cabecera de los tres directorios (así el aficionado llega a Entrenadores desde Peleadores, que ya está en su barra inferior) y fila deslizable de disciplinas (`ChipsDisciplina`).
- `/peleadores`: cartel de dos columnas en el móvil (`.grid.grid-cartel` en `globals.css`).
- `/entrenadores`: reescrita con filtros (nombre, disciplina, provincia, «Da clases en Lona», «Dónde entrena»: gimnasio o por su cuenta), cartel con «N clases» y «desde X €», enlace a `/clases`.
- `/gimnasios`: la lista pasa a carteles; el mapa sigue primero y la lista sigue recogida en «Ver todos los gimnasios».

## Tareas, por orden

### 1. Terminar y entregar este trozo (PR pequeño)
- Rama nueva desde la mía: `codex/listados-cartel-20261016` (`git fetch`, partir de `origin/claude-code/listados-con-imagen-peleadores-entrenado-20261016`; **no escribas en la mía**).
- Míralo en pantalla a 375 px y a 1280 px, tema claro y oscuro, con y sin fotos, nombres muy largos, filtros que no devuelven nada y 1 sola tarjeta. Arregla lo que veas (solapes, texto cortado, contraste del texto sobre foto, la fila de disciplinas, la barra del selector). Para las capturas, las fotos de prueba pueden subirse desde `/mi-ficha`.
- **Entrenadores en el menú:** `menu.ts` limita cada bloque a 5 enlaces y la prueba de paneles exige `/clases`; hoy «Explorar» ya tiene 5, por eso solo se llega a `/entrenadores` desde el selector. Propón (no improvises) cómo dar al aficionado un acceso directo: por ejemplo, que el enlace «Clases y entrenadores» lleve a `/entrenadores` y que ese listado enseñe arriba un botón grande «Buscar clases» a `/clases`, ajustando la prueba solo para aceptar el nuevo destino.
- Pruebas: `npm run typecheck`, `npx vitest run tests/unit`, y los e2e `filtros`, `flujo`, `diseno`, `paneles-agenda`, `enlaces`, `menu` y accesibilidad. Receta local (Windows, sin psql): contenedor `postgres:16`, `prisma migrate deploy` + `npm run db:seed`, `npm run build`, servidor en un puerto libre y un `psql.cmd` que reenvíe a `docker exec -i <contenedor> psql -U postgres -d ringespana`; el CI se detiene en el primer fallo, en local corre cada script por separado.
- Versión (`node scripts/version.mjs subir menor`, debe quedar por encima de la principal), CHANGELOG, DIARIO, tu fila de `ESTADO.md`, catálogo y mapa con sus scripts. Abre el PR y avisa; **no fusiones**.

### 2. Menos scroll (segundo PR)
- Mide primero: altura de cada pantalla en 375 px (documento / ventana) para `/`, `/peleadores/[slug]`, `/gimnasios/[slug]`, `/entrenadores/[slug]`, `/veladas/[slug]`, `/mi-panel`, `/mi-ficha`, `/clases`. Un script de Playwright de 30 líneas basta; guarda el resultado en `docs/pruebas/`.
- En las más largas: la acción principal arriba (visible sin deslizar), secciones secundarias en pestañas deslizables (`components/Pestanas.tsx`) o en filas horizontales (`.desliza`, `.chips-desliza`), y lo menos usado recogido en `details`. Alternar: filas horizontales para elegir entre cosas parecidas (clases, disciplinas, peleadores), pestañas para secciones distintas, vertical solo para lo que se lee de arriba abajo. No quites contenido ni funciones.

### 3. Pantallas de acción guiadas (tercer PR, uno por pantalla)
Orden: `/compartir` (subir vídeos o fotos) → `/clases` (buscar clases) → `/mi-ficha` (configurar el perfil) → `/mi-ficha/trayectoria` (registrar la trayectoria).
- Para alguien que apenas sabe usar el móvil: **un paso por pantalla** con indicador de progreso («Paso 2 de 4»), **elecciones grandes con icono** en vez de desplegables cuando son pocas opciones (disciplina, nivel, tipo de contenido), una sola acción principal bien visible, textos llanos sin jerga, vista previa de lo que se va a publicar y confirmación clara al terminar con qué pasa después. Errores que digan cómo arreglarlos.
- Conserva todas las funciones y reglas actuales (moderación de lo subido, reglas de récord y de veladas pasadas, etc.). Si una regla de negocio no está clara, pregunta; no inventes.
- Antes de rehacer cada una, escribe en el PR cómo es hoy (captura a 375 px) y cómo quedará.

### 4. Datos al día y sincronizados en tiempo real para todos (requisito del fundador, 16-10)
Palabras suyas: «es importante que en la aplicación todos los datos estén actualizados y sincronizados en tiempo real para todos los usuarios, así no se pierde nadie las cosas que pasan». Es un requisito de la aplicación entera, no una pantalla.
- **Primero audita, no construyas.** Qué se ve hoy: las páginas de listados son `force-dynamic` (al recargar, datos nuevos), pero ninguna se actualiza sola mientras la persona la tiene abierta. Haz una tabla en `docs/pruebas/` con las pantallas donde un dato desfasado hace perder algo (plazas e inscripciones abiertas, entradas disponibles y reservas, avisos, solicitudes de clase, cambios de fecha, resultados y aura de una velada, disponibilidad de peleadores) y de qué manera se queda anticuado cada una (sin recarga, caché del navegador o de Next, avisos que solo salen al cambiar de página).
- **Propón con coste** (el fundador pide gastar lo mínimo y Render es plan gratuito, que duerme la web y limita las conexiones abiertas): lo más barato primero, por ejemplo revalidar al volver a la pestaña o a la app (`visibilitychange`/foco) y sondeo corto solo donde importa (avisos, entradas, inscripciones), y empuje desde el servidor (SSE) únicamente donde el sondeo no baste. Indica qué cambia en el consumo de la base de datos de Neon. **No contrates nada ni cambies de proveedor sin su aprobación.**
- Ya existe un ejemplo de datos vivos en el panel de la flota (`scripts/flota-estado.mjs`), pero es local; no lo uses de modelo para producción sin revisar.
- Entrega la propuesta como documento y, si el fundador la aprueba, una primera pantalla de prueba (la que más pierda hoy). Los datos que dos personas pueden pisar a la vez (reservas, plazas) deben seguir protegidos en el servidor con bloqueos y transacciones, como en la 0.20.0.

### Cosas que NO son tuyas
- Fusionar (`gh pr merge`): lo decide el fundador. El dominio, DNS y Render: no se tocan (`docs/DOMINIO.md`).
- Cuando el fundador fusione en la rama de la demo, Render despliega solo: comprueba `https://ring-espana-demo.onrender.com/salud` y da la versión nueva.
