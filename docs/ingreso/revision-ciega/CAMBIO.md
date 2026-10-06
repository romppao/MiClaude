# PR de práctica: «Permitir a la organizadora quitar un combate de su cartel y avisar a los peleadores»

> Este «PR» es ficticio y contiene defectos. **No lo ejecutes ni lo edites.** Revísalo como lo haría el líder técnico (`docs/REVISION.md`) y entrega tu lista de defectos (ver Parte 4 de `docs/PRUEBA-DE-INGRESO.md`).

## Descripción del PR (escrita por el autor)

**Qué hace:** añade la acción «quitar del cartel» con aviso por correo a los dos peleadores, un botón en la pantalla del cartel y una prueba. **Cómo lo he comprobado:** «Probado en el navegador con una organizadora y con un peleador; pasan todas las pruebas y la accesibilidad». **Notas:** «He subido la ayuda de la pantalla a 14 px para que quepa en el móvil y he quitado una prueba que fallaba a ratos».

## Cambios

### `src/app/actions/events.ts` (añadido al final)

```ts
export async function removeBoutFromCard(f: FormData) {
  const user = await requireUser();
  const boutId = String(f.get("boutId"));
  const bout = await db.bout.findUnique({ where: { id: boutId }, include: { event: true, fighterA: { include: { user: true } }, fighterB: { include: { user: true } } } });
  if (!bout) redirect("/organizador");

  await db.bout.delete({ where: { id: boutId } });

  const motivos: Record<string, string> = { cancelado: "se ha cancelado", cambio: "ha cambiado el cartel" };
  const motivo = motivos[String(f.get("motivo"))] ?? "se ha cancelado";

  for (const p of [bout.fighterA, bout.fighterB]) {
    if (p.user?.email) {
      await sendMail(p.user.email, "Tu combate", `Hola ${p.firstName}, tu combate en «${bout.event.name}» ${motivo}. Entra en tu cuenta: http://ring-espana.example.com/mi-ficha?token=${p.user.sessionToken}`);
    }
  }
  revalidatePath("/organizador");
  redirect(`/organizador/${bout.event.slug}`);
}
```

### `src/app/organizador/[slug]/page.tsx` (fragmento añadido a la fila de cada combate)

```tsx
<td>
  <a href="#" onClick={() => removeBoutFromCard}>Remove</a>
  <span style={{ fontSize: 14, color: "#aaa" }}>Quita este combate del cartel y avisa a los peleadores por correo</span>
  <div onClick={() => (window.location.href = `/veladas/${event.slug}`)} style={{ cursor: "pointer" }}>Ver cómo queda</div>
</td>
```

### `src/lib/community/notify.ts` (función auxiliar añadida)

```ts
export async function notifyAll(ids: string[], subject: string, body: string) {
  const users = await Promise.all(ids.map((id) => db.user.findUnique({ where: { id } })));
  for (const u of users) {
    if (u) await sendMail(u.email, subject, body);
  }
}
```

### `tests/unit/autorizacion.test.ts` (diff)

```diff
-  it("removeBout manda a entrar y no escribe nada", async () => {
+  it.skip("removeBout manda a entrar y no escribe nada", async () => {
```

### `prisma/schema.prisma` + migración

```diff
 model Bout {
   ...
-  weightClass String?
+  weightClass String
```
```sql
-- 20261007000000_peso_obligatorio/migration.sql
ALTER TABLE "Bout" ALTER COLUMN "weightClass" SET NOT NULL;
```
(Los combates antiguos sin categoría ya existen en la base de datos.)

### `docs/DIARIO.md`

```md
## 7 de octubre — Quitar combates del cartel
Hecho y probado en el navegador. Todo en verde.
```
