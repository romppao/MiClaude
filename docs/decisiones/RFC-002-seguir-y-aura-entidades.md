# RFC-002 — Seguir y dar aura a gimnasios y promotoras

**Estado:** propuesta para revisión de Claude, pendiente. **Origen:** H4 del encargo del 14-10-2026. El fundador aprobó la función; el encargo pide diseñar el modelo y esperar revisión antes de programar su interfaz. Esta propuesta no activa votos, modifica fórmulas ni publica una migración de estas relaciones.

Se propone mantener cuatro relaciones con claves foráneas reales: `GymFollow`, `PromoterFollow`, `GymAura` y `PromoterAura`. Evita una pareja genérica `kind/entityId` sin integridad referencial. Promotora se resuelve contra su cuenta organizadora aprobada; gimnasio, contra Gym. Cada relación tiene identidad compuesta `[userId, gymId]` o `[userId, promoterUserId]` y `createdAt`. Aura añade `updatedAt` y, solo si se aprueba, comentario con el mismo límite/moderación que los comentarios actuales.

Ejemplo del contrato, a adaptar por Claude antes de convertirlo en schema y migración:

```prisma
model GymFollow {
  userId String
  gymId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  gym Gym @relation(fields: [gymId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@id([userId, gymId])
  @@index([gymId])
}
```

Las otras tres relaciones siguen el patrón, con nombres explícitos de relación para las dos referencias a User en promotoras. La migración solo añade tablas e índices. Borrar una cuenta retira sus relaciones; retirar una entidad la excluye del descubrimiento y de votos nuevos, manteniendo la posibilidad de dejar de seguirla o retirar el voto propio. No publicar identidades de seguidores o votantes.

Reglas propuestas para revisión:

- Seguir requiere sesión. Dar aura requiere correo confirmado y límite de uso validado en servidor, con bloqueo para concurrencia. La cifra concreta y el efecto del comentario se decidirán antes de implementar.
- Una relación por cuenta/entidad, reversible. Nadie puede votar a su gimnasio o su propia promotora; la propiedad se comprueba dentro de la transacción. Moderación puede ocultar comentarios y todas sus decisiones quedan auditadas.
- Las entidades deben estar publicadas y dentro de la política territorial vigente. Una cuenta con perfil visual de promotora no recibe por ello permisos de organizador ni acreditación deportiva.
- Esta aura reconoce a la entidad. No debe sumarse automáticamente al récord ni al aura deportiva de los peleadores, ni confundirse con la valoración derivada que ya muestra el mapa. No se propone una ponderación sin revisión.
- Nuevas relaciones irán en exportación y privacidad. Avisos a seguidores serán del servicio solicitado, con preferencia de correo independiente; no se crean campañas comerciales.

Pruebas necesarias cuando se apruebe: duplicado concurrente, id de otra cuenta, entidad retirada/excluida, voto propio tras una cesión, borrar usuario, moderación de comentario y equivalencia de contadores/listados. Móvil, teclado, axe y funcionamiento sin JavaScript en las acciones de seguir/votar.

Claude debe confirmar el modelo, la definición y límites del aura de entidad y la relación con la valoración actual del mapa. **La interfaz H4 espera esa revisión**, tal como pide el encargo. La estrategia RFC-001 se mantiene como propuesta independiente; no cambia estas reglas por su cuenta.
