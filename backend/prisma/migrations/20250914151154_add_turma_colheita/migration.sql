-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UnidadeMedida" ADD VALUE 'ML';
ALTER TYPE "UnidadeMedida" ADD VALUE 'LT';

-- CreateTable
CREATE TABLE "turma_colheita" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "frutaId" INTEGER NOT NULL,
    "nomeColhedor" VARCHAR(100) NOT NULL,
    "chavePix" VARCHAR(100),
    "quantidadeColhida" DOUBLE PRECISION NOT NULL,
    "unidadeMedida" "UnidadeMedida" NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turma_colheita_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "turma_colheita" ADD CONSTRAINT "turma_colheita_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_colheita" ADD CONSTRAINT "turma_colheita_frutaId_fkey" FOREIGN KEY ("frutaId") REFERENCES "frutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
