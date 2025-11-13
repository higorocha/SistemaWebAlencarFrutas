-- CreateEnum
CREATE TYPE "StatusPagamentoFornecedor" AS ENUM ('PENDENTE', 'PROCESSANDO', 'PAGO');

-- CreateTable
CREATE TABLE "fornecedor_pagamentos" (
    "id" SERIAL NOT NULL,
    "fornecedorId" INTEGER NOT NULL,
    "areaFornecedorId" INTEGER NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "frutaId" INTEGER NOT NULL,
    "frutaPedidoId" INTEGER NOT NULL,
    "frutaPedidoAreaId" INTEGER NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "unidadeMedida" "UnidadeMedida" NOT NULL,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "dataColheita" TIMESTAMP(3),
    "status" "StatusPagamentoFornecedor" NOT NULL DEFAULT 'PAGO',
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "formaPagamento" VARCHAR(50) NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedor_pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fornecedor_pagamentos_fornecedorId_idx" ON "fornecedor_pagamentos"("fornecedorId");

-- CreateIndex
CREATE INDEX "fornecedor_pagamentos_pedidoId_idx" ON "fornecedor_pagamentos"("pedidoId");

-- CreateIndex
CREATE INDEX "fornecedor_pagamentos_frutaId_idx" ON "fornecedor_pagamentos"("frutaId");

-- CreateIndex
CREATE INDEX "fornecedor_pagamentos_status_idx" ON "fornecedor_pagamentos"("status");

-- CreateIndex
CREATE INDEX "fornecedor_pagamentos_dataPagamento_idx" ON "fornecedor_pagamentos"("dataPagamento");

-- CreateIndex
CREATE INDEX "fornecedor_pagamentos_fornecedorId_status_idx" ON "fornecedor_pagamentos"("fornecedorId", "status");

-- CreateIndex
CREATE INDEX "fornecedor_pagamentos_pedidoId_frutaId_idx" ON "fornecedor_pagamentos"("pedidoId", "frutaId");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedor_pagamentos_frutaPedidoAreaId_pedidoId_frutaId_key" ON "fornecedor_pagamentos"("frutaPedidoAreaId", "pedidoId", "frutaId");

-- AddForeignKey
ALTER TABLE "fornecedor_pagamentos" ADD CONSTRAINT "fornecedor_pagamentos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedor_pagamentos" ADD CONSTRAINT "fornecedor_pagamentos_areaFornecedorId_fkey" FOREIGN KEY ("areaFornecedorId") REFERENCES "areas_fornecedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedor_pagamentos" ADD CONSTRAINT "fornecedor_pagamentos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedor_pagamentos" ADD CONSTRAINT "fornecedor_pagamentos_frutaId_fkey" FOREIGN KEY ("frutaId") REFERENCES "frutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedor_pagamentos" ADD CONSTRAINT "fornecedor_pagamentos_frutaPedidoId_fkey" FOREIGN KEY ("frutaPedidoId") REFERENCES "frutas_pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedor_pagamentos" ADD CONSTRAINT "fornecedor_pagamentos_frutaPedidoAreaId_fkey" FOREIGN KEY ("frutaPedidoAreaId") REFERENCES "frutas_pedidos_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
