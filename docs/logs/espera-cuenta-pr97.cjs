// Comprobación aislada de la espera de un campo tardío. No ejecuta Next, cuenta real ni base de datos.
const { chromium } = require('playwright-core');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    const css = fs.readFileSync('src/app/globals.css', 'utf8');
    await page.route('http://127.0.0.1:4781/mi-cuenta/eliminar', route => route.fulfill({ contentType: 'text/html', body: '<style>' + css + '</style><p role=alert>Error de contraseña</p><script>history.replaceState(null,"","?problema=contrasena_actual_incorrecta");setTimeout(()=>{document.body.insertAdjacentHTML("beforeend",\'<form><label class=field><input type=checkbox name=confirm required checked>Confirmar</label></form>\')},500)</script>' }));
    await page.goto('http://127.0.0.1:4781/mi-cuenta/eliminar');
    if (await page.locator('input[name=confirm]').count()) throw Error('El campo ya estaba presente: el caso no prueba la espera.');
    await page.waitForURL(u => u.pathname === '/mi-cuenta/eliminar' && u.searchParams.get('problema') === 'contrasena_actual_incorrecta');
    const campo = page.locator('input[name=confirm]');
    await campo.uncheck();
    await campo.evaluate(el => el.removeAttribute('required'));
    if (await campo.isChecked() || await campo.getAttribute('required') !== null) throw Error('Estado incorrecto.');
    console.log('Correcto: espera un campo ausente al aparecer el aviso, lo desmarca y retira required. Fixture sintético, sin validación de servidor.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
