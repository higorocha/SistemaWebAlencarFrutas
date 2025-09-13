/*
  Warnings:

  - A unique constraint covering the columns `[frutaPedidoId,controleBananaId]` on the table `frutas_pedidos_fitas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `controleBananaId` to the `frutas_pedidos_fitas` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "frutas_pedidos_fitas_frutaPedidoId_fitaBananaId_key";

-- AlterTable
ALTER TABLE "frutas_pedidos_fitas" ADD COLUMN     "controleBananaId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "frutas_pedidos_fitas_frutaPedidoId_controleBananaId_key" ON "frutas_pedidos_fitas"("frutaPedidoId", "controleBananaId");

-- AddForeignKey
ALTER TABLE "frutas_pedidos_fitas" ADD CONSTRAINT "frutas_pedidos_fitas_controleBananaId_fkey" FOREIGN KEY ("controleBananaId") REFERENCES "controle_banana"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
