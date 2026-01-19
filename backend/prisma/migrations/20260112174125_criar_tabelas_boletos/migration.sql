-- CreateEnum
CREATE TYPE "StatusBoleto" AS ENUM ('ABERTO', 'PROCESSANDO', 'PAGO', 'VENCIDO', 'BAIXADO', 'ERRO');

-- CreateEnum
CREATE TYPE "TipoOperacaoBoletoLog" AS ENUM ('CRIACAO', 'ALTERACAO', 'BAIXA', 'PAGAMENTO_WEBHOOK', 'PAGAMENTO_MANUAL', 'ERRO_BB');

-- CreateTable
CREATE TABLE "boletos" (
    "id" SERIAL NOT NULL,
    "convenioCobrancaId" INTEGER NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "contaCorrenteId" INTEGER NOT NULL,
    "valorOriginal" DECIMAL(10,2) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPagamento" TIMESTAMP(3),
    "dataBaixa" TIMESTAMP(3),
    "statusBoleto" "StatusBoleto" NOT NULL DEFAULT 'ABERTO',
    "nossoNumero" VARCHAR(20) NOT NULL,
    "numeroTituloBeneficiario" VARCHAR(15) NOT NULL,
    "numeroTituloCliente" VARCHAR(20),
    "linhaDigitavel" VARCHAR(54) NOT NULL,
    "codigoBarras" VARCHAR(44) NOT NULL,
    "qrCodePix" TEXT,
    "txidPix" VARCHAR(100),
    "urlPix" TEXT,
    "numeroConvenio" VARCHAR(10) NOT NULL,
    "numeroCarteira" VARCHAR(5) NOT NULL,
    "numeroVariacaoCarteira" VARCHAR(5) NOT NULL,
    "usuarioCriacaoId" INTEGER NOT NULL,
    "usuarioAlteracaoId" INTEGER,
    "usuarioBaixaId" INTEGER,
    "usuarioPagamentoId" INTEGER,
    "atualizadoPorWebhook" BOOLEAN NOT NULL DEFAULT false,
    "dataWebhookPagamento" TIMESTAMP(3),
    "ipAddressWebhook" VARCHAR(50),
    "requestPayloadBanco" JSONB NOT NULL,
    "responsePayloadBanco" JSONB NOT NULL,
    "metadata" JSONB,
    "pagadorTipoInscricao" VARCHAR(1) NOT NULL,
    "pagadorNumeroInscricao" VARCHAR(14) NOT NULL,
    "pagadorNome" VARCHAR(60) NOT NULL,
    "pagadorEndereco" VARCHAR(60) NOT NULL,
    "pagadorCep" VARCHAR(8) NOT NULL,
    "pagadorCidade" VARCHAR(30) NOT NULL,
    "pagadorBairro" VARCHAR(30) NOT NULL,
    "pagadorUf" VARCHAR(2) NOT NULL,
    "pagadorTelefone" VARCHAR(30),
    "pagadorEmail" VARCHAR(100),
    "valorAbatimento" DECIMAL(10,2),
    "quantidadeDiasProtesto" INTEGER,
    "quantidadeDiasNegativacao" INTEGER,
    "orgaoNegativador" VARCHAR(2),
    "beneficiarioFinalTipoInscricao" VARCHAR(1),
    "beneficiarioFinalNumeroInscricao" VARCHAR(14),
    "beneficiarioFinalNome" VARCHAR(30),
    "descontoTipo" INTEGER,
    "descontoValor" DECIMAL(10,2),
    "descontoPorcentagem" DECIMAL(5,2),
    "descontoDataExpiracao" TIMESTAMP(3),
    "segundoDescontoValor" DECIMAL(10,2),
    "segundoDescontoPorcentagem" DECIMAL(5,2),
    "segundoDescontoDataExpiracao" TIMESTAMP(3),
    "terceiroDescontoValor" DECIMAL(10,2),
    "terceiroDescontoPorcentagem" DECIMAL(5,2),
    "terceiroDescontoDataExpiracao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boletos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boleto_logs" (
    "id" SERIAL NOT NULL,
    "boletoId" INTEGER NOT NULL,
    "tipoOperacao" "TipoOperacaoBoletoLog" NOT NULL,
    "descricaoOperacao" VARCHAR(255) NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "usuarioId" INTEGER,
    "ipAddress" VARCHAR(50),
    "mensagemErro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boleto_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controle_sequencial_boleto" (
    "id" SERIAL NOT NULL,
    "contaCorrenteId" INTEGER NOT NULL,
    "convenio" VARCHAR(7) NOT NULL,
    "ultimoSequencial" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controle_sequencial_boleto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boletos_nossoNumero_key" ON "boletos"("nossoNumero");

-- CreateIndex
CREATE INDEX "boletos_pedidoId_idx" ON "boletos"("pedidoId");

-- CreateIndex
CREATE INDEX "boletos_convenioCobrancaId_idx" ON "boletos"("convenioCobrancaId");

-- CreateIndex
CREATE INDEX "boletos_contaCorrenteId_idx" ON "boletos"("contaCorrenteId");

-- CreateIndex
CREATE INDEX "boletos_statusBoleto_idx" ON "boletos"("statusBoleto");

-- CreateIndex
CREATE INDEX "boletos_dataVencimento_idx" ON "boletos"("dataVencimento");

-- CreateIndex
CREATE INDEX "boletos_numeroConvenio_idx" ON "boletos"("numeroConvenio");

-- CreateIndex
CREATE INDEX "boletos_usuarioCriacaoId_idx" ON "boletos"("usuarioCriacaoId");

-- CreateIndex
CREATE INDEX "boletos_nossoNumero_idx" ON "boletos"("nossoNumero");

-- CreateIndex
CREATE INDEX "boleto_logs_boletoId_idx" ON "boleto_logs"("boletoId");

-- CreateIndex
CREATE INDEX "boleto_logs_tipoOperacao_idx" ON "boleto_logs"("tipoOperacao");

-- CreateIndex
CREATE INDEX "boleto_logs_createdAt_idx" ON "boleto_logs"("createdAt");

-- CreateIndex
CREATE INDEX "boleto_logs_usuarioId_idx" ON "boleto_logs"("usuarioId");

-- CreateIndex
CREATE INDEX "controle_sequencial_boleto_contaCorrenteId_idx" ON "controle_sequencial_boleto"("contaCorrenteId");

-- CreateIndex
CREATE UNIQUE INDEX "controle_sequencial_boleto_contaCorrenteId_convenio_key" ON "controle_sequencial_boleto"("contaCorrenteId", "convenio");

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_convenioCobrancaId_fkey" FOREIGN KEY ("convenioCobrancaId") REFERENCES "convenio_cobranca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "conta_corrente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_usuarioCriacaoId_fkey" FOREIGN KEY ("usuarioCriacaoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_usuarioAlteracaoId_fkey" FOREIGN KEY ("usuarioAlteracaoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_usuarioBaixaId_fkey" FOREIGN KEY ("usuarioBaixaId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_usuarioPagamentoId_fkey" FOREIGN KEY ("usuarioPagamentoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boleto_logs" ADD CONSTRAINT "boleto_logs_boletoId_fkey" FOREIGN KEY ("boletoId") REFERENCES "boletos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boleto_logs" ADD CONSTRAINT "boleto_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controle_sequencial_boleto" ADD CONSTRAINT "controle_sequencial_boleto_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "conta_corrente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
