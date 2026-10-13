# Revisión de móvil y escritorio — 13 de octubre de 2026

> Informe de la primera revisión sobre una copia antigua. La entrega vigente y los resultados sobre la base oficial están en [REVISION-LONA-ACTUAL-20261013.md](REVISION-LONA-ACTUAL-20261013.md). Los tipos/build de este informe no certifican la base nueva.

Petición del fundador: revisar el estado de MiClaude, corregir partes descolocadas en escritorio y móvil usando impeccable y break-ui y entregar otra demo. Base local `d64de99`, rama `codex/adaptacion-responsive-20261013`. Copia limpia al empezar. No se pudo contrastar el remoto: `git fetch` falló por conexión a GitHub. No se ha publicado, integrado ni desplegado.

Se conservan identidad negro/lima/violeta, Archivo, contenido, rutas, permisos y consultas. El contexto de impeccable no se ejecutó; se leyeron las instrucciones, adapt y craft-floor, además del catálogo de break-ui y la documentación existente del proyecto. Se aplicaron también las reglas pertinentes de vercel-react-best-practices.

## Superficies y límites de los datos

La revisión aislada usa `VistaVisitante`, las tarjetas y las noticias reales. Las consultas siguen en `InicioVisitante`; las fixtures solo entran por las propiedades de la vista. La raíz y su menú son los reales, sin sesión. La portada común de revisión comprueba los componentes de actualidad, no reproduce una sesión autenticada.

| Campo renderizado | Origen | Tipo y límite | Opcional |
|---|---|---|---|
| Nombre de velada | `e.name` | Texto, 120 en `LIMITS.eventName`; columna String | No |
| Localidad | `e.city` | Texto, 80 en `LIMITS.city` | No |
| Fecha, día, mes | `e.date`, `dayAndMonth` | Date; formato de fecha del proyecto | No |
| Disciplina y nivel | `e.discipline`, `e.level` | Enumeraciones y etiquetas centralizadas | No |
| Destino de velada | `e.slug` | Identificador; sin máximo encontrado en columna String | No |
| Nombre de peleador | `f.name` | Compuesto: nombre 80 + apellido 120 | No |
| Foto e iniciales | `f.id`, `iniciales(f.name)` | Imagen opcional; iniciales derivadas | Foto sí |
| Aura, posición | `f.aura`, `f.pos` | Número; sin límite explícito de presentación | Posición sí |
| Destino del perfil | `f.slug` | Identificador String; sin máximo encontrado | No |
| Titular y destino | `n.title`, `n.url` | String de fuente; sin máximo en NewsItem | No |
| Medio | `n.publisher ?? n.source.name` | Texto; sin máximo encontrado | Publisher sí |
| Fecha relativa y tipo de fuente | `n.publishedAt`, `source.kind` | Date y enumeración; `haceTiempo` | No |
| Disciplinas de noticia | `n.disciplines` | Array de enumeración; admite vacío | Sí |
| Portada de noticia | `n.imageUrl` | URL opcional; admite imagen ausente o rota | Sí |
| Listas | Consultas de `datos.ts`, `ultimasNoticias` | Veladas/aura: 6; noticias visitante: 5, común: 13 | Vacío válido |
| Búsqueda | `q` | Entrada con maxLength 80 | Sí |
| Servicios, navegación y botones | Textos estáticos del proyecto | Destinos originales; menú según rol | Según rol |

Las fixtures usan nombres largos plausibles, Jo, CJK, diacríticos y emoji; evento y localidad largos dentro de límites, todas las disciplinas juntas, cifras 0/1/12.345.678, imagen 404, y colecciones vacías/de uno/de mil elementos. Mil es una prueba artificial del componente: las consultas de producción ya están acotadas, no se añade paginación ni se cambia el producto.

## Qué se rompía y corrección

| Gravedad | Campo o superficie | Caso | Resultado anterior | Corrección y ubicación |
|---|---|---|---|---|
| Roto | Cartel | Encuentro nacional amateur de clubes de deportes de contacto y exhibición de nuevas promesas | 314 px de contenido en una caja de 300; localidad recortada | Altura mínima y crecimiento; `src/app/globals.css`, `.cartel` |
| Roto | Noticias | 12 noticias en la portada común | CSS ocultaba las cuatro últimas en escritorio | Retirar `nth-child(n+9)`; `globals.css`, `.portada-actualidad .fila-noticias` |
| Feo | Cabecera móvil | 320 px | Menú debajo de la marca | Compactar marca y botón a este ancho; `globals.css`, media de 380 px |
| Frágil | Cuenta en escritorio | Acciones propias de varios roles | Una fila sin ajuste para navegación, cuenta y búsqueda | Cuadrícula con navegación en segunda fila y cuenta que admite ajuste; `globals.css`, media de 1024 px. Roles autenticados pendientes de comprobación con base |
| Feo | Actualidad visitante | Escritorio con columna de medio ancho | Noticias atrapadas en carrusel junto a disciplinas | Actualidad a ancho completo y cuadrícula de noticias según contenedor; `Visitante.tsx` y `globals.css` |
| Frágil | Iniciales | 🦊 Fox | El acceso por unidad UTF-16 podía producir un carácter roto | `Intl.Segmenter`, conservando las dos primeras palabras; `lib/common/apariencia.ts` |
| Frágil | Fotos | 404 antes de hidratación; cambio de URL | Posible icono roto o fallo heredado de la imagen anterior | Comprobar imagen ya completada y asociar fallo a URL; `Foto.tsx`, `PortadaNoticia.tsx` |
| Feo | Aura | 12345678 | Cifra sin agrupación española | `Intl.NumberFormat('es-ES')`; `Tarjetas.tsx` |

Decisiones aplicadas dentro del encargo: títulos y localidades de carteles se muestran completos y la caja crece. Los titulares de mini-noticias mantienen su límite existente de cuatro líneas; ahora tienen `title` y enlace al texto completo en el medio. No se añade un límite nuevo a datos de fuentes externas. Ninguna decisión pendiente bloquea la entrega visual.

Lo que resistió: listas vacías y de uno, nombres con diacríticos/CJK, campos opcionales de noticias, la búsqueda acotada y los controles del menú; no fue necesario modificar backend ni contratos de permisos. El carrusel se conserva en móvil; las disciplinas usan tres columnas dentro de su sección de escritorio.

## Demo y verificación

Demo de desarrollo: `http://127.0.0.1:3137/revision-ui`. Selector Ejemplo / Extremo / Vacío / Uno / 1.000, persistido en `?data=`. «Portada común» alterna la superficie de actualidad. El guardado `NODE_ENV !== 'development'` devuelve 404 en producción. Los enlaces de perfiles y veladas ficticias no representan registros existentes; la advertencia lo indica. No sustituye la demo conectada a PostgreSQL.

Prueba mantenida: `tests/browser/responsive.mjs`, contra desarrollo local. Evidencias: `test-results/responsive/`, anterior y posterior. Navegador Chrome/Chromium en Windows, anchos 320, 390, 650, 768, 1024, 1280, 1440 y 2560. El espacio CSS a 720 px representa una ventana de 1440 px ampliada al 200%; no se verificó el zoom nativo. Menú con toque sintetizado, Escape y desplazamiento horizontal programático; no se certifican gestos físicos ni Safari/iOS/Android. El producto actual es oscuro; no se añadieron un tema claro ni RTL.

Primera validación: 58 comprobaciones de navegador correctas, incluidas axe sin infracciones graves/críticas en actualidad a 320/1440. Tipos correctos. Unitarias: 650/652; dos fallos en multimedia por rutas POSIX en Windows, en archivos no modificados y ya recogidos en traspasos previos. Resultados de confirmación final y compilación en el registro de Codex.

No hay PostgreSQL local en marcha: no se ejecutó la batería completa de cuentas, escrituras, migraciones y permisos. Siguiente paso: revisar esta rama, comprobarla con base aislada y CI Linux; publicación de demo remota requiere un entorno disponible y autorización específica.

Confirmación final: 60 comprobaciones de navegador correctas; tipos y build correctos. Servidor de producción: /revision-ui responde 404. Las fixtures de avatar usan URL ficticia local sin consultar PostgreSQL. Catálogo de 327 fuentes y mapa de 71 pantallas comprobados. Documentación 8/9: symlink EPERM en Windows.

Ubicaciones verificadas: globals.css:341 (carteles), globals.css:683 (cabecera), globals.css:694 (actualidad), globals.css:724 (móvil estrecho), Visitante.tsx:66, Tarjetas.tsx:50, Foto.tsx:12, PortadaNoticia.tsx:21, apariencia.ts:20.
