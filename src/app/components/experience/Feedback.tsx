"use client";
import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import { informarFallo } from "../informarFallo";
/** Un solo toaster para sucesos del cliente. Los avisos de servidor conservan su región accesible. */
export default function Feedback() {
  useEffect(() => {
    const offline=()=>toast.warning("Sin conexión",{id:"conexion",description:"Puedes seguir leyendo. Necesitas conexión para enviar cambios.",duration:Infinity});
    const online=()=>toast.success("Conexión recuperada",{id:"conexion"});
    // Fallos del navegador que no rompen la página (un botón que no responde): también al registro de fallos. Solo los de nuestros propios
    // archivos; los de extensiones del navegador o de otras webs no son nuestros.
    const fallo=(e:ErrorEvent)=>{if(e.filename&&e.filename.startsWith(location.origin))informarFallo(e.error??e.message);};
    const promesa=(e:PromiseRejectionEvent)=>{if(e.reason instanceof Error&&(e.reason.stack??"").includes(location.origin))informarFallo(e.reason);};
    window.addEventListener("offline",offline);window.addEventListener("online",online);window.addEventListener("error",fallo);window.addEventListener("unhandledrejection",promesa);
    return ()=>{window.removeEventListener("offline",offline);window.removeEventListener("online",online);window.removeEventListener("error",fallo);window.removeEventListener("unhandledrejection",promesa);};
  },[]);
  return <Toaster theme="dark" position="bottom-center" closeButton mobileOffset={{bottom:"calc(100px + env(safe-area-inset-bottom, 0px))",left:"16px",right:"16px"}} toastOptions={{closeButtonAriaLabel:"Cerrar aviso",style:{fontFamily:"Archivo, sans-serif",background:"var(--card)",color:"var(--text)",borderColor:"var(--line-strong)"}}} />;
}
