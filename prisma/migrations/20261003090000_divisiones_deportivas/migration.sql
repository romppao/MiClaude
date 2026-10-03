-- Cambios aditivos: no reclasifican fichas ni combates anteriores.
ALTER TABLE "FighterDiscipline" ADD COLUMN "divisionId" TEXT;
ALTER TABLE "Bout" ADD COLUMN "divisionId" TEXT;
CREATE INDEX "FighterDiscipline_discipline_level_divisionId_weightClass_idx" ON "FighterDiscipline"("discipline", "level", "divisionId", "weightClass");
