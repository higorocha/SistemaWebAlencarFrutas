/*
  Warnings:

  - You are about to drop the column `turmaColheitaCustoId` on the `pagamento_api_item` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "pagamento_api_item" DROP CONSTRAINT "pagamento_api_item_turmaColheitaCustoId_fkey";

-- DropIndex
DROP INDEX "pagamento_api_item_turmaColheitaCustoId_idx";

-- AlterTable
ALTER TABLE "pagamento_api_item" DROP COLUMN "turmaColheitaCustoId",
ADD COLUMN     "turmaColheitaPedidoCustoId" INTEGER;

-- CreateTable
CREATE TABLE "pagamento_api_item_colheita" (
    "id" SERIAL NOT NULL,
    "pagamentoApiItemId" INTEGER NOT NULL,
    "turmaColheitaCustoId" INTEGER NOT NULL,
    "valorColheita" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamento_api_item_colheita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pagamento_api_item_colheita_pagamentoApiItemId_idx" ON "pagamento_api_item_colheita"("pagamentoApiItemId");

-- CreateIndex
CREATE INDEX "pagamento_api_item_colheita_turmaColheitaCustoId_idx" ON "pagamento_api_item_colheita"("turmaColheitaCustoId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_api_item_colheita_pagamentoApiItemId_turmaColheit_key" ON "pagamento_api_item_colheita"("pagamentoApiItemId", "turmaColheitaCustoId");

-- AddForeignKey
ALTER TABLE "pagamento_api_item" ADD CONSTRAINT "pagamento_api_item_turmaColheitaPedidoCustoId_fkey" FOREIGN KEY ("turmaColheitaPedidoCustoId") REFERENCES "turma_colheita_pedido_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_api_item_colheita" ADD CONSTRAINT "pagamento_api_item_colheita_pagamentoApiItemId_fkey" FOREIGN KEY ("pagamentoApiItemId") REFERENCES "pagamento_api_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_api_item_colheita" ADD CONSTRAINT "pagamento_api_item_colheita_turmaColheitaCustoId_fkey" FOREIGN KEY ("turmaColheitaCustoId") REFERENCES "turma_colheita_pedido_custo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
