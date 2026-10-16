export interface OpcionesLimitador { maximo:number; ventanaMs:number; ahora?:()=>number; maxClaves?:number }
export interface Decision { permitido:boolean; restantes:number; reintentarEnMs:number }
export function crearLimitador(opciones:OpcionesLimitador){
  const {maximo,ventanaMs,maxClaves=10000}=opciones; if(!Number.isInteger(maximo)||maximo<1||!Number.isFinite(ventanaMs)||ventanaMs<=0||!Number.isInteger(maxClaves)||maxClaves<1)throw new RangeError("Opciones inválidas");
  const reloj=opciones.ahora??Date.now; let ultimo=-Infinity; const claves=new Map<string,number[]>();
  const ahora=()=>{ultimo=Math.max(ultimo,reloj());return ultimo;}; const activas=(xs:number[],t:number)=>xs.filter(x=>x>t-ventanaMs);
  return { permitir(clave:string):Decision { const t=ahora(); let xs=claves.get(clave); if(!xs){if(claves.size>=maxClaves)claves.delete(claves.keys().next().value as string);xs=[];} else claves.delete(clave); xs=activas(xs,t); claves.set(clave,xs); if(xs.length>=maximo)return{permitido:false,restantes:0,reintentarEnMs:xs[0]+ventanaMs-t}; xs.push(t); return{permitido:true,restantes:maximo-xs.length,reintentarEnMs:0}; }, tamano(){return claves.size;}, limpiar(){const t=ahora();for(const [k,xs]of claves)if(!activas(xs,t).length)claves.delete(k);} };
}
