import Link from "next/link";
import { db } from "../../lib/common/db";
import { profileSelect } from "../../lib/profiles/profiles";
import { getUser } from "../../lib/accounts/auth";
import { createFederation } from "../actions/profiles";
export const dynamic = "force-dynamic";
export const metadata = { title: "Federaciones" };
export default async function Federations() {
  const [profiles, user] = await Promise.all([db.profile.findMany({where:{kind:"federacion"}, select:profileSelect, orderBy:{name:"asc"},take:100}),getUser()]);
  return <><h1>Federaciones</h1><p className="mut">Entidades y organizaciones de deportes de contacto. Estar en este directorio no acredita un reconocimiento oficial.</p><div className="grid">{profiles.map(p => <Link className="card" key={p.id} href={`/federaciones/${p.entityId}`}><strong>{p.name}</strong>{p.city && <p>{p.city}</p>}</Link>)}</div>{!profiles.length && <p>Todavía no hay federaciones registradas.</p>}{user?.role === "ADMIN" && <><h2>Añadir una federación</h2><form className="search" action={createFederation}><label className="field"><span>Nombre</span><input name="name" maxLength={150} required /></label><button>Crear perfil de federación</button></form></>}</>;
}
