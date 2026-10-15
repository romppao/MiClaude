# Dominio lonaclub.es: protección, cambios y cómo deshacerlos

> **Petición del fundador (15-10-2026):** «Con esto ten muchísimo cuidado, porque a lo mejor me roban el dominio. No sería la primera vez que me pasa… Ten mucho cuidado en caso de que vayas a borrar algo, y documéntalo al pie de la letra, explicando el porqué, el cómo, dónde, todo. Porque luego, en caso de que quieras reparar ese error, lo quiero hacer fácil y rápido… he invertido dinero ahí.»
>
> **Regla para todos los asistentes:** ningún asistente toca el dominio, la zona DNS ni la cuenta de Infomaniak. Solo el fundador, con estos pasos delante. Si un asistente propone un cambio, primero lo escribe aquí (qué, por qué, dónde y cómo deshacerlo) y el fundador decide.

## 1. Qué protege el dominio y qué no

Para quedarse con el dominio, alguien tendría que **entrar en la cuenta de Infomaniak**, **transferirlo** a otro registrador o **esperar a que caduque**. Cambiar o borrar los registros DNS no lo pone en riesgo: el dominio sigue siendo del fundador en Infomaniak aunque la zona DNS esté vacía.

Lo que de verdad lo protege, y conviene comprobar ya en Infomaniak:

| Protección | Dónde | Por qué |
|---|---|---|
| **Renovación automática activada** y tarjeta en vigor | Infomaniak → Dominios → lonaclub.es | Un dominio caducado se puede liberar y lo compra otro. Es la causa más habitual de perderlos. |
| **Fecha de caducidad** apuntada | La misma pantalla | Para renovar con tiempo aunque falle la automática. |
| **Bloqueo de transferencia** activado («Transfer lock» o «Verrouillage») | Infomaniak → Dominios → lonaclub.es → Seguridad | Impide que se lo lleven a otro registrador sin tu permiso. |
| **Verificación en dos pasos** en la cuenta de Infomaniak | Infomaniak → Mi perfil → Seguridad | Si alguien consigue la contraseña, sin el segundo paso no entra. |
| **Correo de la cuenta** al que tú siempre tengas acceso | Infomaniak → Mi perfil | Las alertas de caducidad y de transferencia llegan ahí. |

## 2. Estado actual (15-10-2026)

| Registro | Tipo | Valor | Para qué |
|---|---|---|---|
| `lonaclub.es` | A | `216.24.57.1` | Lleva la web a la demo de Render. Puesto el 14-10-2026 como apaño provisional. |
| `www.lonaclub.es` | CNAME | `ring-espana-demo.onrender.com` | Igual, para www. |
| MX, TXT `v=spf1…`, `_dmarc` | MX y TXT | Los de Infomaniak | El buzón info@lonaclub.es. **No tocar nunca.** |
| TXT de verificación (Google, Search Console) | TXT | Los que haya | Prueban a Google que el dominio es tuyo. **No tocar.** |

**Antes de cambiar nada:** haz una captura de pantalla de toda la zona DNS en Infomaniak y guárdala. Es la copia para deshacer cualquier cosa.

## 3. Separar lonaclub.es de la demo, en el orden seguro

**Por qué:** el fundador no quiere que quien busque «Lona» llegue a la demo con su aviso (15-10-2026). La demo seguirá en https://ring-espana-demo.onrender.com/.

**Por qué este orden:** primero se quita el DNS y después el dominio en Render.
- Si se hiciera al revés, durante un rato lonaclub.es seguiría apuntando a Render sin ningún servicio que lo reclame.
- En los alojamientos compartidos, un registro que apunta a un servicio que ya no lo reclama puede aprovecharlo otra persona para mostrar su web en tu dirección. No se llevaría el dominio, pero sí su tráfico.
- Quitando primero el DNS, ese hueco no existe.

1. **Captura de la zona DNS** (sección 2).
2. **Infomaniak → zona DNS de lonaclub.es:**
   - borrar el registro **A** de `lonaclub.es` con valor `216.24.57.1`;
   - borrar el registro **CNAME** de `www` con valor `ring-espana-demo.onrender.com`;
   - **no tocar** MX, SPF (TXT `v=spf1`), `_dmarc` ni los TXT de verificación.
3. **Comprobar** pasados unos minutos (puede tardar hasta unas horas):
   - lonaclub.es ya no abre la demo (el navegador dirá que no encuentra la página);
   - el correo info@lonaclub.es sigue funcionando: envíate un correo de prueba.
4. **Render → servicio `ring-espana-demo` → Settings → Custom Domains:** borrar `lonaclub.es` y `www.lonaclub.es`.
5. **Apuntar aquí** la fecha y quién lo hizo (sección 5).

## 4. Cómo deshacerlo (volver a como estaba el 14-10-2026)

Si algo sale mal (por ejemplo, deja de llegar el correo), se vuelve atrás en el orden contrario.

1. **Correo:** si se borró por error un MX, SPF o `_dmarc`, se restauran desde la captura o con la plantilla de correo de Infomaniak (Infomaniak → zona DNS → «Restaurar la configuración de Mail»). Es lo primero, porque sin ellos no llegan correos.
2. **Web en la demo**, solo si de verdad se quiere volver a enseñar la demo en lonaclub.es:
   - en Render → `ring-espana-demo` → Settings → Custom Domains, añadir `lonaclub.es` y `www.lonaclub.es`;
   - en Infomaniak → zona DNS, crear el registro **A** `lonaclub.es` → `216.24.57.1` y el registro **CNAME** `www` → `ring-espana-demo.onrender.com`;
   - esperar a que Render marque los dos dominios como verificados (con certificado).

## 5. Registro de cambios en el dominio

| Fecha | Quién | Qué | Por qué |
|---|---|---|---|
| 14-10-2026 | Claude (sesión del 14) | Pidió apuntar lonaclub.es a la demo de Render (A y CNAME) | Apaño provisional hasta montar la versión real. Fue un error: el fundador no lo quería (LECCIONES.md). |
| 15-10-2026 | Claude (nube) | No cambia nada. Corrige el orden de los pasos: primero el DNS y luego Render | Evitar el hueco de un dominio que apunta a un servicio que no lo reclama. |

## 6. Cuando se monte la versión real

Los registros que pida Google Cloud Run (A/AAAA y CNAME) se ponen **antes** de quitar nada que funcione. Se hace con este documento delante y se apunta en la sección 5.
