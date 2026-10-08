# Noticias: reglas y mantenimiento de las fuentes

> **Quién lo lleva:** por decisión del fundador (8 de octubre de 2026), cuando la aplicación esté publicada **Antigravity** se encargará de buscar y mantener las fuentes de noticias, porque «es una tarea sencilla, no requiere un súper esfuerzo en código, es buscar la información». Hasta entonces lo hace Claude. Esta guía es lo que necesita quien lo lleve.

## Lo que pide el fundador (no negociable)

1. **Solo en español.** «No quiero noticias en inglés. Quiero noticias completamente en español para la gente de España.»
2. **Solo del panorama español.** «Deportistas españoles o con residencia en España […] fomentar que la gente apoye a los nuestros y crear comunidad en España, en cada comunidad autónoma, en cada municipio». Se incluyen los españoles reconocidos a nivel mundial, pero sobre todo «esos luchadores que todavía no tienen el apoyo suficiente».
3. **Cada disciplina, solo lo suyo.** «Única y exclusivamente contenido de cada disciplina en su pantalla. Si una fuente habla un poco de todo, coge de esa fuente solo lo de boxeo.»
4. **Fuentes fiables y variadas:** prensa, federaciones, clubes, canales de vídeo. Ningún medio acapara la portada (como mucho dos seguidas arriba).

## Cómo lo aplica la aplicación (automático)

Cada titular pasa tres filtros al leerse (`src/lib/news/refresh.ts`, función `aceptar`):

| Filtro | Dónde | Qué hace |
|---|---|---|
| Idioma | `parse.ts` · `enEspanol` | Descarta los titulares en inglés |
| Panorama español | `espana.ts` · `delPanoramaEspanol` | Si la fuente está marcada como **«Solo panorama español»**, acepta todo. Si no, solo acepta los titulares cuyo titular o resumen nombran España, una comunidad, una provincia o capital, una federación o competición española, o a un español de élite de la lista |
| Disciplina | `parse.ts` · `clasificar` | Una noticia va a una disciplina solo si su **titular** habla de esa y de ninguna otra. Si nombra varias, solo sale en «Todos». Si no nombra ninguna, solo cuenta la disciplina de la fuente cuando es un medio o federación **dedicado** a una sola. De una fuente general, lo que no nombra ningún deporte de contacto se descarta |

Al cambiar estas reglas, los titulares ya guardados se revisan solos una vez tras cada despliegue.

## Tareas de quien mantiene las fuentes

Todo se hace desde **Moderación → Fuentes de noticias** (`/moderacion/noticias`), sin tocar el código.

1. **Revisar el estado** al menos una vez por semana. Cada fuente dice «Funciona», «Falla: motivo» o «Todavía no se ha leído».
   - Una fuente que falla varios días seguidos se desactiva, o se busca su dirección correcta.
2. **Buscar fuentes nuevas.** Prioridad:
   1. federaciones autonómicas;
   2. clubes y gimnasios con noticias;
   3. promotoras españolas;
   4. medios locales;
   5. canales de vídeo en español.
   - Sirve cualquier canal **RSS o Atom**. En WordPress suele ser `https://sitio/feed/`. En YouTube, `https://www.youtube.com/feeds/videos.xml?channel_id=UC…`.
3. **Al añadir una fuente:**
   - **Disciplinas:** marca la disciplina solo si la fuente se dedica **exclusivamente** a ella. Si trata varias, no marques ninguna: cada titular irá a la disciplina que nombre.
   - **«Solo publica noticias del panorama español»:** márcala solo si la fuente únicamente cubre España (una federación, un club, un medio local). Un medio que también cuenta noticias internacionales **no** se marca.
   - **Tipo:** prensa, federación, canal de vídeo o varios medios.
4. **Ocultar un titular** que se haya colado (botón «Ocultar» en la misma página), y anotar por qué en el informe para mejorar las reglas.
5. **Ampliar la lista de españoles de élite** (`PELEADORES` en `src/lib/news/espana.ts`) cuando un español destaque a nivel internacional. Es el único cambio de código: un PR pequeño con su prueba en `tests/unit/noticias.test.ts`.

## Fuentes de partida (8 de octubre de 2026)

Elegidas por búsqueda. **No se pudieron abrir desde el entorno de desarrollo**: hay que comprobar en la demo cuáles funcionan.

| Fuente | Disciplina | Solo España | Nota |
|---|---|---|---|
| Búsquedas de Google Noticias (España, una por disciplina) | La de cada búsqueda (se reclasifica) | No (se comprueba cada titular) | Excluyen las demás disciplinas. Pendiente: sus condiciones de uso comercial (`TRASLADO.md` §7.23) |
| Federaciones españolas (Google Noticias) | Varias | Sí | |
| Espabox | Boxeo | No | También cubre boxeo internacional |
| AEBOX (Asociación Española de Boxeo) | Boxeo | Sí | |
| Real Federación Española de Boxeo | Boxeo | Sí | |
| MMA España | MMA | No | Mucho UFC internacional |
| UFC Español (canal de vídeo) | MMA | No | Identificador del canal sin comprobar en YouTube |
| Fighter Corner | Jiu-jitsu | Sí | Eventos y resultados en España |
| FEKM (Federación Española de Kickboxing y Muaythai) | Varias (kickboxing, K-1, Muay Thai) | Sí | |
| Jaula Magazine | Varias (sobre todo MMA) | No | |
| Deporte de Contacto | Varias | No | |

**Huecos conocidos:**
- No se encontró ningún medio en español dedicado solo a K-1, solo a kickboxing o solo a Muay Thai. La mejor vía son las **federaciones autonómicas** y los **clubes**.
- Ojo: el «jiu-jitsu» de la Real Federación Española de Judo es el jiu-jitsu japonés tradicional, **no** el brasileño.

## Qué no hacer

- No copiar el texto de las noticias: la aplicación solo guarda el titular, el medio, la fecha y la miniatura, y enlaza al original.
- No añadir fuentes en inglés aunque sean buenas.
- No marcar como «Solo panorama español» un medio que también cuenta noticias internacionales.
- No dar prioridad a una disciplina, a una ciudad o a un medio sobre los demás (`CLAUDE.md`, comunicación inclusiva).
