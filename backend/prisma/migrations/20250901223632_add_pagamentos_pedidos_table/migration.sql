/*
  Warnings:

  - You are about to drop the column `dataPagamento` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `metodoPagamento` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `observacoesPagamento` on the `pedidos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "dataPagamento",
DROP COLUMN "metodoPagamento",
DROP COLUMN "observacoesPagamento";

-- CreateTable
CREATE TABLE "pagamentos_pedidos" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "valorRecebido" DOUBLE PRECISION NOT NULL,
    "metodoPagamento" "MetodoPagamento" NOT NULL,
    "observacoesPagamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pedidos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pagamentos_pedidos" ADD CONSTRAINT "pagamentos_pedidos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
