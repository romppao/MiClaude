export const meta = {
  name: 'qa-funcional-por-personas',
  description: 'Prueba funcional en navegador real: 10 personas recorren la aplicación en entornos aislados y anotan todo lo roto, confuso o sin respuesta',
  phases: [{ title: 'Recorrer' }],
}

// Tanda de pruebas por personas (flujo de agentes de Claude Code). Cada persona de docs/pruebas/personas.md recorre la aplicación en un
// navegador real, en su propio entorno aislado, y devuelve sus hallazgos con pasos exactos.
//
// Cómo usarlo (ver docs/DESARROLLO.md, «Cómo se prueba»):
//   1. Compila una copia de la versión a probar (los agentes NO deben tocar el repositorio de trabajo):
//        git worktree add --detach /tmp/qa-app HEAD && ln -s "$PWD/node_modules" /tmp/qa-app/node_modules && (cd /tmp/qa-app && npm run build)
//   2. Lanza una tanda con las personas que quieras (conviene 4–5 a la vez: cada una tarda unos 15 minutos y gasta bastante cuota de uso):
//        Workflow({ scriptPath: "docs/pruebas/qa-por-personas.workflow.js", args: { ids: ["aficionado", "peleador"] } })
//   3. Lo que devuelven NO está verificado por terceros: cada hallazgo se reproduce antes de corregirlo y se anota en docs/pruebas/hallazgos-<fecha>.md.
const TODAS = [
  { n: 1, id: 'visitante', puerto: 4201, titulo: 'Visitante sin cuenta' },
  { n: 2, id: 'aficionado', puerto: 4202, titulo: 'Aficionado nuevo' },
  { n: 3, id: 'peleador', puerto: 4203, titulo: 'Peleador sin ficha' },
  { n: 4, id: 'rival', puerto: 4204, titulo: 'El rival' },
  { n: 5, id: 'organizador', puerto: 4205, titulo: 'Organizador' },
  { n: 6, id: 'moderadora', puerto: 4206, titulo: 'Moderadora' },
  { n: 7, id: 'seguridad', puerto: 4207, titulo: 'Cuenta y seguridad' },
  { n: 8, id: 'movil', puerto: 4208, titulo: 'Móvil y teclado' },
  { n: 9, id: 'mayor', puerto: 4209, titulo: 'Persona mayor, poco acostumbrada a la tecnología' },
  { n: 10, id: 'destructiva', puerto: 4210, titulo: 'Exploración destructiva' },
]

const HALLAZGOS = {
  type: 'object',
  properties: {
    persona: { type: 'string' },
    objetivo_cumplido: { type: 'boolean' },
    resumen: { type: 'string' },
    lo_que_funciona_bien: { type: 'array', items: { type: 'string' } },
    hallazgos: { type: 'array', items: { type: 'object', properties: {
      titulo: { type: 'string' },
      tipo: { type: 'string', enum: ['roto', 'sin-respuesta', 'confuso', 'dato-incorrecto', 'inaccesible', 'mejora'] },
      severidad: { type: 'string', enum: ['alta', 'media', 'baja'] },
      pantalla: { type: 'string' },
      pasos: { type: 'string' },
      esperado: { type: 'string' },
      ocurrido: { type: 'string' },
      evidencia: { type: 'string' },
      sugerencia: { type: 'string' },
    }, required: ['titulo', 'tipo', 'severidad', 'pantalla', 'pasos', 'esperado', 'ocurrido'] } },
  },
  required: ['persona', 'objetivo_cumplido', 'resumen', 'hallazgos'],
}

const prompt = (p) => `Eres una persona de pruebas de la aplicación «Ring España» (comunidad de deportes de contacto: fichas de peleadores, récords, aura del público, veladas, gimnasios). Tu persona: «${p.titulo}» (sección ${p.n} del guion).

LEE PRIMERO, en /home/user/MiClaude: CLAUDE.md (reglas del fundador: la aplicación debe entenderse sin ayuda por cualquiera, con mensajes claros, nada de botones muertos ni pantallas mudas; todo en español) y docs/pruebas/personas.md (tu guion: sección ${p.n}, y la tabla «Qué se anota siempre»). Haz TODOS los pasos de tu sección, y los que se te ocurran como esa persona real. El fundador quiere funcionalidad perfecta: busca fallos, botones que no hacen lo que dicen, enlaces rotos, pantallas sin siguiente paso, mensajes que no ayudan, datos equivocados, cosas que una persona real no entendería.

ENTORNO (aislado; el tuyo, nadie más lo usa). La aplicación ya está compilada en /tmp/qa-app. Arráncalo así (en una sola orden de Bash, con timeout largo):
  cd /home/user/MiClaude && RAIZ_APP=/tmp/qa-app scripts/entorno-aislado.sh iniciar qa_${p.id} ${p.puerto} --semilla
Imprime una línea «export BASE_URL=… DATABASE_URL=… MAIL_LOG=…»: usa esos valores. La base ya trae datos ficticios de demostración (peleadores, veladas, combates, un gimnasio verificado). Al terminar (¡siempre, aunque falle algo!) ejecuta: cd /home/user/MiClaude && scripts/entorno-aislado.sh parar qa_${p.id}

CÓMO PROBAR EN NAVEGADOR REAL: escribe tus scripts de Node (ESM, .mjs) en /tmp/qa-${p.id}/ (carpeta tuya) y ejecútalos con \`node\`. Usa Playwright: \`import { chromium } from "/home/user/MiClaude/node_modules/playwright-core/index.mjs"\` con \`executablePath: "/opt/pw-browsers/chromium"\` y \`args: ["--no-sandbox"]\`. Puedes reutilizar las ayudas de /home/user/MiClaude/tests/e2e/ayudas.mjs (importarlas lanza un navegador; necesitan las variables BASE_URL, DATABASE_URL y MAIL_LOG exportadas; tienes newUser(nombre, rol, verificar), registrar(...), hacerAdmin(correo), esperarEnlace/esperarCorreo(...) para leer los correos del MAIL_LOG, seen(), btn()…). Lee ese fichero para ver qué hay. Para hacer moderadora a una cuenta usa hacerAdmin. Haz capturas de pantalla (page.screenshot({path, fullPage:true})) en tu carpeta y MÍRALAS con la herramienta Read (puede leer imágenes) cada vez que dudes de cómo se ve o se entiende una pantalla; vuelca también el texto visible (innerText) y los errores de la consola (page.on('console'/'pageerror'/'requestfailed')). Actúa SOLO a través de la interfaz como lo haría la persona (clics, escribir, teclado); no entres a la base de datos para arreglar nada ni uses atajos que una persona no tendría (salvo hacerAdmin y leer el MAIL_LOG, que equivalen al correo y a la designación por el fundador).

REGLAS: SOLO LECTURA sobre el repositorio (no modifiques ficheros de /home/user/MiClaude; tus scripts y capturas van en /tmp/qa-${p.id}). No toques entornos de otras personas. Un hallazgo debe ser REAL y REPRODUCIBLE: comprueba cada uno una segunda vez antes de anotarlo y describe los pasos exactos. No anotes preferencias de estilo visual (colores, tipografías): el diseño está aplazado a propósito. Sí anota todo lo de claridad, lenguaje, mensajes, flujos, funcionamiento y accesibilidad. Si algo funciona bien, apúntalo brevemente en lo_que_funciona_bien. Responde en español.

Devuelve el resultado con el esquema indicado: objetivo_cumplido (¿pudo la persona lograr lo que quería sin ayuda?), un resumen honesto y la lista de hallazgos con pasos exactos, lo esperado, lo ocurrido, la evidencia (ruta de captura o fragmento de log) y una sugerencia concreta.`

const PERSONAS = TODAS.filter((p) => (args?.ids ?? []).includes(p.id))
log(`Personas de esta tanda: ${PERSONAS.map((p) => p.id).join(', ')}`)
phase('Recorrer')
const resultados = await parallel(PERSONAS.map((p) => () =>
  agent(prompt(p), { label: 'persona:' + p.id, phase: 'Recorrer', schema: HALLAZGOS }),
))
const validos = resultados.filter(Boolean)
const fallidas = PERSONAS.filter((p, i) => !resultados[i]).map((p) => p.id)
return { personas: validos, fallidas }
