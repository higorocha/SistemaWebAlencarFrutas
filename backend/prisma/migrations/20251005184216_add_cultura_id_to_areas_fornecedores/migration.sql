-- AlterTable
ALTER TABLE "areas_fornecedores" ADD COLUMN     "cultura_id" INTEGER;

-- AddForeignKey
ALTER TABLE "areas_fornecedores" ADD CONSTRAINT "areas_fornecedores_cultura_id_fkey" FOREIGN KEY ("cultura_id") REFERENCES "culturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
