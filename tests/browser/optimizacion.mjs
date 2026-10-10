// Pruebas reales de componentes y CSS compartidos. No necesitan ni alteran una base de datos.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), dir=path.join(root,'test-results/optimizacion');
await mkdir(dir,{recursive:true});
const before=process.argv.includes('--antes');
await writeFile(path.join(dir,'fixture.tsx'),`
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import Pestanas from '../../src/app/components/Pestanas';
import Foto from '../../src/app/components/Foto';
function App(){const [foto,setFoto]=useState('/inexistente');return <main>
<section id="normal"><div className="titulo-seccion"><h2>Próximas veladas</h2><a href="#pruebas">Calendario</a></div>
<a className="fila" href="#pruebas"><span className="avatar avatar-relleno">A</span><span className="cuerpo"><strong className="nombre">Tu próxima cita</strong><span className="meta">Descubre tu comunidad</span></span></a></section>
<section id="pruebas"><div className="titulo-seccion"><h2>OrganizadoresInternacionalesDeDeportesDeContacto</h2><a href="#normal">Ver todas las inscripciones</a></div>
<div className="acciones-principales"><a href="#normal" className="accion-principal tarjeta"><strong>OrganizadoresInternacionalesDeDeportesDeContacto</strong><span className="meta">Una etiqueta larga</span></a><a href="#normal" className="accion-principal tarjeta">Mi ficha</a></div></section>
<Pestanas etiqueta="Prueba de secciones" pestanas={[{id:'uno',titulo:'Datos',contenido:<><label className="field">Horario<input id="horario" type="range" defaultValue="50"/></label><p>Datos deportivos</p></>},{id:'dos',titulo:'Combates',contenido:<p>Historial de combates</p>}]} />
<div id="foto"><Foto src={foto} loading="eager"/><button type="button" id="cambiar-foto" onClick={()=>setFoto('/foto.svg')}>Cambiar foto</button></div>
</main>};createRoot(document.getElementById('root')!).render(<App/>);`);
await build({entryPoints:[path.join(dir,'fixture.tsx')],outfile:path.join(dir,'bundle.js'),bundle:true,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><style>#normal{display:flex;flex-direction:column;gap:16px}#pruebas{margin:40px 0}#foto img{width:48px;height:48px}#foto,form{margin-top:24px}</style><div id="root"></div><script src="/bundle.js"></script></html>');return;}
  if(url.pathname==='/foto.svg'){res.setHeader('Content-Type','image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#D4F67C"/></svg>');return;}
  const p=url.pathname==='/style.css'?path.join(root,'src/app/globals.css'):url.pathname==='/bundle.js'?path.join(dir,'bundle.js'):url.pathname.startsWith('/brand/')?path.join(root,'public',url.pathname):null;
  if(!p){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.js')?'application/javascript':'font/woff2');res.end(await readFile(p));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
const results=[];
const check=(name,passed)=>{results.push({name,passed});console.log(passed?'OK':'FAIL',name);};
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('.pestanas-barra a').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 await page.locator('#normal').screenshot({path:path.join(dir,before?'antes.png':'despues.png')});
 for(const width of [320,360,390,430,1280]){
  await page.setViewportSize({width,height:844});
  check('Sin desbordamiento con texto largo a '+width+' px',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await page.setViewportSize({width:390,height:844});
 const gesture=async(selector,end)=>{
  await page.locator(selector).evaluate(el=>el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[new Touch({identifier:1,target:el,clientX:250,clientY:100})]})));
  await page.locator(selector).evaluate(el=>el.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,touches:[new Touch({identifier:1,target:el,clientX:40,clientY:100})]})));
  await page.waitForTimeout(40);
  await page.locator(selector).evaluate((el,end)=>el.dispatchEvent(new TouchEvent(end,{bubbles:true,touches:[]})),end);
  await page.waitForTimeout(40);
 };
 await gesture('#horario','touchend');check('Ajustar un control no cambia de sección',await page.locator('.pestanas-barra a').first().getAttribute('aria-current')==='true');
 await page.locator('.pestanas-barra a').first().click();await gesture('#uno p','touchcancel');
 check('Un gesto cancelado conserva la sección',await page.locator('.pestanas-barra a').first().getAttribute('aria-current')==='true');
 await page.locator('.pestanas-barra a').first().click();await gesture('#uno p','touchend');
 check('Deslizar contenido cambia de sección',await page.locator('.pestanas-barra a').nth(1).getAttribute('aria-current')==='true');
 await page.locator('.pestanas-barra a').nth(1).focus();await page.keyboard.press('ArrowLeft');
 check('Flechas del teclado siguen funcionando',await page.locator('.pestanas-barra a').first().getAttribute('aria-current')==='true');
 check('Los paneles permiten desplazamientos nativos y zoom',await page.locator('.pestanas-pista').evaluate(el=>getComputedStyle(el).touchAction==='auto'));
 await page.waitForFunction(()=>!document.querySelector('#foto img'));await page.locator('#cambiar-foto').click();
 await page.waitForTimeout(150);check('Una foto nueva puede cargar tras fallar la anterior',await page.locator('#foto img').count()===1&&await page.locator('#foto img').evaluate(el=>el.naturalWidth>0));
 await page.emulateMedia({reducedMotion:'reduce'});
 check('Movimiento reducido sin transiciones',await page.locator('a.fila').evaluate(el=>getComputedStyle(el).transitionDuration.split(',').every(v=>parseFloat(v)===0)));
 await writeFile(path.join(dir,before?'baseline.json':'resultado.json'),JSON.stringify(results,null,2));
 if(!before&&results.some(r=>!r.passed))process.exitCode=1;
}finally{await browser.close();await new Promise(r=>server.close(r));}
