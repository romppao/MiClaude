import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "../../lib/accounts/auth";
import Icono, { Marca } from "../components/Icono";
import GpuSurface from "../components/experience/GpuSurface";

export const metadata = { title: "Bienvenida", description: "Ring España: tu comunidad de deportes de contacto en toda España." };
export const dynamic = "force-dynamic";

/** Primera pantalla de la aplicación (diseño v3): foto en círculo que se funde con el negro, «Empezar», «Entrar» y «Explorar sin cuenta». */
export default async function Bienvenida() {
  if (await getUser()) redirect("/");
  return (
    <section className="bienvenida a-sangre" aria-labelledby="titulo-bienvenida">
      <div className="foto" role="img" aria-label="Personas de la comunidad de deportes de contacto (imagen ilustrativa con personas ficticias)" />
      <div className="bienvenida-arena"><GpuSurface /></div>
      <span className="sello-marca" style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)" }}><Marca ancho={24} />RING ESPAÑA</span>
      <h1 id="titulo-bienvenida">Tu deporte.<br />Tu gente.</h1>
      <p className="lead" style={{ maxWidth: 300 }}>Tu comunidad de deportes de contacto en toda España: peleadores, veladas y gimnasios.</p>
      <Link href="/registro" className="btn btn-grande" style={{ width: 230, marginTop: 18 }}>Empezar<Icono nombre="siguiente" tam={18} grosor={2.2} /></Link>
      <p style={{ margin: 0 }}><Link href="/entrar">¿Ya tienes cuenta? Entrar</Link></p>
      <p style={{ margin: 0 }}><Link href="/">Explorar sin cuenta</Link></p>
    </section>
  );
}
