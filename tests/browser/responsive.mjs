// Regresión de componentes reales con fixtures aislados: no escribe ni necesita PostgreSQL.
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.BASE_URL || 'http://127.0.0.1:3139';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Solo pruebas locales');
const dir = 'test-results/responsive'; await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const results = []; const check = (name, passed, details) => results.push({ name, passed, details });
try {
  const context = await browser.newContext({ hasTouch: true }); const page = await context.newPage();
  await page.route('**/imagenes/peleador/revision-*', route => route.fulfill({ status: 404, body: '' }));
  for (const tema of ['dark', 'light']) {
  await page.emulateMedia({ colorScheme: tema });
  for (const width of [320, 390, 650, 768, 1024, 1280, 1440, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    for (const data of ['demo', 'extremo', 'vacio', 'uno']) {
      await page.goto(`${base}/revision-ui?data=${data}`, { waitUntil: 'domcontentloaded' });
      await page.locator('#titulo-portada').waitFor(); await page.evaluate(() => document.fonts.ready);
      await page.locator('.menu-open').waitFor({ state: 'visible' });
      await page.waitForFunction(() => !document.querySelector('.menu-open').disabled);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        clipped: [...document.querySelectorAll('.cartel,.mini-peleador,.noticia-destacada')].filter(e => e.scrollHeight > e.clientHeight + 2).map(e => e.className),
        header: [...document.querySelectorAll('header a,header button')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < 0); }).map(e => e.textContent),
      }));
      check(`${tema} ${width}px ${data}: ancho y recortes`, !metrics.overflow && !metrics.clipped.length && !metrics.header.length, metrics);
      if (width === 320) check('Cabecera móvil en una fila', await page.evaluate(() => Math.abs(document.querySelector('.logo').getBoundingClientRect().top - document.querySelector('.menu-open').getBoundingClientRect().top) < 20));
      if (width >= 1024 && data === 'demo') check('Todas las noticias visibles en escritorio', await page.locator('.fila-noticias>li:visible').count() === 12);
      if ([390, 1440].includes(width) && ['demo', 'extremo'].includes(data)) await page.screenshot({ path: `${dir}/lona-${tema}-${width}-${data}.png`, fullPage: true });
    }
  }
  }
  for (const tema of ['dark', 'light']) {
  await page.emulateMedia({ colorScheme: tema });
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(base + '/revision-ui?data=extremo&vista=comun');
    check(`Portada común ${width}px sin desbordamiento`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const a11y = await new AxeBuilder({ page }).analyze();
    check(`Accesibilidad ${tema} ${width}px`, a11y.violations.filter(v => ['serious', 'critical'].includes(v.impact)).length === 0, a11y.violations.map(v => ({ id: v.id, impact: v.impact })));
  }
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + '/revision-ui');
  await page.locator('.menu-open').tap(); check('Menú táctil abre', await page.locator('dialog[open]').isVisible());
  await page.keyboard.press('Escape'); check('Escape cierra menú', await page.locator('dialog[open]').count() === 0);
  await page.locator('.menu-open').tap();
  await page.locator('label').filter({ has: page.locator('input[name="tema"][value="oscuro"]') }).tap();
  check('Tema oscuro elegido en menú', await page.evaluate(() => document.documentElement.dataset.tema === 'oscuro'));
  await page.reload();
  check('Tema elegido persiste', await page.evaluate(() => document.documentElement.dataset.tema === 'oscuro'));
  await page.evaluate(() => { localStorage.removeItem('lona:tema'); delete document.documentElement.dataset.tema; });
  await page.locator('.disciplinas-portada').evaluate(e => e.scrollLeft = 150);
  check('Disciplinas permiten desplazamiento', await page.locator('.disciplinas-portada').evaluate(e => e.scrollLeft > 0));
  await page.goto(base + '/revision-ui?data=extremo');
  // Cada foto es lazy: hay que acercar cada tarjeta a la vista antes de exigir su fallback.
  for (const tarjeta of await page.locator('.mini-peleador').all()) {
    await tarjeta.scrollIntoViewIfNeeded();
    await tarjeta.locator('img').waitFor({ state: 'hidden' });
  }
  check('Foto ausente deja iniciales', await page.locator('.mini-peleador img').count() === 0);
  check('Iniciales con emoji completas', await page.locator('.mini-peleador .iniciales').last().textContent() === '🦊F');
  // Espacio CSS equivalente a ampliar al 200% una ventana de 1440 px; no certifica zoom nativo.
  await page.setViewportSize({ width: 720, height: 450 }); await page.goto(base + '/revision-ui?data=extremo');
  check('Espacio equivalente a zoom 200%', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.goto(base + '/revision-ui?data=mil');
  check('Mil elementos sin desbordamiento de página', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  check('Mil veladas renderizadas', await page.locator('.cartel').count() === 1000);
  for (const path of ['/bienvenida', '/entrar', '/registro', '/ayuda']) {
    const response = await page.goto(base + path); check(`Pantalla real ${path} responde`, response.status() === 200);
    check(`Pantalla real ${path} sin desbordamiento`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
} finally { await browser.close(); await writeFile(dir + '/after.json', JSON.stringify(results, null, 2)); }
const failures = results.filter(r => !r.passed); console.log(JSON.stringify({ checks: results.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
