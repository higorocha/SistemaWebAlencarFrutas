/*
  Warnings:

  - A unique constraint covering the columns `[boletoId]` on the table `pagamentos_pedidos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pagamentos_pedidos" ADD COLUMN     "boletoId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_pedidos_boletoId_key" ON "pagamentos_pedidos"("boletoId");

-- AddForeignKey
ALTER TABLE "pagamentos_pedidos" ADD CONSTRAINT "pagamentos_pedidos_boletoId_fkey" FOREIGN KEY ("boletoId") REFERENCES "boletos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
