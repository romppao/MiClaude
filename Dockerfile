# Imagen de la versión real de Lona para Google Cloud Run (ADR-005, docs/PRODUCCION.md).
# Tres etapas: dependencias, compilación y una imagen final pequeña con la salida «standalone» de Next.js.
# Las migraciones NO se aplican al arrancar: las aplica el flujo de despliegue antes de publicar la imagen,
# así un arranque en frío de Cloud Run no compite con otro por migrar la base.

FROM node:22-bookworm-slim AS base
# Prisma necesita OpenSSL en tiempo de ejecución.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
# El commit desplegado se muestra en /salud y en moderación (lib/common/version.ts).
ARG GIT_COMMIT=""
ENV GIT_COMMIT=$GIT_COMMIT
RUN npm run build

FROM base AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0
ARG GIT_COMMIT=""
ENV GIT_COMMIT=$GIT_COMMIT
RUN groupadd --system lona && useradd --system --gid lona lona
COPY --from=build --chown=lona:lona /app/.next/standalone ./
COPY --from=build --chown=lona:lona /app/.next/static ./.next/static
COPY --from=build --chown=lona:lona /app/public ./public
USER lona
EXPOSE 8080
CMD ["node", "server.js"]
