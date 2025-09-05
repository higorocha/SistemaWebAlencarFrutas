/*
  Warnings:

  - You are about to drop the column `frutaId` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `quantidadePrevista` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `quantidadeReal` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `quantidadeReal2` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `unidadeMedida1` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `unidadeMedida2` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `unidadePrecificada` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `valorTotal` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `valorUnitario` on the `pedidos` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "StatusPedido" ADD VALUE 'PAGAMENTO_PARCIAL';

-- AlterEnum
ALTER TYPE "UnidadeMedida" ADD VALUE 'UND';

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_frutaId_fkey";

-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "frutaId",
DROP COLUMN "quantidadePrevista",
DROP COLUMN "quantidadeReal",
DROP COLUMN "quantidadeReal2",
DROP COLUMN "unidadeMedida1",
DROP COLUMN "unidadeMedida2",
DROP COLUMN "unidadePrecificada",
DROP COLUMN "valorTotal",
DROP COLUMN "valorUnitario",
ADD COLUMN     "valorRecebido" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "frutas_pedidos" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "frutaId" INTEGER NOT NULL,
    "quantidadePrevista" DOUBLE PRECISION NOT NULL,
    "quantidadeReal" DOUBLE PRECISION,
    "quantidadeReal2" DOUBLE PRECISION,
    "unidadeMedida1" "UnidadeMedida" NOT NULL,
    "unidadeMedida2" "UnidadeMedida",
    "valorUnitario" DOUBLE PRECISION,
    "valorTotal" DOUBLE PRECISION,
    "unidadePrecificada" "UnidadeMedida",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frutas_pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "frutas_pedidos_pedidoId_frutaId_key" ON "frutas_pedidos"("pedidoId", "frutaId");

-- AddForeignKey
ALTER TABLE "frutas_pedidos" ADD CONSTRAINT "frutas_pedidos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frutas_pedidos" ADD CONSTRAINT "frutas_pedidos_frutaId_fkey" FOREIGN KEY ("frutaId") REFERENCES "frutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
