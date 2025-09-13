/*
  Warnings:

  - You are about to drop the column `areaFornecedorId` on the `frutas_pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `areaPropriaId` on the `frutas_pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `fitaColheita` on the `frutas_pedidos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "frutas_pedidos" DROP CONSTRAINT "frutas_pedidos_areaFornecedorId_fkey";

-- DropForeignKey
ALTER TABLE "frutas_pedidos" DROP CONSTRAINT "frutas_pedidos_areaPropriaId_fkey";

-- AlterTable
ALTER TABLE "frutas_pedidos" DROP COLUMN "areaFornecedorId",
DROP COLUMN "areaPropriaId",
DROP COLUMN "fitaColheita";

-- CreateTable
CREATE TABLE "frutas_pedidos_areas" (
    "id" SERIAL NOT NULL,
    "frutaPedidoId" INTEGER NOT NULL,
    "areaPropriaId" INTEGER,
    "areaFornecedorId" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frutas_pedidos_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frutas_pedidos_fitas" (
    "id" SERIAL NOT NULL,
    "frutaPedidoId" INTEGER NOT NULL,
    "fitaBananaId" INTEGER NOT NULL,
    "quantidadeFita" DOUBLE PRECISION,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frutas_pedidos_fitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fitas_banana" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "corHex" VARCHAR(7) NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fitas_banana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controle_banana" (
    "id" SERIAL NOT NULL,
    "fitaBananaId" INTEGER NOT NULL,
    "areaAgricolaId" INTEGER NOT NULL,
    "quantidadeFitas" INTEGER NOT NULL,
    "dataRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controle_banana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_fitas" (
    "id" SERIAL NOT NULL,
    "controleBananaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "acao" VARCHAR(50) NOT NULL,
    "dadosAnteriores" JSONB,
    "dadosNovos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_fitas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "frutas_pedidos_fitas_frutaPedidoId_fitaBananaId_key" ON "frutas_pedidos_fitas"("frutaPedidoId", "fitaBananaId");

-- CreateIndex
CREATE UNIQUE INDEX "fitas_banana_nome_key" ON "fitas_banana"("nome");

-- AddForeignKey
ALTER TABLE "frutas_pedidos_areas" ADD CONSTRAINT "frutas_pedidos_areas_frutaPedidoId_fkey" FOREIGN KEY ("frutaPedidoId") REFERENCES "frutas_pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frutas_pedidos_areas" ADD CONSTRAINT "frutas_pedidos_areas_areaPropriaId_fkey" FOREIGN KEY ("areaPropriaId") REFERENCES "areas_agricolas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frutas_pedidos_areas" ADD CONSTRAINT "frutas_pedidos_areas_areaFornecedorId_fkey" FOREIGN KEY ("areaFornecedorId") REFERENCES "areas_fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frutas_pedidos_fitas" ADD CONSTRAINT "frutas_pedidos_fitas_frutaPedidoId_fkey" FOREIGN KEY ("frutaPedidoId") REFERENCES "frutas_pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frutas_pedidos_fitas" ADD CONSTRAINT "frutas_pedidos_fitas_fitaBananaId_fkey" FOREIGN KEY ("fitaBananaId") REFERENCES "fitas_banana"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fitas_banana" ADD CONSTRAINT "fitas_banana_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controle_banana" ADD CONSTRAINT "controle_banana_fitaBananaId_fkey" FOREIGN KEY ("fitaBananaId") REFERENCES "fitas_banana"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controle_banana" ADD CONSTRAINT "controle_banana_areaAgricolaId_fkey" FOREIGN KEY ("areaAgricolaId") REFERENCES "areas_agricolas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controle_banana" ADD CONSTRAINT "controle_banana_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_fitas" ADD CONSTRAINT "historico_fitas_controleBananaId_fkey" FOREIGN KEY ("controleBananaId") REFERENCES "controle_banana"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_fitas" ADD CONSTRAINT "historico_fitas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
