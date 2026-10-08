-- Cuenta del creador (petición del fundador, 8 de octubre de 2026): segundo paso al entrar. Solo añade columnas.
ALTER TABLE "User" ADD COLUMN "totpSecret" TEXT,
ADD COLUMN "totpConfirmedAt" TIMESTAMP(3),
ADD COLUMN "totpLastStep" INTEGER,
ADD COLUMN "recoveryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Session" ADD COLUMN "secondFactorAt" TIMESTAMP(3);
