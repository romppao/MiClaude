// Traslada al almacén de fotos (Cloudflare R2) las fotos que siguen guardadas dentro de la base de datos (T-004, parte 2).
//
//   npx tsx scripts/fotos-al-almacen.ts            → copia al almacén las fotos sin clave y apunta su clave. NO borra nada de la base.
//   npx tsx scripts/fotos-al-almacen.ts --vaciar   → después, y solo si el fundador lo confirma: comprueba que cada foto con clave está en el
//                                                    almacén con el mismo tamaño y vacía sus bytes de la base.
//
// Necesita DATABASE_URL y las variables R2_* (o FOTOS_EN_DISCO=si para probarlo en local). Se puede repetir sin miedo: lo ya trasladado se salta.
// Instrucciones para el fundador: docs/PRODUCCION.md, «Fotos fuera de la base de datos».
import { PrismaClient } from "@prisma/client";
import { almacenDeFotos, nuevaClaveDeFoto, type AlmacenDeFotos, type CarpetaDeFotos } from "../src/lib/media/fotos";

const db = new PrismaClient();
const vaciar = process.argv.includes("--vaciar");
const configurado = almacenDeFotos();
if (!configurado) {
  console.error("No hay almacén de fotos configurado: faltan las variables R2_* (o FOTOS_EN_DISCO=si para una prueba en local).");
  process.exit(1);
}
const almacen: AlmacenDeFotos = configurado;

type Hueco = {
  nombre: string;
  carpeta: CarpetaDeFotos;
  /** Ids de las filas que tienen bytes en la base (sin clave al copiar; con clave al vaciar). */
  pendientes(conClave: boolean): Promise<string[]>;
  leer(id: string): Promise<{ bytes: Uint8Array | null; clave: string | null } | null>;
  apuntar(id: string, clave: string): Promise<unknown>;
  vaciar(id: string): Promise<unknown>;
};

const huecos: Hueco[] = [
  {
    nombre: "fotos de perfil", carpeta: "perfiles",
    pendientes: async (c) => (await db.profile.findMany({ where: { avatar: { not: null }, avatarKey: c ? { not: null } : null }, select: { id: true } })).map((r) => r.id),
    leer: async (id) => { const r = await db.profile.findUnique({ where: { id }, select: { avatar: true, avatarKey: true } }); return r && { bytes: r.avatar, clave: r.avatarKey }; },
    apuntar: (id, clave) => db.profile.update({ where: { id }, data: { avatarKey: clave } }),
    vaciar: (id) => db.profile.update({ where: { id }, data: { avatar: null } }),
  },
  {
    nombre: "banners de perfil", carpeta: "perfiles",
    pendientes: async (c) => (await db.profile.findMany({ where: { banner: { not: null }, bannerKey: c ? { not: null } : null }, select: { id: true } })).map((r) => r.id),
    leer: async (id) => { const r = await db.profile.findUnique({ where: { id }, select: { banner: true, bannerKey: true } }); return r && { bytes: r.banner, clave: r.bannerKey }; },
    apuntar: (id, clave) => db.profile.update({ where: { id }, data: { bannerKey: clave } }),
    vaciar: (id) => db.profile.update({ where: { id }, data: { banner: null } }),
  },
  {
    nombre: "fotos de highlights", carpeta: "highlights",
    pendientes: async (c) => (await db.highlight.findMany({ where: { image: { not: null }, imageKey: c ? { not: null } : null }, select: { id: true } })).map((r) => r.id),
    leer: async (id) => { const r = await db.highlight.findUnique({ where: { id }, select: { image: true, imageKey: true } }); return r && { bytes: r.image, clave: r.imageKey }; },
    apuntar: (id, clave) => db.highlight.update({ where: { id }, data: { imageKey: clave } }),
    vaciar: (id) => db.highlight.update({ where: { id }, data: { image: null } }),
  },
  {
    nombre: "fotos del público", carpeta: "medios",
    pendientes: async (c) => (await db.mediaItem.findMany({ where: { image: { not: null }, imageKey: c ? { not: null } : null }, select: { id: true } })).map((r) => r.id),
    leer: async (id) => { const r = await db.mediaItem.findUnique({ where: { id }, select: { image: true, imageKey: true } }); return r && { bytes: r.image, clave: r.imageKey }; },
    apuntar: (id, clave) => db.mediaItem.update({ where: { id }, data: { imageKey: clave } }),
    vaciar: (id) => db.mediaItem.update({ where: { id }, data: { image: null } }),
  },
];

async function main() {
  let fallos = 0;
  for (const h of huecos) {
    const ids = await h.pendientes(vaciar);
    let hechas = 0;
    for (const id of ids) {
      try {
        const fila = await h.leer(id);
        if (!fila?.bytes) continue;
        if (vaciar) {
          // Antes de borrar nada de la base, la foto tiene que estar en el almacén y entera.
          const enAlmacen = fila.clave ? await almacen.leer(fila.clave) : null;
          if (!enAlmacen || enAlmacen.length !== fila.bytes.length) { fallos++; console.error(`  ✗ ${h.nombre} ${id}: no está entera en el almacén; no se vacía`); continue; }
          await h.vaciar(id);
        } else {
          const clave = nuevaClaveDeFoto(h.carpeta);
          await almacen.guardar(clave, fila.bytes);
          await h.apuntar(id, clave);
        }
        hechas++;
      } catch (e) {
        fallos++;
        console.error(`  ✗ ${h.nombre} ${id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    console.log(`${h.nombre}: ${hechas} de ${ids.length} ${vaciar ? "vaciadas de la base" : "copiadas al almacén"}`);
  }
  await db.$disconnect();
  if (fallos) { console.error(`${fallos} fotos con problemas: vuelve a ejecutarlo (lo hecho se salta).`); process.exit(1); }
  console.log(vaciar ? "Listo: la base ya no guarda esas fotos." : "Listo. Comprueba la aplicación y, cuando el fundador lo confirme, ejecuta con --vaciar.");
}

void main();
