import { notFound } from "next/navigation";
import Lab from "../components/experience/Lab";
export const dynamic = "force-dynamic";
export const metadata = { title: "Revisión de experiencia" };
/** Laboratorio de revisión, desactivado por defecto y siempre limitado a una demo. */
export default function Laboratorio() {
  if(process.env.EXPERIENCE_LAB!=="si"||process.env.DEMO_MODE!=="si")notFound();
  return <Lab />;
}
