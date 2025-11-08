-- AlterTable
ALTER TABLE "lancamentos_extrato" ADD COLUMN     "estaLiquidado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "valorDisponivel" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valorVinculadoTotal" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "lancamentos_extrato_pedidos" (
    "id" SERIAL NOT NULL,
    "lancamentoExtratoId" BIGINT NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "valorVinculado" DECIMAL(15,2) NOT NULL,
    "vinculacaoAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lancamentos_extrato_pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lancamentos_extrato_pedidos_lancamentoExtratoId_idx" ON "lancamentos_extrato_pedidos"("lancamentoExtratoId");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_pedidos_pedidoId_idx" ON "lancamentos_extrato_pedidos"("pedidoId");

-- AddForeignKey
ALTER TABLE "lancamentos_extrato_pedidos" ADD CONSTRAINT "lancamentos_extrato_pedidos_lancamentoExtratoId_fkey" FOREIGN KEY ("lancamentoExtratoId") REFERENCES "lancamentos_extrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_extrato_pedidos" ADD CONSTRAINT "lancamentos_extrato_pedidos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
