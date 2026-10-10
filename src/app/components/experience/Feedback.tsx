"use client";
import { useEffect } from "react";
import { Toaster, toast } from "sonner";
/** Un solo toaster para sucesos del cliente. Los avisos de servidor conservan su región accesible. */
export default function Feedback() {
  useEffect(() => {
    const offline=()=>toast.warning("Sin conexión",{id:"conexion",description:"Puedes seguir leyendo. Necesitas conexión para enviar cambios.",duration:Infinity});
    const online=()=>toast.success("Conexión recuperada",{id:"conexion"});
    window.addEventListener("offline",offline);window.addEventListener("online",online);
    return ()=>{window.removeEventListener("offline",offline);window.removeEventListener("online",online);};
  },[]);
  return <Toaster theme="dark" position="bottom-center" closeButton mobileOffset={{bottom:"calc(100px + env(safe-area-inset-bottom, 0px))",left:"16px",right:"16px"}} toastOptions={{closeButtonAriaLabel:"Cerrar aviso",style:{fontFamily:"Archivo, sans-serif",background:"#141417",color:"#fff",borderColor:"#26262E"}}} />;
}
