# Aportaciones de Claude y relevo para el resto del equipo

Registro de Claude (Claude Code en la nube). Formato y reglas comunes en [`EQUIPO.md`](EQUIPO.md). Lo anterior al 6 de octubre de 2026 está en `DIARIO.md`, `LECCIONES.md` y `TRASLADO.md`; este fichero resume lo esencial y deja el relevo.

## Qué ha hecho Claude en el proyecto (resumen)

- **Estructura y organización (1 oct):** acciones por dominio (`src/app/actions/*`), lógica por dominio (`src/lib/*`), reglas de dependencias comprobadas (`tests/unit/arquitectura.test.ts`), autorización de **todas** las acciones comprobada (`tests/unit/autorizacion.test.ts`: toda acción nueva debe clasificarse), mapa funcional generado (`npm run mapa`).
- **Seguridad y robustez:** límites de intentos reservados antes del cálculo, decisiones condicionadas al estado leído, IP del cliente desde el proxy de confianza, middleware que limpia parámetros hostiles, borrado de datos completo.
- **Pruebas por personas y revisión de código** (ver `docs/pruebas/hallazgos-2026-10-01.md`): corregidos los hallazgos reproducidos; segunda tanda: doble envío, avisos al rival, quitar combate, cartel editable, fichas sin callejones.
- **Demo alojada (2 oct):** `render.yaml`, `scripts/arranque-demo.sh`, modo demostración (`DEMO_MODE=si`: confirmar correo y cambiar de papel).
- **Categorías de peso por disciplina y nivel (2 oct):** fuentes en `DISENO-PESOS.md` (luego ampliadas por Codex con edad y sexo).
- **Revisión del trabajo de Codex (6 oct):** ejecutada desde cero con base vacía: tipos, 406 unitarias, compilación, 16 guiones de navegador y axe, todo en verde; ver `DIARIO.md`.
- **Segunda prueba de ingreso «La escalera» y relevo al portátil (6 oct, noche):** [PRUEBA-ESCALERA.md](PRUEBA-ESCALERA.md) con 4 retos, 37 pruebas ocultas (rama `claude/clave-escalera`), trampas de honestidad y calibración; script `scripts/corregir-escalera.sh`; segunda verificación de proveedores (ADR-003 aprobado, con correcciones de Neon y Resend); [RELEVO-PORTATIL.md](RELEVO-PORTATIL.md).

## 6 de octubre de 2026 — enlaces muertos, cabecera y móvil

**Pedido por el fundador:** «no puede haber botones ni enlaces inservibles […] mejor quítalo»; «nos tenemos que enfocar al mil por mil en cómo funciona la aplicación en dispositivos móviles»; «documentad todo para mantenernos comunicados».
**Base:** `1d0f6d7` (rama `claude/ring-espana-mvp`). **Rama de trabajo:** la misma (pequeñas correcciones directas; CI en cada push).
**Qué cambié y por qué:**
- Cabecera de escritorio: los 5 enlaces se apilaban en vertical junto al botón «Menú» (`nav` con `flex:1` y `wrap` se encogía); ahora no se encoge y la cuenta y el buscador pasan a una segunda línea en pantallas estrechas (`globals.css`).
- «Quitar filtros» solo aparece con filtros activos (`BotonesFiltro` pide `hayFiltros`); el aviso de ránking vacío ya no enlaza a la misma pantalla.
- Textos: «Grupo de edad y categoría sin confirmar» → «Edad y categoría sin indicar».
- **Auditorías nuevas dentro de `test:e2e`:** `enlaces.mjs` (enlaces y botones muertos, por papel) y `movil.mjs` (iPhone/Android emulados: desbordes, zonas táctiles de 44 px, letra de 16 px, zoom, barra inferior).
- Móvil: ayudas de campo de 15 → 16 px, margen inferior para la barra fija, «Entra para seguir / dar aura» pasan a botón táctil, enlaces de las tablas apiladas con 44 px de alto.
**Qué ejecuté yo:** tipos, 406 unitarias, compilación y batería completa con **base vacía** (resultado en `DIARIO.md`). **Solo lo valida el CI:** nada relevante; no puedo ejecutar WebKit (Safari) ni dispositivos reales.
**Sin causa conocida:** el fallo intermitente de `flujo.mjs` («ficha sin titular con tu nombre») no se ha reproducido en 11 arranques en frío; Codex reporta el mismo síntoma en el CI (run 83). Si vuelve a salir: bajar el artefacto de capturas del CI y mirar el HTML antes de tocar nada.
**Qué debe hacer el siguiente asistente:**
1. Conciliar PR #13 (móvil, de Codex/Work) con `NavigationMenu` y volver a pasar `movil.mjs`; no duplicar menú.
2. Cerrar PRs obsoletos: #9 (ya incluido en #10) y las 5 propuestas de Dependabot con saltos mayores que fallan el CI (Next 16, Prisma 7, TypeScript 7; la regla del proyecto es TypeScript 5.x).
3. PWA: manifiesto, iconos, `theme-color`, página sin conexión (ver `MOVIL.md`).
4. Escalabilidad antes del diseño: fotos de perfil fuera de PostgreSQL (almacenamiento de objetos + CDN), caché de páginas públicas (hoy casi todo es `force-dynamic`), cola de correos, base de datos gestionada con copias y prueba de restauración, prueba de carga.
**Decisiones del fundador abiertas:** ver `TRASLADO.md` §7 y `PULIDO-FUNCIONAL.md` (menores, aura, correo/responsable, paneles A/B/C al registrarse, almacenamiento de fotos, camino hacia las tiendas).


## 6 de octubre de 2026 (tarde) — escenarios de uso por persona y móvil

**Pedido por el fundador:** «cuando compruebes cosas de la aplicación, hazlo como si fueras uno de los usuarios […] como peleador, como usuario, como promotora o como federación; un escenario ficticio con los casos de uso de cada tipo de usuario».
**Qué cambia en la forma de probar:** además de las comprobaciones sueltas, existe **`tests/e2e/escenarios.mjs`** (`npm run test:escenarios`): cinco personas desde un iPhone emulado — Marta (visitante), Lucas (aficionado), Diego (peleador), Clara (promotora, con la moderadora que aprueba su solicitud) y Pedro (delegado de federación, al que la moderación crea el perfil y asigna como titular) — hacen lo que haría cada una con los textos que ven, y **cada paso deja una captura** (`/tmp/escenarios/*.png`, o `ESC_DIR`) que se revisa a ojo. Anota además fricciones automáticas (errores de consola, respuestas 5xx, pasos de más de 4 s, desplazamiento horizontal). No está en `test:e2e` (es de revisión, escribe capturas).
**Qué salió de los escenarios (todo corregido):**
- «Mi ficha» medía más de 4.000 px de alto en móvil y lo principal (registrar combate) quedaba al fondo → índice «Ir a: Registrar un combate · Mis combates · Mis datos · Mis disciplinas» arriba (enlaces de 44 px a secciones con `id`).
- El formulario «Registrar un combate» medía unos 2.300 px → recinto, asaltos y enlace de respaldo pasan a un apartado desplegable «Más datos del combate (opcional)» (se abre solo si hay un error en ellos; el ayudante `registrar()` de las pruebas lo abre).
- La barra fija inferior tapaba botones y campos al llevarles el foco o el desplazamiento → `scroll-padding-bottom` en móvil (WCAG 2.4.11) y margen final de página.
- «Entra para seguir a este peleador» y «Entra para dar aura» eran líneas de texto de 26 px (probablemente lo que el fundador pulsó sin éxito) → botones táctiles; enlaces de tablas apiladas y resultados de búsqueda con 44 px.
- Ayudas de campo de 15 px → 16 px.
**Qué ejecuté yo:** `movil.mjs` (4 emulaciones × 4 papeles, sin problemas), `escenarios.mjs` (5 personas, 43 pasos, 0 fallos), `enlaces.mjs`, tipos y 406 unitarias; batería completa con base vacía (resultado en `DIARIO.md`). **No se puede ejecutar aquí:** Safari/WebKit ni dispositivos reales (ver `MOVIL.md`).
**Qué debe hacer el siguiente asistente:** ampliar `escenarios.mjs` con las personas que faltan (entrenador y gimnasio titulares de su perfil, moderadora recorriendo todas sus colas, peleador menor de edad cuando se decida la política, persona mayor con letra grande y zoom); mantenerlo al día cuando cambie un recorrido; mirar las capturas, no solo el resultado.
- **Correcciones de la revisión de Codex (6 oct, noche):** paneles A/B/C del registro (T-011, hecho por Claude a petición del fundador), PRs sobrantes cerrados (#1–#7, #9, #13 con lo útil portado), Dependabot sin saltos mayores, textos técnicos en lenguaje llano, `CLAUDE.md` sin contradicción, imágenes con ETag/304 y arreglo del fallo del CI en la auditoría móvil (paginación y enlaces de tabla a 44 px).
- **Proveedores de la fase 0 (6 oct, noche):** cuatro investigaciones en paralelo y su síntesis en ADR-003 (Neon, R2, Resend, Sentry, UptimeRobot; política de menores en borrador); nueva ficha T-014 y fichas T-004/T-008/T-010/T-012 ajustadas. Límite: precios no verificados en la fuente.
- **Prueba de ingreso rehecha (6 oct, noche):** T-005 (prueba común máxima) y T-013 (nivel 1) sustituyen a T-011 y T-002, que hizo Claude.


## 8 de octubre de 2026 — Diseño móvil v3, fase 1
**Pedido por el fundador:** implementar la entrega de Claude Design «Ring España App v3» (negro y lima) con backend completo, por fases, manteniendo la lista de formas de terminar del repositorio.
**Base:** `claude/ring-espana-mvp` en `74e3f56`. **Rama de trabajo:** `claude/diseno-movil-v3-fase1`. **PR:** ver la rama.
**Qué cambié y por qué:** tema v3 en `globals.css` (todas las clases anteriores conservadas), fuente Archivo alojada, barra inferior por papel, `/bienvenida`, registro por pasos para aficionado, peleador, entrenador y entidad (incluido club), inicio por papel (`src/app/_inicio/`), ficha de peleador y «Mi ficha» rehechas con highlights y récord amateur privado, perfil y clases del entrenador (`/mis-clases`, acciones `trainers.ts`), «Cómo terminó» según la disciplina, descarga y borrado de los datos nuevos. Migración aditiva `20261008090000_diseno_movil_v3`.
**Qué ejecuté yo:** `npm run typecheck`, `npm test` (461), `npm run build`, paridad de migraciones, los 19 guiones de navegador con base vacía (486 comprobaciones, 0 fallos, incluido el nuevo `diseno.mjs`), `accesibilidad.mjs` (53 pantallas, 0 incumplimientos), `npm run mapa`; capturas de los cuatro tipos de cuenta en iPhone emulado. **Qué solo valida el CI:** la misma batería en GitHub Actions.
**Qué salió mal / sin causa conocida:** nada sin causa; errores propios anotados en `LECCIONES.md` (pkill, estilo en línea, enlaces en tema oscuro, aria-label).
**Qué debe hacer el siguiente asistente:** 1) revisar el PR y el CI; 2) planificar en fichas la fase 2 (`PLAN.md`, «Diseño móvil v3»); 3) no rehacer el tema sin el fundador.
**Decisiones del fundador abiertas:** `TRASLADO.md` §7, puntos 18–22.


## 8 de octubre de 2026 — Diseño v3, fase 2a
**Pedido por el fundador:** misma portada para todos con noticias de fuentes variadas y portada por disciplina; menú solo con las opciones de cada tipo de cuenta (el entrenador: entrenador, club y promotora); el entrenador crea veladas e interclubs; vídeos y fotos del público en las veladas, «en la app de verdad y, si no es viable, mediante enlaces».
**Base:** `claude/ring-espana-mvp` en `a34deab`. **Rama de trabajo:** `claude/diseno-v3-fase2a`. **PR:** ver la rama (sin fusionar: actualiza la demo).
**Qué cambié y por qué:** ver la entrada del mismo día en `DIARIO.md`, `ARQUITECTURA.md` («Diseño v3, fase 2a») y `VIDEOS.md`.
**Qué ejecuté yo:** `npm run typecheck`, `npm test` (527), `npm run build`, paridad de migraciones, los 20 guiones de navegador con base vacía (**520 comprobaciones, 0 fallos**, incluido el nuevo `fase2a.mjs`), `accesibilidad.mjs` (61 pantallas, 0 incumplimientos), `npm run mapa` y la comprobación del catálogo de Codex (257 archivos, 9/9 pruebas); capturas en iPhone emulado.
**Qué solo valida el CI:** la misma batería en GitHub Actions (con `NEWS_FETCH=no` y `MEDIA_DIR`).
**Qué salió mal / sin causa conocida:** nada sin causa; errores propios en `LECCIONES.md`. Las fuentes de noticias reales no se pudieron abrir desde aquí.
**Qué debe hacer el siguiente asistente:** 1) revisar en la demo `/moderacion/noticias` (qué fuentes funcionan); 2) con el cubo de R2 creado, probar una subida real desde un móvil; 3) planificar en fichas el resto de la fase 2 (`PLAN.md`).
**Decisiones del fundador abiertas:** `TRASLADO.md` §7, puntos 23–25.

## 8 de octubre de 2026 — Portada con selector de deporte y cuenta del creador
**Pedido por el fundador:** «la primera pantalla […] con todas las noticias, todo generalizado […] al seleccionar el deporte, otra pantalla como la inicial pero exclusivamente de esa disciplina»; y «un usuario especial, yo como creador, para entrar desde cualquier sitio […] y gestionar cualquier aspecto».
**Base:** `claude/ring-espana-mvp` tras fusionar #28 y #30. **Rama:** `claude/portada-y-creador`. **PR:** ver la rama (sin fusionar: actualiza la demo).
**Qué cambié y por qué:** ver `DIARIO.md` (entrada 6 del 8 de octubre), `ARQUITECTURA.md` («Cuenta del creador») y `CREADOR.md`.
**Qué ejecuté yo:** ver la entrada del diario (typecheck, pruebas unitarias, compilación, paridad de migraciones, todos los guiones de navegador con base vacía, accesibilidad, mapa y catálogo).
**Qué solo valida el CI:** la misma batería en GitHub Actions, con `CREADOR_CORREO=creador@prueba.test`.
**Qué debe hacer el siguiente asistente:** nada de la cuenta del creador sin el fundador (es seguridad); si pide borrar o suspender cuentas desde Administración, escribir antes la ficha.
**Decisiones del fundador abiertas:** `TRASLADO.md` §7, punto 27.

## 8 de octubre de 2026 — Iconos de cada deporte y noticias estrictamente por disciplina
**Pedido por el fundador:** iconos o imágenes en el panel de disciplinas; noticias solo en español y «única y exclusivamente» de cada disciplina en su pantalla.
**Base:** `claude/ring-espana-mvp` tras fusionar #31. **Rama:** `claude/iconos-y-noticias`.
**Qué cambié y por qué:** entrada 7 del 8 de octubre en `DIARIO.md` y «Noticias por disciplina e iconos» en `ARQUITECTURA.md`.
**Qué debe hacer el siguiente asistente:**
1. Revisar en la demo `/moderacion/noticias`: qué fuentes nuevas leen bien.
2. Si alguna falla, buscar su dirección real desde una red sin restricciones.
3. Añadir medios de K-1, kickboxing y Muay Thai si el fundador da referencias.

## 8 de octubre de 2026 — Arreglos tras probar la demo en el móvil
**Pedido por el fundador:** menos desplazamiento hacia abajo (deslizar a los lados), foto y banner a la vez, portada de los highlights, quitar disciplinas y poder reservar clases.
**Rama:** `claude/ring-espana-siguiente`. **Qué cambié y por qué:** entrada del 8 de octubre «Arreglos tras probar la demo en el móvil» en `DIARIO.md` y la sección del mismo día en `ARQUITECTURA.md`.
**Qué debe hacer el siguiente asistente:**
1. Probar en Safari de iPhone el deslizamiento de las pestañas y el fotograma automático de los vídeos.
2. Si el fundador lo aprueba, llevar las pestañas a otras pantallas largas (velada, gimnasio).
3. No añadir pagos a las clases sin decisión del fundador y proveedor aprobado (`CLAUDE.md`, presupuesto).

## 8 de octubre de 2026 — Acciones en cada panel, buscar clases, reserva con calendario y retos o sparring
**Pedido por el fundador:** reservar sin escribir (calendario y barra), recuperar «retar o pedir sparring» (nunca se había implementado: propuesta del diseño v3) y servicios visibles nada más entrar.
**Qué cambié y por qué:** entrada del mismo día en `DIARIO.md` y sección en `ARQUITECTURA.md`.
**Qué debe hacer el siguiente asistente:** probar en un iPhone real la barra de horas y la tira de días; no añadir pagos a clases ni convertir retos en combates de cartel sin decisión del fundador.
