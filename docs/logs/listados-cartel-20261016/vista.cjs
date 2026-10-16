// Banco visual temporal: componentes y CSS reales, datos ficticios y fotos sintéticas.
// No sustituye la aplicación, su hidratación ni la base de datos. No forma parte de producción.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const root = path.resolve(__dirname, '../../..');
const { TarjetaPersona, TarjetaGimnasioCartel } = require(path.join(root, 'src/app/components/TarjetasDirectorio.tsx'));
const { DirectorioNav, ChipsDisciplina } = require(path.join(root, 'src/app/components/DirectorioNav.tsx'));
const { CampoFiltro, BotonesFiltro } = require(path.join(root, 'src/app/components/Filtros.tsx'));
const e = React.createElement;
const names = ['Alejandra De Los Ángeles Montemayor Santamaría', 'Carlos', 'NombreMuyLargoSinEspaciosParaComprobarLaLecturaCompletaDelDirectorio', 'María Fernández'];
function page(url) {
  const route = url.pathname.slice(1);
  const kind = route === 'entrenadores' ? 'entrenador' : 'peleador';
  const title = route === 'gimnasios' ? 'Gimnasios' : route === 'entrenadores' ? 'Entrenadores' : 'Peleadores';
  const which = url.searchParams.get('caso') || 'mixto';
  const list = which === 'vacio' ? [] : which === 'uno' ? names.slice(0, 1) : names;
  const cards = list.map((name, i) => route === 'gimnasios'
    ? e(TarjetaGimnasioCartel, { key: i, id: i % 2 ? 'sin-foto' : 'con-foto', slug: `club-${i}`, nombre: `Club de ${name}`, ciudad: 'Villanueva de la Cañada', provincia: 'Madrid', peleadores: i, verificado: true })
    : e(TarjetaPersona, { key: i, href: `/${route}/persona-${i}`, tipo: kind, id: i % 2 ? 'sin-foto' : 'con-foto', nombre: name, disciplina: 'BOXEO', pildora: kind === 'entrenador' ? '1 clase' : 'Disponible para pelear \u00b7 70.25 kg', extra: kind === 'peleador' ? ['Amateur \u00b7 67-70 kg', '\u201cAlias de ejemplo muy largo\u201d'] : undefined, lineas: kind === 'entrenador' ? ['Boxeo · Kickboxing', 'Villanueva de la Cañada (Madrid)', 'Desde 25 €'] : ['Boxeo · Amateur (+1)', 'Villanueva de la Cañada · Club de ejemplo'] }));
  const markup = renderToStaticMarkup(e('main', { className: 'wrap' }, e('h1', null, title), e(DirectorioNav, { actual: route }), e(ChipsDisciplina, { ruta: url.pathname, conservar: {} }), e('form', { className: 'search search-directorio', role: 'search', 'aria-label': 'Filtrar directorio' }, e(CampoFiltro, { etiqueta: 'Buscar por nombre' }, e('input', { name: 'q' })), e(BotonesFiltro, { ruta: url.pathname, hayFiltros: false })), e('p', { className: 'mut' }, list.length ? `${list.length} resultados ficticios para revisión visual.` : 'Ningún resultado coincide con estos filtros.'), route === 'gimnasios' ? e('ul', { className: 'grid grid-cartel lista-cartel', 'aria-label': 'Gimnasios de prueba' }, cards.map((card, i) => e('li', { key: i }, card))) : e('div', { className: 'grid grid-cartel' }, cards)));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Banco visual</title><style>${fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8')}</style></head><body>${markup}<script>document.querySelectorAll('.tarjeta-foto img').forEach(img=>{img.addEventListener('error',()=>img.remove());if(img.complete&&!img.naturalWidth)img.remove()})</script></body></html>`;
}
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4781');
  if (url.pathname.startsWith('/brand/')) {
    const file = path.join(root, 'public', 'brand', path.basename(url.pathname));
    if (fs.existsSync(file)) { res.writeHead(200, { 'Content-Type': 'font/woff2' }); res.end(fs.readFileSync(file)); return; }
  }
  if (url.pathname.startsWith('/imagenes/')) {
    if (url.pathname.includes('sin-foto')) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800"><rect width="640" height="800" fill="#fff"/><rect x="80" y="90" width="480" height="620" rx="100" fill="#f4f2ec"/><circle cx="320" cy="210" r="110" fill="#d4f67c"/></svg>'); return;
  }
  if (!['/peleadores', '/entrenadores', '/gimnasios'].includes(url.pathname)) { res.writeHead(404); res.end(); return; }
  try { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(page(url)); } catch (error) { console.error(error.message); res.writeHead(500); res.end('Fallo del banco visual'); }
}).listen(4781, '127.0.0.1', () => console.log('Banco visual: http://127.0.0.1:4781/peleadores'));
