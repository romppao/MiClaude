import { PrismaClient } from "@prisma/client";

// Las recargas de desarrollo reevaluan módulos: reutilizar el cliente evita crear un pool por recarga.
// En producción se conserva la instancia del módulo; no crear PrismaClient en cada página o petición.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
