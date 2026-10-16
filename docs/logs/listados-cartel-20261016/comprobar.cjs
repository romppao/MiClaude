// Inspección visual acotada del HTML de componentes reales. No ejecuta flujos de la aplicación.
const { chromium } = require('playwright-core');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const results = [];
  const failures = [];
  try {
    for (const width of [375, 1280]) for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({ viewport: { width, height: 920 }, colorScheme: theme, reducedMotion: 'reduce' });
      const page = await context.newPage();
      for (const route of ['peleadores', 'entrenadores', 'gimnasios']) {
        const name = `${route}-${width}-${theme}`;
        await page.goto(`http://127.0.0.1:4781/${route}`);
        await page.evaluate(() => document.fonts.ready);
        await page.locator('.card img').first().waitFor({ state: 'visible' });
        const measures = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          cards: [...document.querySelectorAll('.card')].map(card => ({
            height: card.getBoundingClientRect().height,
            clipped: [...card.querySelectorAll('.abajo>*')].some(text => text.getBoundingClientRect().bottom > card.getBoundingClientRect().bottom + 1 || text.scrollWidth > text.clientWidth + 1),
            small: [...card.querySelectorAll('.abajo>*,.pildora')].some(text => parseFloat(getComputedStyle(text).fontSize) < 16),
          })),
          extra: [...document.querySelectorAll('.cartel-extra')].map(el => getComputedStyle(el).display),
          targets: [...document.querySelectorAll('.directorio-nav>a,.filtros-disciplina>a')].map(a => a.getBoundingClientRect().height),
        }));
        const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        const record = { name, measures, violations: audit.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) })) };
        results.push(record);
        if (measures.extra.some(display => width < 640 ? display !== 'none' : display === 'none') || measures.targets.length < 9 || measures.overflow || measures.cards.some(c => c.clipped || c.small) || measures.targets.some(h => h < 44) || record.violations.length) failures.push(record);
        await page.screenshot({ path: path.join(__dirname, `${name}.png`), fullPage: true });
        for (const [caso, count] of [['uno', 1], ['vacio', 0]]) {
          await page.goto(`http://127.0.0.1:4781/${route}?caso=${caso}`);
          if (await page.locator('.card').count() !== count) failures.push({ name, caso, issue: 'Cantidad inesperada de tarjetas' });
          if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push({ name, caso, issue: 'Desbordamiento' });
        }
      }
      await context.close();
    }
    fs.writeFileSync(path.join(__dirname, 'resultado.json'), JSON.stringify({ fecha: new Date().toISOString(), alcance: 'Componentes reales con datos ficticios, sin base ni hidratación Next', cases: results.length * 3, results, failures }, null, 2));
    console.log(JSON.stringify({ cases: results.length * 3, failures }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
