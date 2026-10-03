import Link from "next/link";
import { db } from "../../lib/common/db";
import { publicUserName } from "../../lib/common/names";
export const dynamic="force-dynamic";
export const metadata={title:"Promotores"};
export default async function Promoters(){const users=await db.user.findMany({where:{role:"ORGANIZER"},select:{id:true,name:true,organizerRequest:{select:{orgName:true}}},take:100,orderBy:{name:"asc"}});return <><h1>Promotores</h1><p>Conoce quién organiza las veladas.</p><div className="grid">{users.map(u=><Link key={u.id} className="card" href={`/promotores/${u.id}`}><strong>{u.organizerRequest?.orgName ?? publicUserName(u.name)}</strong></Link>)}</div>{!users.length&&<p>Todavía no hay promotores registrados.</p>}<p><Link href="/organizador">Solicitar acceso para organizar veladas</Link></p></>;}
