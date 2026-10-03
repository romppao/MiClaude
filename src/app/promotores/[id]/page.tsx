import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/common/db";
import { publicUserName } from "../../../lib/common/names";
import { fmtDate } from "../../../lib/common/labels";
import ProfileHeader from "../../components/ProfileHeader";
import ProfileDetails from "../../components/ProfileDetails";
export const dynamic="force-dynamic";export const metadata={title:"Perfil de promotor"};
export default async function Promoter({params}:{params:Promise<{id:string}>}){const{id}=await params;const u=await db.user.findUnique({where:{id},select:{id:true,name:true,role:true,organizerRequest:{select:{orgName:true}}}});if(!u||u.role!=="ORGANIZER")notFound();const events=await db.event.findMany({where:{organizerId:id},orderBy:{date:"desc"},take:100});const name=u.organizerRequest?.orgName??publicUserName(u.name);const day=new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Madrid"});return <><ProfileHeader kind="promotor" id={id} name={name} subtitle="Promotor de veladas"/><ProfileDetails kind="promotor" id={id}/>{[true,false].map(upcoming=><section key={String(upcoming)}><h2>{upcoming?"Próximas veladas":"Veladas anteriores"}</h2><div className="grid">{events.filter(e=>(e.date.toLocaleDateString("sv-SE",{timeZone:"Europe/Madrid"})>=day)===upcoming).map(e=><Link className="card" href={`/veladas/${e.slug}`} key={e.id}><strong>{e.name}</strong><p className="mut">{fmtDate(e.date)} · {e.city}{e.status==="CANCELLED"?" · Cancelada":""}</p></Link>)}</div></section>)}</>;}
