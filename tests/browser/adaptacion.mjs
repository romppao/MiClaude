// Comprueba adaptación real de la página completa, sin depender de la marca del dispositivo.
import {chromium} from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://localhost:3137';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Solo se admite servidor local de pruebas.');
const dir='test-results/adaptacion';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
const results=[];const check=(name,passed,detail)=>{results.push({name,passed,detail});console.log(passed?'OK':'FAIL',name,detail??'');};
try{
 const context=await browser.newContext();const page=await context.newPage();
 for(const width of [320,390,844,1024,1440,2560]){
  await page.setViewportSize({width,height:900});
  for(const route of ['/bienvenida','/','/entrar','/registro','/noticias','/peleadores','/veladas','/clases']){
   await page.goto(base+route);await page.locator('main').waitFor();
   check(`Sin desbordamiento ${route}, ${width}px`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(route==='/bienvenida'){
    check('Bienvenida sin objetos flotantes a '+width,await page.locator('main canvas, .bienvenida-arena, main .gpu-surface').count()===0);
    check('Acción de empezar disponible a '+width,await page.getByRole('link',{name:'Empezar',exact:true}).isVisible());
   }
   if(route==='/'&&width>=1024){
    const layout=await page.locator('.inicio-adaptable').evaluate(el=>({width:el.getBoundingClientRect().width,columns:getComputedStyle(el).gridTemplateColumns.split(' ').length}));
    check('Inicio aprovecha el escritorio a '+width,layout.width>width*.7||layout.width>=1180,layout);
    check('Inicio organiza contenido en dos columnas a '+width,layout.columns===2);
   }
   if(route==='/entrar'&&width>=768)check('Formulario con ancho de lectura a '+width,await page.locator('.pantalla-formulario').evaluate(el=>el.getBoundingClientRect().width<=641));
   if([390,1440].includes(width)&&['/bienvenida','/'].includes(route))await page.screenshot({path:`${dir}/${route==='/'?'inicio':'bienvenida'}-${width}.png`,fullPage:true});
  }
 }
 await page.setViewportSize({width:1440,height:900});await page.goto(base+'/bienvenida');
 check('Bienvenida accesible en escritorio',(await new AxeBuilder({page}).analyze()).violations.filter(v=>['serious','critical'].includes(v.impact)).length===0);
 await page.goto(base+'/');check('Inicio accesible en escritorio',(await new AxeBuilder({page}).analyze()).violations.filter(v=>['serious','critical'].includes(v.impact)).length===0);
}finally{await browser.close();await writeFile(dir+'/resultados.json',JSON.stringify(results,null,2));}
if(results.some(r=>!r.passed))process.exitCode=1;
