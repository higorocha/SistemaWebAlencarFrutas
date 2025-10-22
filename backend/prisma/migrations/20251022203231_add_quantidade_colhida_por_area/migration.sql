-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_cultura_id_fkey";

-- DropIndex
DROP INDEX "usuarios_cultura_id_idx";

-- AlterTable
ALTER TABLE "frutas_pedidos_areas" ADD COLUMN     "quantidadeColhidaUnidade1" DECIMAL(10,2),
ADD COLUMN     "quantidadeColhidaUnidade2" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "nivel" SET DEFAULT 'ESCRITORIO';

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cultura_id_fkey" FOREIGN KEY ("cultura_id") REFERENCES "culturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
