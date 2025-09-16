/*
  Warnings:

  - You are about to drop the column `frutaId` on the `turma_colheita` table. All the data in the column will be lost.
  - You are about to drop the column `pedidoId` on the `turma_colheita` table. All the data in the column will be lost.
  - You are about to drop the column `quantidadeColhida` on the `turma_colheita` table. All the data in the column will be lost.
  - You are about to drop the column `unidadeMedida` on the `turma_colheita` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "turma_colheita" DROP CONSTRAINT "turma_colheita_frutaId_fkey";

-- DropForeignKey
ALTER TABLE "turma_colheita" DROP CONSTRAINT "turma_colheita_pedidoId_fkey";

-- AlterTable
ALTER TABLE "turma_colheita" DROP COLUMN "frutaId",
DROP COLUMN "pedidoId",
DROP COLUMN "quantidadeColhida",
DROP COLUMN "unidadeMedida",
ADD COLUMN     "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "colheita_pedido" (
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

    CONSTRAINT "colheita_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colheita_pedido_turmaColheitaId_pedidoId_frutaId_key" ON "colheita_pedido"("turmaColheitaId", "pedidoId", "frutaId");

-- AddForeignKey
ALTER TABLE "colheita_pedido" ADD CONSTRAINT "colheita_pedido_turmaColheitaId_fkey" FOREIGN KEY ("turmaColheitaId") REFERENCES "turma_colheita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colheita_pedido" ADD CONSTRAINT "colheita_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colheita_pedido" ADD CONSTRAINT "colheita_pedido_frutaId_fkey" FOREIGN KEY ("frutaId") REFERENCES "frutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
