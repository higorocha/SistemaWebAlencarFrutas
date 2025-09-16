/*
  Warnings:

  - You are about to drop the `colheita_pedido` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "colheita_pedido" DROP CONSTRAINT "colheita_pedido_frutaId_fkey";

-- DropForeignKey
ALTER TABLE "colheita_pedido" DROP CONSTRAINT "colheita_pedido_pedidoId_fkey";

-- DropForeignKey
ALTER TABLE "colheita_pedido" DROP CONSTRAINT "colheita_pedido_turmaColheitaId_fkey";

-- DropTable
DROP TABLE "colheita_pedido";

-- CreateTable
CREATE TABLE "turma_colheita_pedido_custo" (
    "id" SERIAL NOT NULL,
    "turmaColheitaId" INTEGER NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "frutaId" INTEGER NOT NULL,
    "quantidadeColhida" DOUBLE PRECISION NOT NULL,
    "unidadeMedida" "UnidadeMedida" NOT NULL,
    "valorColheita" DOUBLE PRECISION,
    "dataColheita" TIMESTAMP(3),
    "pagamentoEfetuado" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turma_colheita_pedido_custo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "turma_colheita_pedido_custo_turmaColheitaId_pedidoId_frutaI_key" ON "turma_colheita_pedido_custo"("turmaColheitaId", "pedidoId", "frutaId");

-- AddForeignKey
ALTER TABLE "turma_colheita_pedido_custo" ADD CONSTRAINT "turma_colheita_pedido_custo_turmaColheitaId_fkey" FOREIGN KEY ("turmaColheitaId") REFERENCES "turma_colheita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_colheita_pedido_custo" ADD CONSTRAINT "turma_colheita_pedido_custo_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_colheita_pedido_custo" ADD CONSTRAINT "turma_colheita_pedido_custo_frutaId_fkey" FOREIGN KEY ("frutaId") REFERENCES "frutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
