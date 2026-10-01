# Guion de pruebas por personas

Cómo se comprueba que **la aplicación funciona de verdad** para quien la usa: no basta con que pasen las pruebas automáticas.
Cada persona tiene un objetivo, unos pasos y las preguntas que hay que hacerse. Se puede seguir a mano (con un navegador) o con
un navegador automatizado; las pruebas automáticas del repositorio (`tests/e2e`) cubren los caminos principales, pero **este guion
es la referencia de lo que debe poder hacerse**. Cualquier fallo encontrado se convierte en una prueba automática nueva.

**Entorno aislado** (base de datos y servidor propios, con datos ficticios), desde la raíz del repositorio:

```bash
npm run build
RAIZ_APP=$PWD scripts/entorno-aislado.sh iniciar mi_prueba 4100 --semilla   # imprime BASE_URL, DATABASE_URL y MAIL_LOG
scripts/entorno-aislado.sh parar mi_prueba                                  # al terminar
```

Los correos no se envían: salen en el fichero `MAIL_LOG` (el enlace de confirmar el correo, el de recuperar la contraseña…).
Para hacer moderadora a una persona de prueba (única acción que no se puede hacer desde la web):
`psql "$DATABASE_URL" -c "update \"User\" set role='ADMIN' where email='…'"`.

## Qué se anota siempre

Para cada problema: **dónde** (pantalla y dirección), **qué se hizo** (pasos exactos), **qué se esperaba**, **qué pasó**, y de qué tipo es:

| Tipo | Significa |
|---|---|
| `roto` | no funciona: error, pantalla de «algo ha salido mal», botón o enlace que no hace nada o lleva a donde no debe |
| `sin-respuesta` | la acción se hace (o falla) pero la persona no recibe ningún mensaje claro, o no sabe qué hacer después |
| `confuso` | no se entiende: jerga, un paso que no se espera, una pantalla sin siguiente paso, un texto que no dice la verdad |
| `dato-incorrecto` | muestra algo equivocado, desfasado o que debería estar oculto |
| `inaccesible` | no se puede usar con teclado, en móvil, o se sale de la pantalla |
| `mejora` | funciona, pero se podría hacer más fácil (pequeño) |

Una pantalla que funciona pero hace dudar a una persona **también es un fallo**: si alguien duda dónde pulsar, es un fallo de la aplicación.

## 1. Visitante sin cuenta
**Objetivo:** curiosear y decidir si le interesa. **Datos:** los de demostración.
1. Entrar en la portada. ¿Se entiende qué es Ring España y qué puede hacer aquí en 10 segundos? ¿Hay un camino claro para crear cuenta?
2. Recorrer **cada** opción del menú (Peleadores, Ránking, Veladas, Gimnasios, Entrenadores, ¿Cómo funciona?) y volver al inicio desde cada una.
3. En «Peleadores»: usar cada filtro (nombre, nivel, provincia, disciplina, categoría), pasar de página, abrir una ficha, volver atrás.
4. En una ficha: leer el récord, el aura, los combates; abrir la velada de un combate y volver.
5. Buscar con tildes y sin ellas («pérez»/«perez»), con una palabra, con dos, con algo que no existe. ¿La búsqueda dice qué hacer cuando no hay resultados?
6. Intentar dar aura, seguir a un peleador y avisar de un error **sin cuenta**: ¿se explica qué hace falta y se puede hacerlo desde ahí sin perder el sitio?
7. Visitar `/privacidad`, el pie de página, una dirección que no existe y `/moderacion` (debe negarse con un mensaje claro).

## 2. Aficionado nuevo
**Objetivo:** hacerse una cuenta y dar aura a un peleador que vio pelear.
1. Registrarse (rol aficionado). Probar antes los errores: correo mal escrito, contraseña corta, correo ya usado. ¿Cada error dice cómo arreglarlo y conserva lo escrito?
2. Confirmar el correo con el enlace del correo (sale en `MAIL_LOG`). Probar también «Reenviar el enlace». ¿Qué se ve después? ¿Hay siguiente paso?
3. Antes de confirmar: intentar dar aura. ¿Se explica?
4. Dar aura a un combate con resultado, con y sin comentario y con «Lo vi en directo». Quitarla. Darla otra vez.
5. Intentar dar aura dos veces al mismo combate, a un combate sin resultado y a uno futuro.
6. Seguir a un peleador; ir a «Mi cuenta» → «Peleadores que sigo»; dejar de seguirlo.
7. Avisar de un error en un combate y en una ficha; ver el aviso en «Mi cuenta».
8. En «Mi cuenta»: cambiar el nombre, desactivar los avisos, cambiar la contraseña (con la actual equivocada y con la buena), descargar los datos.
9. Salir de la sesión y volver a entrar.

## 3. Peleador sin ficha
**Objetivo:** crear su ficha y registrar un combate. **Disciplinas:** probar boxeo y otra.
1. Registrarse como peleador, confirmar el correo. ¿Dónde cae después? ¿Sabe qué hacer?
2. En «Mi ficha»: buscar si ya existe una ficha suya; crearla con récord de partida (probar un récord que no suma, uno sin detallar y uno detallado).
3. Añadir una segunda disciplina. Cambiar la categoría de peso de una.
4. Registrar un combate contra un rival **sin cuenta** con resultado; ver cómo aparece (pendiente de confirmar), el récord y el aviso de lo que pasa ahora.
5. Registrar un combate **futuro** (sin resultado) y luego, cuando ya se celebró (fecha de hoy), añadir el resultado.
6. Registrar el mismo combate otra vez (duplicado), uno con un rival que se llama como otra persona ya existente (elegir entre homónimos), uno con fecha absurda y uno con un enlace de evidencia inválido.
7. Corregir los datos de la ficha (alias, ciudad, gimnasio, altura, nacimiento, presentación) con valores buenos y malos. Mirar cómo queda la ficha pública.
8. Añadir y quitar el enlace de evidencia de un combate.

## 4. El rival
**Objetivo:** reclamar su ficha y responder a un combate que otro registró. (Dos cuentas a la vez.)
1. Con la persona 3 ya hecha, crear la cuenta del rival (peleador). Buscar su ficha en «Mi ficha» (sin ficha propia) y reclamarla.
2. Con una cuenta moderadora: aprobarla (probar también rechazarla **sin** motivo y **con** motivo; ver el mensaje que recibe la persona y el correo).
3. El rival ve el combate pendiente en su ficha y lo confirma. Otro combate: lo rechaza («No es correcto»). Mirar el efecto en las dos fichas públicas, el récord y el aura.
4. La moderadora ve el combate rechazado en «en revisión» y lo restaura; otro lo verifica.
5. ¿Quién ve qué en cada estado (pendiente, confirmado, verificado, en revisión)? ¿Lo entiende cualquier persona?

## 5. Organizador
**Objetivo:** publicar una velada con su cartel y sus resultados.
1. Registrarse y pedir acceso de organizador (probar sin escribir cómo comprobarlo). La moderadora lo rechaza con motivo; el organizador ve el motivo y vuelve a pedirlo; se aprueba (anotando la evidencia).
2. Crear una velada (probar fecha mala, nombre vacío, enlace de entradas sin «https://»). Abrirla en «Mis veladas».
3. Añadir combates al cartel eligiendo peleadores de la lista (¿se distinguen los homónimos?), con y sin categoría y evidencia.
4. Intentar poner un resultado antes de que se celebre; poner la fecha de hoy y ponerlo (victoria, empate, sin decisión; forma de terminar y asalto).
5. Ver la velada pública: cartel, resultados, etiquetas de respaldo y botón de entradas.
6. Un aficionado que sigue a un peleador del cartel recibe el aviso por correo y puede darse de baja con el enlace.
7. ¿Qué pasa si se equivoca de peleador o de resultado? ¿Puede corregirlo?

## 6. Moderadora
**Objetivo:** mantener los datos fiables. **Datos:** generar actividad con las personas anteriores.
1. Entrar en `/moderacion`: ¿se entiende qué hace cada sección y cada botón? ¿Qué hace «Verificar» y qué hace «Marcar como no correcto»?
2. Combates con señales de coherencia, pendientes y en revisión: verificar, marcar como no correcto, restaurar. Mirar el efecto público.
3. Avisos de error: cerrar como corregido, cerrar sin error, rechazar el combate desde el aviso, ocultar una ficha, retirar un comentario de aura. ¿Quien avisó ve la respuesta en «Mi cuenta»?
4. Reclamaciones y organizadores: aprobar y rechazar con y sin motivo.
5. Sello de gimnasio: concederlo (sin y con nota) y retirarlo; ver el sello en el público.
6. Historial de cambios: filtrar, entender cada fila.
7. ¿Hay algo que la moderadora necesite hacer y no pueda desde la pantalla?

## 7. Cuenta y seguridad
**Objetivo:** no quedarse fuera ni dejar la cuenta en riesgo.
1. «¿Has olvidado tu contraseña?»: pedir el enlace con un correo que existe y con uno que no (mismo mensaje). Usar el enlace; usarlo otra vez; usar uno inventado.
2. Abrir sesión en dos navegadores; cambiar la contraseña en uno; ¿se cierra el otro?
3. Equivocarse varias veces al entrar: ¿cuándo avisa del bloqueo y qué dice?
4. Una cuenta sin confirmar que pide recuperar la contraseña.
5. Eliminar la cuenta: sin ficha, con ficha sin combates y con ficha con combates (¿qué queda en la ficha del rival?). Equivocarse de contraseña, no marcar la casilla.
6. Descargar los datos y comprobar que no contienen nada ajeno.
7. «Darse de baja» desde el correo de aviso.

## 8. Móvil y teclado
**Objetivo:** que se pueda usar en un móvil y sin ratón.
1. Con el navegador a 360 × 740, recorrer los flujos de las personas 2, 3 y 5. ¿Algo se sale de la pantalla, se solapa o no se puede pulsar?
2. Solo con el teclado (Tab, Mayús+Tab, Intro, Espacio, flechas): registrarse, entrar, dar aura, crear una ficha, registrar un combate, usar un desplegable. ¿Se ve dónde está el foco? ¿Se puede llegar a todo y salir de todo? ¿El orden es lógico?
3. Con el zoom del navegador al 200 % y al 400 %.

## 9. Persona mayor, poco acostumbrada a la tecnología
**Objetivo:** hacer algo sencillo sin ayuda: «quiero apuntar el combate que gané el sábado».
1. Entrar por primera vez sabiendo solo lo que dice la pantalla. Anotar **cada** momento de duda: una palabra que no entiende, un botón que no sabe si pulsar, un paso que no esperaba.
2. Hacer el camino completo (registro → correo → ficha → combate) leyendo solo la pantalla y la ayuda («¿Cómo funciona?»).
3. ¿Cada palabra técnica tiene su explicación al lado? ¿Cada error dice qué hacer? ¿Siempre hay una forma clara de volver o de pedir ayuda?
4. Equivocarse a propósito: ¿se puede deshacer? ¿se pierde lo escrito?

## 10. Exploración destructiva
**Objetivo:** romperlo. Nada debe terminar en una pantalla de error ni dejar datos a medias.
1. Textos muy largos, emojis, acentos, comillas, `<script>`, espacios al principio y al final, en **todos** los campos de texto.
2. Fechas imposibles, muy antiguas y muy futuras; números negativos, decimales y enormes.
3. Doble clic y pulsar dos veces rápido cualquier botón de acción; el botón «Atrás» del navegador después de una acción; recargar la página tras enviar un formulario.
4. Abrir en dos pestañas la misma pantalla y actuar en las dos (por ejemplo, confirmar y rechazar el mismo combate).
5. Direcciones manipuladas: `?pagina=-1`, `?pagina=abc`, parámetros repetidos, identificadores que no existen, `/peleadores/` + algo raro.
6. Entrar en pantallas de otro rol (moderación, organizador) y de otras personas (la gestión de la velada de otro organizador).
