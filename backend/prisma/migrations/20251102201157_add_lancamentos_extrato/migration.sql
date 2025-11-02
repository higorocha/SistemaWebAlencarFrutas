-- CreateEnum
CREATE TYPE "TipoOperacaoExtrato" AS ENUM ('CREDITO', 'DEBITO');

-- CreateTable
CREATE TABLE "lancamentos_extrato" (
    "id" BIGSERIAL NOT NULL,
    "indicadorTipoLancamento" VARCHAR(10),
    "dataLancamentoRaw" BIGINT,
    "dataMovimento" BIGINT DEFAULT 0,
    "codigoAgenciaOrigem" BIGINT DEFAULT 0,
    "numeroLote" BIGINT,
    "numeroDocumento" VARCHAR(50),
    "codigoHistorico" INTEGER,
    "textoDescricaoHistorico" VARCHAR(200),
    "valorLancamentoRaw" DECIMAL(15,2),
    "indicadorSinalLancamento" VARCHAR(1),
    "textoInformacaoComplementar" TEXT,
    "numeroCpfCnpjContrapartida" VARCHAR(18),
    "indicadorTipoPessoaContrapartida" VARCHAR(1),
    "codigoBancoContrapartida" BIGINT DEFAULT 0,
    "codigoAgenciaContrapartida" BIGINT DEFAULT 0,
    "numeroContaContrapartida" VARCHAR(30),
    "textoDvContaContrapartida" VARCHAR(5),
    "dataLancamento" TIMESTAMP(3) NOT NULL,
    "valorLancamento" DECIMAL(15,2) NOT NULL,
    "tipoOperacao" "TipoOperacaoExtrato" NOT NULL,
    "categoriaOperacao" VARCHAR(50),
    "horarioLancamento" VARCHAR(10),
    "nomeContrapartida" VARCHAR(200),
    "clienteId" INTEGER NOT NULL,
    "pedidoId" INTEGER,
    "contaCorrenteId" INTEGER,
    "agenciaConta" VARCHAR(10),
    "numeroConta" VARCHAR(20),
    "processado" BOOLEAN NOT NULL DEFAULT false,
    "vinculadoPedido" BOOLEAN NOT NULL DEFAULT false,
    "vinculadoPagamento" BOOLEAN NOT NULL DEFAULT false,
    "vinculacaoAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "valorComparacao" DECIMAL(15,2),
    "observacoesProcessamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lancamentos_extrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lancamentos_extrato_dataLancamento_idx" ON "lancamentos_extrato"("dataLancamento");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_tipoOperacao_idx" ON "lancamentos_extrato"("tipoOperacao");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_categoriaOperacao_idx" ON "lancamentos_extrato"("categoriaOperacao");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_numeroCpfCnpjContrapartida_idx" ON "lancamentos_extrato"("numeroCpfCnpjContrapartida");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_clienteId_idx" ON "lancamentos_extrato"("clienteId");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_pedidoId_idx" ON "lancamentos_extrato"("pedidoId");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_processado_idx" ON "lancamentos_extrato"("processado");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_vinculadoPedido_idx" ON "lancamentos_extrato"("vinculadoPedido");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_dataLancamento_tipoOperacao_idx" ON "lancamentos_extrato"("dataLancamento", "tipoOperacao");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_dataLancamento_clienteId_idx" ON "lancamentos_extrato"("dataLancamento", "clienteId");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_dataLancamento_categoriaOperacao_idx" ON "lancamentos_extrato"("dataLancamento", "categoriaOperacao");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_clienteId_processado_idx" ON "lancamentos_extrato"("clienteId", "processado");

-- CreateIndex
CREATE INDEX "lancamentos_extrato_clienteId_vinculadoPedido_idx" ON "lancamentos_extrato"("clienteId", "vinculadoPedido");

-- CreateIndex
CREATE UNIQUE INDEX "lancamentos_extrato_numeroDocumento_dataLancamentoRaw_numer_key" ON "lancamentos_extrato"("numeroDocumento", "dataLancamentoRaw", "numeroLote");

-- AddForeignKey
ALTER TABLE "lancamentos_extrato" ADD CONSTRAINT "lancamentos_extrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_extrato" ADD CONSTRAINT "lancamentos_extrato_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
