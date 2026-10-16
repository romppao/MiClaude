// Panel en vivo de la flota (mod pedido por el fundador el 16-10-2026): el diagrama del flujo Claude + Codex con cada modelo,
// el paso que está trabajando ahora, cuánto lleva, el veredicto de la revisión y el historial. Lee ~/.lona-flota/estado.json
// (lo escribe scripts/flota.mjs) y se refresca solo cada dos segundos. Solo escucha en este equipo (127.0.0.1).
// Uso: node scripts/flota-panel.mjs [puerto]   → abre http://localhost:4777
import { createServer } from "node:http";
import { leerEstado } from "./flota-estado.mjs";

const PUERTO = Number(process.argv[2] ?? process.env.FLOTA_PANEL_PUERTO ?? 4777);

const PAGINA = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Flota de Lona</title>
<style>
:root{--fondo:#0b0d10;--rejilla:#1a1e24;--texto:#e8e6e1;--mut:#8b9099;--opus:#ff9d4d;--sol:#ffd84d;--puertas:#4de08a;--luna:#5cc8ff;--astra:#c08bff}
*{box-sizing:border-box}body{margin:0;background:var(--fondo);color:var(--texto);font:15px/1.45 ui-monospace,"Cascadia Mono",Consolas,monospace;
background-image:linear-gradient(var(--rejilla) 1px,transparent 1px),linear-gradient(90deg,var(--rejilla) 1px,transparent 1px);background-size:28px 28px}
main{max-width:1180px;margin:0 auto;padding:24px 16px 40px}
h1{font-size:20px;margin:0 0 4px;letter-spacing:.04em}.sub{color:var(--mut);margin:0 0 22px}
.diagrama{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-areas:"plan ejecutar puertas" "decision revision critica";gap:44px 56px;position:relative}
.caja{border:2px solid var(--c);border-radius:14px;padding:14px 16px;background:#0f1216;box-shadow:0 0 0 rgba(0,0,0,0);transition:box-shadow .3s,opacity .3s;opacity:.55;position:relative}
.caja h2{margin:0 0 6px;font-size:15px;color:var(--c);letter-spacing:.03em}.caja p{margin:0;color:var(--mut);font-size:13px}
.caja .estado{position:absolute;top:10px;right:12px;font-size:12px;color:var(--mut)}
.caja.activo{opacity:1;box-shadow:0 0 22px var(--c),inset 0 0 18px color-mix(in srgb,var(--c) 25%,transparent);animation:latido 1.6s ease-in-out infinite}
.caja.hecho{opacity:.95}.caja.fallo{opacity:1;border-style:dashed}
.caja .reloj{display:block;margin-top:8px;color:var(--c);font-size:13px}
@keyframes latido{50%{box-shadow:0 0 34px var(--c),inset 0 0 26px color-mix(in srgb,var(--c) 35%,transparent)}}
@media (prefers-reduced-motion:reduce){.caja.activo{animation:none}}
.etiqueta{position:absolute;font-size:12px;color:var(--mut)}
.pie{margin-top:28px;display:grid;grid-template-columns:1.2fr 1fr;gap:24px}
.bloque{border:1px solid #2a2f37;border-radius:12px;padding:12px 14px;background:#0f1216}
.bloque h3{margin:0 0 8px;font-size:13px;color:var(--mut);text-transform:uppercase;letter-spacing:.08em}
ol{margin:0;padding-left:18px;max-height:260px;overflow:auto}li{margin:2px 0;font-size:13px}
.hallazgo{font-size:13px;margin:4px 0}.alta{color:#ff6b6b}.media{color:var(--sol)}.baja{color:var(--mut)}
@media (max-width:820px){.diagrama{grid-template-columns:1fr;grid-template-areas:"plan" "ejecutar" "puertas" "revision" "critica" "decision";gap:16px}.pie{grid-template-columns:1fr}}
</style></head><body><main>
<h1 id="titulo">Flota de Lona</h1><p class="sub" id="sub">Esperando una tarea…</p>
<section class="diagrama" aria-label="Flujo de la flota">
 <div class="caja" id="c-plan" style="grid-area:plan;--c:var(--opus)"><span class="estado"></span><h2>CLAUDE · arquitecto</h2><p>Planifica la tarea y escribe la ficha T-xxx.md</p><span class="reloj"></span></div>
 <div class="caja" id="c-ejecutar" style="grid-area:ejecutar;--c:var(--sol)"><span class="estado"></span><h2>CODEX SOL · ejecutor</h2><p>Implementa y prueba en su propia copia (sin guardar)</p><span class="reloj"></span></div>
 <div class="caja" id="c-puertas" style="grid-area:puertas;--c:var(--puertas)"><span class="estado"></span><h2>COMPROBACIONES</h2><p>Tipos · pruebas · catálogo · mapa · aprobado</p><span class="reloj"></span></div>
 <div class="caja" id="c-revision" style="grid-area:revision;--c:var(--luna)"><span class="estado"></span><h2>CODEX LUNA · revisión</h2><p>Revisión habitual, solo lectura, veredicto JSON</p><span class="reloj"></span></div>
 <div class="caja" id="c-critica" style="grid-area:critica;--c:var(--astra)"><span class="estado"></span><h2>CODEX ASTRA · crítica</h2><p>Dinero · permisos · datos personales · secretos</p><span class="reloj"></span></div>
 <div class="caja" id="c-decision" style="grid-area:decision;--c:var(--opus)"><span class="estado"></span><h2>CLAUDE · decide</h2><p>Verifica cada hallazgo: aprobar, otra ronda (máx. 3) o rechazar</p><span class="reloj"></span></div>
</section>
<section class="pie">
 <div class="bloque"><h3>Qué ha pasado</h3><ol id="historial"></ol></div>
 <div class="bloque"><h3>Veredicto de la revisión</h3><div id="veredicto">—</div></div>
</section>
</main>
<script>
const NOMBRES={plan:"Planifica",ejecutar:"Ejecuta",puertas:"Comprobaciones",revision:"Revisa",decision:"Decide"};
const ICONO={activo:"▶ trabajando",hecho:"✓ hecho",fallo:"✘ falló",omitido:"– omitido",pendiente:"○ en espera"};
const reloj=ms=>{const s=Math.max(0,Math.round(ms/1000));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const hora=t=>new Date(t).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function pintar(e){
 if(!e){document.getElementById("sub").textContent="Sin tareas todavía. Cuando Claude lance la flota, aquí se verá cada paso.";return}
 document.getElementById("titulo").textContent="Flota de Lona · "+e.tarea+(e.titulo?" — "+e.titulo:"");
 document.getElementById("sub").textContent="Ronda "+e.ronda+" de "+(e.rondasMax||3)+" · riesgo "+(e.riesgo==="critico"?"CRÍTICO (revisa Astra)":"normal (revisa Luna)")+" · complejidad "+(e.complejidad||"normal")+" · actualizado "+hora(e.actualizado);
 const critico=e.riesgo==="critico";
 for(const id of ["plan","ejecutar","puertas","revision","decision"]){
  const p=(e.pasos||{})[id]||{estado:"pendiente"};
  const caja=document.getElementById(id==="revision"&&critico?"c-critica":"c-"+id);
  caja.className="caja "+(p.estado||"pendiente");
  caja.querySelector(".estado").textContent=ICONO[p.estado]||"";
  const r=caja.querySelector(".reloj");
  r.textContent=p.estado==="activo"&&p.desde?"⏱ "+reloj(Date.now()-p.desde)+" · "+(p.quien||""):p.hasta&&p.desde?"duró "+reloj(p.hasta-p.desde)+(p.nota?" · "+p.nota:""):(p.nota||"");
 }
 const otra=document.getElementById(critico?"c-revision":"c-critica");otra.className="caja omitido";otra.querySelector(".estado").textContent="no se usa en esta tarea";otra.querySelector(".reloj").textContent="";
 document.getElementById("historial").innerHTML=(e.historial||[]).slice().reverse().map(h=>"<li>"+hora(h.t)+" · <b>"+esc(NOMBRES[h.paso]||h.paso)+"</b> "+esc(ICONO[h.estado]||h.estado)+" · "+esc(h.quien)+(h.nota?" — "+esc(h.nota):"")+"</li>").join("");
 const v=(e.pasos||{}).revision||{};
 document.getElementById("veredicto").innerHTML=v.veredicto?"<p><b>"+esc(v.veredicto.toUpperCase())+"</b> "+esc(v.resumen||"")+"</p>"+(v.hallazgos||[]).map(h=>'<p class="hallazgo '+esc(h.gravedad)+'">['+esc(h.gravedad)+"] "+esc(h.archivo)+": "+esc(h.problema)+"</p>").join(""):"—";
}
async function refrescar(){try{pintar(await (await fetch("/estado",{cache:"no-store"})).json())}catch{}}
refrescar();setInterval(refrescar,2000);
</script></body></html>`;

createServer((req, res) => {
  if (req.url === "/estado") { res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(leerEstado())); return; }
  if (req.url === "/" || req.url === "/index.html") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(PAGINA); return; }
  res.writeHead(404); res.end();
}).listen(PUERTO, "127.0.0.1", () => console.log(`Panel de la flota: http://localhost:${PUERTO}`));
