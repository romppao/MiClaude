"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import GpuSurface from "./GpuSurface";
import Pestanas from "../Pestanas";
import { GraficoAura } from "../Tarjetas";
gsap.registerPlugin(useGSAP);

const DATA={
  demo:[{name:"María Fernández",city:"Valencia",aura:128},{name:"Álex Ruiz",city:"A Coruña",aura:64}],
  worst:[{name:"María José de la Cruz y Fernández",city:"bartholomew.fitzgerald@northwind-industries-holdings.example.com",aura:1284009},{name:"Đặng Thị Ngọc Hân",city:"San Cristóbal de La Laguna",aura:1},{name:"Jo",city:"",aura:0}],
  empty:[],one:[{name:"Jo",city:"",aura:1}],
};
type Mode=keyof typeof DATA;
export default function Lab(){
  const [mode,setMode]=useState<Mode>("demo"),[kind,setKind]=useState<"arena"|"medal">("arena"),[gpu,setGpu]=useState(true),[aura,setAura]=useState(128),[recognized,setRecognized]=useState(false);
  const counter=useRef<HTMLSpanElement>(null);
  useEffect(()=>{const mode=new URLSearchParams(location.search).get('data');if(mode&&Object.hasOwn(DATA,mode))setMode(mode as Mode);},[]);
  useGSAP(()=>{if(!counter.current||matchMedia('(prefers-reduced-motion: reduce)').matches)return;gsap.timeline({defaults:{ease:'power3.out',duration:.12}}).fromTo(counter.current,{scale:.97},{scale:1,clearProps:'transform'});},{scope:counter,dependencies:[aura],revertOnUpdate:true});
  const change=(value:Mode)=>{setMode(value);const url=new URL(location.href);url.searchParams.set('data',value);history.replaceState(null,'',url);};
  return <div className="pantalla elite-content">
    <div><h1>Tu deporte.<br/><span className="acc">Con más vida.</span></h1><p className="lead">Revisión interactiva con datos ficticios. Ninguna acción cambia tu cuenta.</p></div>
    <div className="elite-toolbar" role="group" aria-label="Datos de demostración">{(['demo','worst','empty','one'] as Mode[]).map(m=><button key={m} className="secondary" aria-pressed={mode===m} onClick={()=>change(m)}>{({demo:'Demo',worst:'Caso extremo',empty:'Vacío',one:'Una persona'})[m]}</button>)}</div>
    <div className="elite-grid">
      <section className="elite-content" aria-label="Interacción y datos">
        <div className="tarjeta tarjeta-acc" data-reveal><h2 style={{margin:0}}>Reconocimiento de la comunidad</h2><span className="grande" ref={counter}>{new Intl.NumberFormat('es-ES').format(aura)}</span><p>Ejemplo de Aura. La cifra permanece legible al actualizarse.</p><button className="btn-negro" disabled={recognized} onClick={()=>{setRecognized(true);setAura(v=>v+1);toast.success('Actuación reconocida',{description:'Demostración: no se ha guardado ningún voto real.',id:'demo-aura'});}}>{recognized?'Reconocida':'Probar reconocimiento'}</button></div>
        <Pestanas etiqueta="Secciones del ejemplo" pestanas={[{id:'personas',titulo:'Peleadores',contenido:<div className="elite-content">{DATA[mode].length?DATA[mode].map((f,i)=><article className="fila" key={i}><span className="avatar avatar-relleno" aria-hidden="true">{f.name.slice(0,1)}</span><span className="cuerpo"><strong className="nombre">{f.name}</strong>{f.city&&<span className="meta">{f.city}</span>}<span className="meta-acc">{new Intl.NumberFormat('es-ES').format(f.aura)} de aura</span></span></article>):<p>No hay peleadores en este ejemplo. Cambia los datos para continuar.</p>}</div>},{id:'trayectoria',titulo:'Trayectoria',contenido:<div><h2 style={{marginTop:0}}>Tu trayectoria</h2><GraficoAura etiqueta="Ejemplo de reconocimiento mensual" serie={[{mes:'jun',total:12},{mes:'jul',total:28},{mes:'ago',total:64},{mes:'sep',total:24}]}/></div>}]} />
      </section>
      <section className="elite-content" aria-label="Escena decorativa">
        <div className="elite-toolbar"><button className="secondary" aria-pressed={kind==='arena'} onClick={()=>setKind('arena')}>Ring</button><button className="secondary" aria-pressed={kind==='medal'} onClick={()=>setKind('medal')}>Medalla</button><button className="secondary" aria-pressed={!gpu} onClick={()=>setGpu(v=>!v)}>{gpu?'Probar sin GPU':'Activar GPU'}</button></div>
        <div className="elite-object" data-tilt>{gpu?<GpuSurface kind={kind}/>:<div style={{padding:24}}><h2>Tu comunidad sigue aquí.</h2><p>La lectura y las acciones funcionan aunque los efectos no estén disponibles.</p></div>}</div>
        <p className="meta">Objeto decorativo de demostración. No es un título, acreditación ni logo.</p>
        <div className="tarjeta elite-ring-card" data-tilt><GpuSurface kind="ambient"/><h2 style={{margin:0}}>Energía de combate</h2><p>Shader WebGPU con una malla suave y estela de luz. Si tu navegador no dispone de WebGPU, conserva la superficie habitual.</p></div>
      </section>
    </div>
  </div>;
}
