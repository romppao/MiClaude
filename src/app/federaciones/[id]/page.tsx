import { notFound } from "next/navigation";
import { db } from "../../../lib/common/db";
import { profileSelect } from "../../../lib/profiles/profiles";
import ProfileHeader from "../../components/ProfileHeader";
import ProfileDetails from "../../components/ProfileDetails";
export const dynamic = "force-dynamic";
export const metadata = { title: "Perfil de federación" };
export default async function Federation({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const p=await db.profile.findUnique({where:{kind_entityId:{kind:"federacion",entityId:id}},select:profileSelect});if(!p)notFound();
  return <><ProfileHeader kind="federacion" id={id} name={p.name ?? "Federación"} subtitle="Federación"/><ProfileDetails kind="federacion" id={id}/><p className="mut">La presencia de esta ficha no es un sello de acreditación oficial.</p></>;
}
