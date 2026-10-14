-- Entrar con Google (docs/tareas/T-015-entrar-con-google.md): identificador de la cuenta de Google vinculada.
ALTER TABLE "User" ADD COLUMN "googleSub" TEXT;
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");
