import Link from "next/link";
import { requireUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import { flatParams } from "../../lib/common/safe";
import { notificationCutoff } from "../../lib/community/notifications";
import { fmtFechaHoraMadrid } from "../../lib/common/labels";
import { readNotification, readAllNotifications } from "../actions/notifications";
import Paginacion from "../components/Paginacion";

export const metadata = { title: "Avisos", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function Notifications({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/avisos"), params = flatParams(await searchParams);
  const where = { userId: user.id, createdAt: { gte: notificationCutoff() } };
  const total = await db.notification.count({ where }), w = pageWindow(total, pageNumber(params.pagina));
  const notifications = await db.notification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: w.take, skip: w.skip });
  return <div className="pantalla"><h1>Avisos</h1><form action={readAllNotifications}><button>Marcar todos como leídos</button></form><div className="lista">{notifications.map((n) => <article className="tarjeta" key={n.id}><Link className="btn secondary" href={n.href}>{n.title}</Link><p className="meta" style={{ fontSize: 16 }}>{fmtFechaHoraMadrid(n.createdAt)} · {n.readAt ? "Leído" : "Sin leer"}</p>{!n.readAt && <form action={readNotification}><input type="hidden" name="notificationId" value={n.id} /><button className="secondary">Marcar como leído</button></form>}</article>)}</div>{!notifications.length && <p>No tienes avisos.</p>}<Paginacion ruta="/avisos" params={params} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["aviso", "avisos"]} /></div>;
}
