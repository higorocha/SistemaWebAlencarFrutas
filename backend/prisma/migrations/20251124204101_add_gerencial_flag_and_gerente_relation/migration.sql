-- AlterTable
ALTER TABLE "arh_cargos" ADD COLUMN     "isGerencial" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "arh_funcionarios" ADD COLUMN     "gerenteId" INTEGER;

-- AddForeignKey
ALTER TABLE "arh_funcionarios" ADD CONSTRAINT "arh_funcionarios_gerenteId_fkey" FOREIGN KEY ("gerenteId") REFERENCES "arh_funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
