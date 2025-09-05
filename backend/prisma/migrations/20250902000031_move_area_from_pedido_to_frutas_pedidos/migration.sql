/*
  Warnings:

  - You are about to drop the column `areaAgricolaId` on the `pedidos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_areaAgricolaId_fkey";

-- AlterTable
ALTER TABLE "frutas_pedidos" ADD COLUMN     "areaFornecedorId" INTEGER,
ADD COLUMN     "areaPropriaId" INTEGER;

-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "areaAgricolaId";

-- AddForeignKey
ALTER TABLE "frutas_pedidos" ADD CONSTRAINT "frutas_pedidos_areaPropriaId_fkey" FOREIGN KEY ("areaPropriaId") REFERENCES "areas_agricolas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frutas_pedidos" ADD CONSTRAINT "frutas_pedidos_areaFornecedorId_fkey" FOREIGN KEY ("areaFornecedorId") REFERENCES "areas_fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
