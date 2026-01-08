-- CreateTable
CREATE TABLE "arh_adiantamentos_funcionario" (
    "id" SERIAL NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "quantidadeParcelas" INTEGER NOT NULL,
    "saldoDevedor" DECIMAL(12,2) NOT NULL,
    "quantidadeParcelasRemanescentes" INTEGER NOT NULL,
    "observacoes" TEXT,
    "usuarioCriacaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arh_adiantamentos_funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arh_lancamentos_adiantamento" (
    "id" SERIAL NOT NULL,
    "adiantamentoId" INTEGER NOT NULL,
    "folhaId" INTEGER NOT NULL,
    "funcionarioPagamentoId" INTEGER NOT NULL,
    "valorDeduzido" DECIMAL(12,2) NOT NULL,
    "parcelaNumero" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arh_lancamentos_adiantamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "arh_adiantamentos_funcionario_funcionarioId_idx" ON "arh_adiantamentos_funcionario"("funcionarioId");

-- CreateIndex
CREATE INDEX "arh_adiantamentos_funcionario_saldoDevedor_idx" ON "arh_adiantamentos_funcionario"("saldoDevedor");

-- CreateIndex
CREATE INDEX "arh_lancamentos_adiantamento_adiantamentoId_idx" ON "arh_lancamentos_adiantamento"("adiantamentoId");

-- CreateIndex
CREATE INDEX "arh_lancamentos_adiantamento_folhaId_idx" ON "arh_lancamentos_adiantamento"("folhaId");

-- CreateIndex
CREATE UNIQUE INDEX "arh_lancamentos_adiantamento_adiantamentoId_folhaId_funcion_key" ON "arh_lancamentos_adiantamento"("adiantamentoId", "folhaId", "funcionarioPagamentoId");

-- AddForeignKey
ALTER TABLE "arh_adiantamentos_funcionario" ADD CONSTRAINT "arh_adiantamentos_funcionario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "arh_funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_adiantamentos_funcionario" ADD CONSTRAINT "arh_adiantamentos_funcionario_usuarioCriacaoId_fkey" FOREIGN KEY ("usuarioCriacaoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_lancamentos_adiantamento" ADD CONSTRAINT "arh_lancamentos_adiantamento_adiantamentoId_fkey" FOREIGN KEY ("adiantamentoId") REFERENCES "arh_adiantamentos_funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_lancamentos_adiantamento" ADD CONSTRAINT "arh_lancamentos_adiantamento_folhaId_fkey" FOREIGN KEY ("folhaId") REFERENCES "arh_folhas_pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_lancamentos_adiantamento" ADD CONSTRAINT "arh_lancamentos_adiantamento_funcionarioPagamentoId_fkey" FOREIGN KEY ("funcionarioPagamentoId") REFERENCES "arh_funcionarios_pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
