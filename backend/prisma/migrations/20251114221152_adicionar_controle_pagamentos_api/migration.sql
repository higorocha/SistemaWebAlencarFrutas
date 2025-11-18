-- CreateEnum
CREATE TYPE "TipoPagamentoApi" AS ENUM ('PIX', 'BOLETO', 'GUIA');

-- CreateEnum
CREATE TYPE "StatusPagamentoLote" AS ENUM ('PENDENTE', 'ENVIADO', 'PROCESSANDO', 'CONCLUIDO', 'PARCIAL', 'REJEITADO', 'ERRO');

-- CreateEnum
CREATE TYPE "StatusPagamentoItem" AS ENUM ('PENDENTE', 'ENVIADO', 'ACEITO', 'REJEITADO', 'PROCESSADO', 'ERRO');

-- CreateTable
CREATE TABLE "sequencia_numero_requisicao" (
    "id" SERIAL NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sequencia_numero_requisicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento_api_lote" (
    "id" SERIAL NOT NULL,
    "numeroRequisicao" INTEGER NOT NULL,
    "numeroContrato" INTEGER NOT NULL,
    "tipoPagamento" INTEGER NOT NULL,
    "tipoPagamentoApi" "TipoPagamentoApi" NOT NULL DEFAULT 'PIX',
    "contaCorrenteId" INTEGER NOT NULL,
    "payloadEnviado" JSONB NOT NULL,
    "payloadResposta" JSONB,
    "estadoRequisicao" INTEGER,
    "quantidadeEnviada" INTEGER NOT NULL,
    "valorTotalEnviado" DECIMAL(15,2) NOT NULL,
    "quantidadeValida" INTEGER,
    "valorTotalValido" DECIMAL(15,2),
    "status" "StatusPagamentoLote" NOT NULL DEFAULT 'PENDENTE',
    "processadoComSucesso" BOOLEAN NOT NULL DEFAULT false,
    "dataProcessamento" TIMESTAMP(3),
    "ultimaConsultaStatus" TIMESTAMP(3),
    "ultimaAtualizacaoWebhook" TIMESTAMP(3),
    "estadoRequisicaoAtual" INTEGER,
    "payloadRespostaAtual" JSONB,
    "observacoes" TEXT,
    "erroProcessamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamento_api_lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento_api_item" (
    "id" SERIAL NOT NULL,
    "loteId" INTEGER NOT NULL,
    "indiceLote" INTEGER NOT NULL,
    "valorEnviado" DECIMAL(15,2) NOT NULL,
    "dataPagamentoEnviada" TEXT NOT NULL,
    "descricaoEnviada" TEXT,
    "payloadItemEnviado" JSONB NOT NULL,
    "descricaoInstantaneoEnviada" TEXT,
    "chavePixEnviada" TEXT,
    "tipoChavePixEnviado" INTEGER,
    "identificadorPagamento" TEXT,
    "indicadorMovimentoAceito" TEXT,
    "indicadorMovimentoAceitoAtual" TEXT,
    "numeroCodigoBarras" TEXT,
    "codigoIdentificadorPagamento" TEXT,
    "indicadorAceite" TEXT,
    "indicadorAceiteAtual" TEXT,
    "valorNominal" DECIMAL(15,2),
    "valorDesconto" DECIMAL(15,2),
    "valorMoraMulta" DECIMAL(15,2),
    "codigoPagamento" TEXT,
    "codigoBarrasGuia" TEXT,
    "nomeBeneficiario" TEXT,
    "indicadorAceiteGuia" TEXT,
    "indicadorAceiteGuiaAtual" TEXT,
    "erros" JSONB,
    "payloadItemResposta" JSONB,
    "payloadItemRespostaAtual" JSONB,
    "ultimaAtualizacaoStatus" TIMESTAMP(3),
    "estadoPagamentoIndividual" TEXT,
    "payloadConsultaIndividual" JSONB,
    "ultimaConsultaIndividual" TIMESTAMP(3),
    "listaDevolucao" JSONB,
    "turmaColheitaCustoId" INTEGER,
    "fornecedorPagamentoId" INTEGER,
    "funcionarioPagamentoId" INTEGER,
    "status" "StatusPagamentoItem" NOT NULL DEFAULT 'PENDENTE',
    "processadoComSucesso" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamento_api_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_api_lote_numeroRequisicao_key" ON "pagamento_api_lote"("numeroRequisicao");

-- CreateIndex
CREATE INDEX "pagamento_api_lote_numeroRequisicao_idx" ON "pagamento_api_lote"("numeroRequisicao");

-- CreateIndex
CREATE INDEX "pagamento_api_lote_contaCorrenteId_idx" ON "pagamento_api_lote"("contaCorrenteId");

-- CreateIndex
CREATE INDEX "pagamento_api_lote_tipoPagamentoApi_idx" ON "pagamento_api_lote"("tipoPagamentoApi");

-- CreateIndex
CREATE INDEX "pagamento_api_lote_status_idx" ON "pagamento_api_lote"("status");

-- CreateIndex
CREATE INDEX "pagamento_api_lote_createdAt_idx" ON "pagamento_api_lote"("createdAt");

-- CreateIndex
CREATE INDEX "pagamento_api_lote_estadoRequisicaoAtual_idx" ON "pagamento_api_lote"("estadoRequisicaoAtual");

-- CreateIndex
CREATE INDEX "pagamento_api_item_loteId_idx" ON "pagamento_api_item"("loteId");

-- CreateIndex
CREATE INDEX "pagamento_api_item_loteId_indiceLote_idx" ON "pagamento_api_item"("loteId", "indiceLote");

-- CreateIndex
CREATE INDEX "pagamento_api_item_turmaColheitaCustoId_idx" ON "pagamento_api_item"("turmaColheitaCustoId");

-- CreateIndex
CREATE INDEX "pagamento_api_item_fornecedorPagamentoId_idx" ON "pagamento_api_item"("fornecedorPagamentoId");

-- CreateIndex
CREATE INDEX "pagamento_api_item_identificadorPagamento_idx" ON "pagamento_api_item"("identificadorPagamento");

-- CreateIndex
CREATE INDEX "pagamento_api_item_codigoIdentificadorPagamento_idx" ON "pagamento_api_item"("codigoIdentificadorPagamento");

-- CreateIndex
CREATE INDEX "pagamento_api_item_codigoPagamento_idx" ON "pagamento_api_item"("codigoPagamento");

-- CreateIndex
CREATE INDEX "pagamento_api_item_status_idx" ON "pagamento_api_item"("status");

-- AddForeignKey
ALTER TABLE "pagamento_api_lote" ADD CONSTRAINT "pagamento_api_lote_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "conta_corrente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_api_item" ADD CONSTRAINT "pagamento_api_item_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "pagamento_api_lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_api_item" ADD CONSTRAINT "pagamento_api_item_turmaColheitaCustoId_fkey" FOREIGN KEY ("turmaColheitaCustoId") REFERENCES "turma_colheita_pedido_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_api_item" ADD CONSTRAINT "pagamento_api_item_fornecedorPagamentoId_fkey" FOREIGN KEY ("fornecedorPagamentoId") REFERENCES "fornecedor_pagamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
