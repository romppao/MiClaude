// Verifica la experiencia completa contra una instancia local con datos ficticios.
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.BASE_URL||'http://localhost:3137';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Esta prueba solo admite una instancia local.');
const dir='test-results/experiencia';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
const results=[],errors=[];
const check=(name,passed,detail)=>{results.push({name,passed,detail});console.log(passed?'OK':'FAIL',name,detail??'');};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/laboratorio');await page.getByRole('button',{name:'Probar reconocimiento',exact:true}).waitFor();await page.waitForTimeout(1800);
 await page.screenshot({path:dir+'/escritorio.png',fullPage:true});
 check('Ring disponible con o sin aceleración',await page.locator('.arena-3d canvas').count()===1||await page.locator('.gpu-arena .arena-fallback').isVisible(),{canvas:await page.locator('.arena-3d canvas').count()});
 check('Sin incidencias graves de accesibilidad en laboratorio',(await new AxeBuilder({page}).analyze()).violations.filter(v=>['serious','critical'].includes(v.impact)).length===0);
 await page.getByRole('button',{name:'Probar reconocimiento',exact:true}).click();
 check('Aura actualizada y aviso legible',await page.locator('.grande').innerText()==='129'&&await page.getByText('Actuación reconocida',{exact:true}).isVisible());
 await page.getByRole('button',{name:'Medalla',exact:true}).click();await page.waitForTimeout(500);
 check('Medalla disponible con o sin aceleración',await page.locator('.arena-3d canvas').count()===1||await page.locator('.gpu-medal .arena-fallback').isVisible(),{canvas:await page.locator('.arena-3d canvas').count()});
 await page.screenshot({path:dir+'/medalla.png',fullPage:true});
 await page.getByRole('button',{name:'Probar sin GPU',exact:true}).click();
 check('Alternativa sin GPU utilizable',await page.getByText('Tu comunidad sigue aquí.',{exact:true}).isVisible());
 await page.getByRole('button',{name:'Activar GPU',exact:true}).click();
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const mode of ['worst','empty','one']){
   await page.goto(base+'/laboratorio?data='+mode);await page.waitForTimeout(500);
   check(`Sin desbordamiento: ${mode}, ${width}px`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
 }
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/laboratorio?data=worst');await page.waitForTimeout(1000);
 await page.screenshot({path:dir+'/movil-extremo.png',fullPage:true});
 await context.setOffline(true);await page.getByText('Sin conexión',{exact:true}).waitFor();check('Aviso de desconexión',true);
 await context.setOffline(false);await page.getByText('Conexión recuperada',{exact:true}).waitFor();check('Aviso de reconexión',true);
 for(const route of ['/bienvenida','/','/peleadores','/veladas']){
  await page.goto(base+route);await page.waitForTimeout(900);
  check('Pantalla móvil sin desbordamiento: '+route,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(route==='/bienvenida')await page.screenshot({path:dir+'/bienvenida.png',fullPage:true});
 }
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),quiet=await reduced.newPage();
 await quiet.goto(base+'/laboratorio');await quiet.waitForTimeout(1000);
 check('Movimiento reducido sin canvas decorativos',await quiet.locator('canvas').count()===0);
 check('Contenido disponible con movimiento reducido',await quiet.getByRole('button',{name:'Probar reconocimiento',exact:true}).isVisible());
 await reduced.close();
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/laboratorio');await page.waitForTimeout(2000);
 const frames=await page.evaluate(()=>new Promise(resolve=>{const times=[];let previous=performance.now(),start=previous;function tick(now){times.push(now-previous);previous=now;if(now-start<5000)requestAnimationFrame(tick);else{times.sort((a,b)=>a-b);resolve({samples:times.length,median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],over25ms:times.filter(t=>t>25).length,drawCalls:document.querySelector('.arena-3d')?.dataset.drawCalls??null});}}requestAnimationFrame(tick);}));
 check('Cadencia medida en navegador local',true,frames);
 check('Sin errores JavaScript',errors.length===0,errors);
}finally{await browser.close();await writeFile(dir+'/resultados.json',JSON.stringify(results,null,2));}
if(results.some(r=>!r.passed))process.exitCode=1;
