import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "../../lib/common/db";
import { flatParams } from "../../lib/common/safe";
import { pageNumber, pageWindow } from "../../lib/common/pagination";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, isDiscipline } from "../../lib/common/disciplines";
import { PROVINCES } from "../../lib/common/labels";
import { CLASS_KIND_LABEL, classMeta } from "../../lib/trainers/classes";
import { getUser } from "../../lib/accounts/auth";
import Paginacion from "../components/Paginacion";
import { BotonesFiltro, CampoFiltro, MasFiltros } from "../components/Filtros";
import Icono from "../components/Icono";
import IconoDisciplina from "../components/IconoDisciplina";

export const metadata: Metadata = { title: "Buscar clases", description: "Clases individuales y colectivas de deportes de contacto con entrenadores de toda España." };
export const dynamic = "force-dynamic";

/**
 * Buscar clases (petición del fundador, 8 de octubre de 2026: «buscar clases está muy al fondo y es complicado de encontrar»). Todas las
 * clases publicadas, de cualquier entrenador, con filtros por disciplina, provincia y tipo, y el botón para solicitarlas. Orden: precio.
 */
export default async function BuscarClases({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q = "", disciplina, provincia, tipo, pagina } = flatParams(await searchParams);
  const discipline = disciplina && isDiscipline(disciplina) ? disciplina : undefined;
  const province = provincia && PROVINCES.includes(provincia) ? provincia : undefined;
  const kind = tipo === "INDIVIDUAL" || tipo === "GROUP" ? tipo : undefined;
  const texto = q.trim().slice(0, 80);
  // Dirección de «Clases» con un cambio: el deporte y el tipo se eligen con un toque y conservan lo demás.
  const hacia = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: texto, disciplina: discipline, provincia: province, tipo: kind, ...cambios })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/clases?${s}` : "/clases";
  };
  const where: Prisma.TrainingClassWhereInput = {
    active: true,
    trainer: { userId: { not: null }, ...(province && { province }) },
    ...(discipline && { discipline }),
    ...(kind && { kind }),
    ...(texto && { OR: [{ title: { contains: texto, mode: "insensitive" } }, { trainer: { name: { contains: texto, mode: "insensitive" } } }, { trainer: { city: { contains: texto, mode: "insensitive" } } }] }),
  };
  const total = await db.trainingClass.count({ where });
  const w = pageWindow(total, pageNumber(pagina));
  const [clases, user] = await Promise.all([
    db.trainingClass.findMany({ where, orderBy: [{ priceEuros: "asc" }, { id: "asc" }], skip: w.skip, take: w.take, include: { trainer: { include: { gym: true } } } }),
    getUser(),
  ]);
  return (
    <div className="pantalla" style={{ gap: 16 }}>
      <div><h1>Buscar clases</h1><p className="lead" style={{ fontSize: 16 }}>Clases con entrenadores de toda España. Elige una y pulsa «Solicitar esta clase»: el entrenador te responderá. Se paga directamente al entrenador.</p></div>
      <nav className="filtros-disciplina desliza-fila con-dibujo" aria-label="Elige un deporte">
        <Link href={hacia({ disciplina: undefined })} aria-current={!discipline ? "page" : undefined}><Icono nombre="capas" tam={28} grosor={1.6} />Todos</Link>
        {DISCIPLINE_ORDER.map((d) => <Link key={d} href={hacia({ disciplina: d })} aria-current={d === discipline ? "page" : undefined}><IconoDisciplina d={d} tam={30} grosor={1.6} />{DISCIPLINE_LABEL[d]}</Link>)}
      </nav>
      <nav className="segmentos-tipo" aria-label="Tipo de clase">
        <Link className="segmento" href={hacia({ tipo: undefined })} aria-current={!kind ? "page" : undefined}>Todas</Link>
        <Link className="segmento" href={hacia({ tipo: "INDIVIDUAL" })} aria-current={kind === "INDIVIDUAL" ? "page" : undefined}>Individuales</Link>
        <Link className="segmento" href={hacia({ tipo: "GROUP" })} aria-current={kind === "GROUP" ? "page" : undefined}>Colectivas</Link>
      </nav>
      <form className="search search-directorio" role="search" aria-label="Filtrar clases">
        <CampoFiltro etiqueta="Clase, entrenador o ciudad"><input name="q" defaultValue={texto} maxLength={80} /></CampoFiltro>
        <MasFiltros activos={[discipline, province, kind].filter(Boolean).length}>
          <CampoFiltro etiqueta="Disciplina"><select name="disciplina" defaultValue={discipline ?? ""}><option value="">Todas las disciplinas</option>{DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select></CampoFiltro>
          <CampoFiltro etiqueta="Provincia"><select name="provincia" defaultValue={province ?? ""}><option value="">Toda España</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></CampoFiltro>
          <CampoFiltro etiqueta="Tipo de clase"><select name="tipo" defaultValue={kind ?? ""}><option value="">Individuales y colectivas</option><option value="INDIVIDUAL">Individual</option><option value="GROUP">Colectiva</option></select></CampoFiltro>
        </MasFiltros>
        <BotonesFiltro ruta="/clases" hayFiltros={!!(texto || discipline || province || kind)} />
      </form>
      <p aria-live="polite" className="mut" style={{ margin: 0 }}>{total === 0 ? "Ninguna clase coincide con estos filtros." : total === 1 ? "1 clase encontrada." : `${total} clases encontradas.`}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {clases.map((c) => (
          <section key={c.id} className="tarjeta" aria-label={`${c.title}, con ${c.trainer.name}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>{c.discipline && <span className="clase-icono" aria-hidden="true"><IconoDisciplina d={c.discipline} tam={24} grosor={1.7} /></span>}<span className={`pildora ${c.kind === "INDIVIDUAL" ? "pildora-acc" : "pildora-violeta"}`}>{CLASS_KIND_LABEL[c.kind]}</span></span><span style={{ font: "800 26px var(--font)", letterSpacing: "-.03em" }}>{c.priceEuros} €</span></div>
            <div><h2 style={{ margin: 0, font: "700 19px/1.2 var(--font)" }}>{c.title}</h2><div className="meta">{classMeta(c)}{c.discipline ? ` · ${DISCIPLINE_LABEL[c.discipline]}` : ""}{c.capacity ? ` · ${c.capacity} plazas` : ""}</div></div>
            <div className="meta">Con <Link href={`/entrenadores/${c.trainer.slug}`}>{c.trainer.name}</Link>{c.trainer.gym ? ` · ${c.trainer.gym.name}` : ""}{c.trainer.city || c.trainer.province ? ` · ${[c.trainer.city, c.trainer.province].filter((x, i, a) => x && a.indexOf(x) === i).join(", ")}` : ""}</div>
            {user?.id !== c.trainer.userId && <Link className="btn" href={`/clases/${c.id}/solicitar`} aria-label={`Solicitar la clase «${c.title}» con ${c.trainer.name}`}>Solicitar esta clase</Link>}
          </section>
        ))}
      </div>
      {total === 0 && <p className="mut" style={{ margin: 0 }}>{texto || discipline || province || kind ? "Prueba a quitar algún filtro." : "Todavía no hay clases publicadas. Si das clases, crea una cuenta de entrenador y publícalas."} <Link href="/entrenadores">Ver todos los entrenadores</Link></p>}
      {total === 0 && (
        <div className="vacio-guia">
          <span className="vacio-icono" aria-hidden="true"><Icono nombre="buscar" tam={30} grosor={1.8} /></span>
          <p><strong>{texto || discipline || province || kind ? "No hay clases con esos filtros" : "Aún no hay clases publicadas"}</strong></p>
          <p className="mut" style={{ margin: 0 }}>{texto || discipline || province || kind ? "Prueba con otro deporte o quita algún filtro." : "Mientras tanto, puedes ver a los entrenadores y escribirles."}</p>
          <div className="vacio-acciones">
            <Link className="btn" href="/entrenadores">Ver entrenadores</Link>
            {(texto || discipline || province || kind) && <Link className="btn secondary" href="/clases">Quitar los filtros</Link>}
          </div>
        </div>
      )}
      <Paginacion ruta="/clases" params={{ q: texto, disciplina: discipline, provincia: province, tipo: kind }} actual={w.current} paginas={w.pages} desde={w.from} hasta={w.to} total={total} unidad={["clase", "clases"]} />
    </div>
  );
}
