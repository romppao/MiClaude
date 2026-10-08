import Link from "next/link";
import type { Discipline, User } from "@prisma/client";
import { db } from "../../lib/common/db";
import { DISCIPLINE_ORDER } from "../../lib/common/disciplines";
import { papelDe, type Papel } from "../../lib/accounts/landing";
import Icono from "../components/Icono";
import { Saludo } from "./comun";
import Portada from "./Portada";

const QUE_HAY_EN_MI_PANEL: Record<Papel, string> = {
  visitante: "",
  usuario: "Los peleadores que sigues, tus auras y tus vídeos y fotos.",
  peleador: "Tu próximo combate, tu récord, tu aura y lo que falta por confirmar.",
  entrenador: "Tus clases, tus veladas e interclubs y tu perfil.",
  entidad: "Tus veladas, los resultados pendientes y tu próxima cita.",
};

type Usuario = User & { fighter: { disciplines: { discipline: Discipline }[] } | null };

/** Disciplinas propias: las elegidas al registrarse, las de su ficha de peleador y las que enseña como entrenador. */
async function disciplinasDe(user: Usuario): Promise<Discipline[]> {
  const trainer = user.role === "TRAINER" ? await db.trainer.findUnique({ where: { userId: user.id }, select: { disciplines: true } }) : null;
  const todas = [...user.interests, ...(user.fighter?.disciplines.map((d) => d.discipline) ?? []), ...(trainer?.disciplines ?? [])];
  return DISCIPLINE_ORDER.filter((d) => todas.includes(d));
}

/**
 * Portada común (decisión del fundador, 8 de octubre de 2026): «después de iniciar sesión a todos los usuarios les aparece la misma
 * pantalla de inicio», con la actualidad de todos los deportes de contacto de fuentes variadas; al elegir un deporte se abre su portada,
 * igual que esta pero solo de esa disciplina. Lo propio de cada tipo de cuenta está en «Mi panel».
 */
export default async function InicioComun({ user }: { user: Usuario }) {
  return (
    <Portada
      primero={await disciplinasDe(user)}
      cabecera={<Saludo nombre={user.name} sub="Lo último de los deportes de contacto" />}
      despuesDeNoticias={
        <Link href="/mi-panel" className="fila" style={{ padding: 16, borderRadius: 26 }}>
          <span className="avatar avatar-relleno" aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 16 }}><Icono nombre="capas" /></span>
          <span className="cuerpo"><span style={{ font: "700 17px var(--font)" }}>Mi panel</span><span className="meta">{QUE_HAY_EN_MI_PANEL[papelDe(user)]}</span></span>
          <Icono nombre="siguiente" tam={18} />
        </Link>
      }
    />
  );
}
