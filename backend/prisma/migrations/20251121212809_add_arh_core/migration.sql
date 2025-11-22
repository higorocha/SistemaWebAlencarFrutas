-- CreateEnum
CREATE TYPE "TipoContratoFuncionario" AS ENUM ('DIARISTA', 'MENSALISTA', 'EVENTUAL');

-- CreateEnum
CREATE TYPE "StatusFuncionario" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusFolhaPagamento" AS ENUM ('RASCUNHO', 'EM_PROCESSAMENTO', 'FECHADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusFuncionarioPagamento" AS ENUM ('PENDENTE', 'ENVIADO', 'ACEITO', 'PROCESSANDO', 'PAGO', 'REJEITADO', 'CANCELADO', 'ERRO');

-- CreateEnum
CREATE TYPE "MeioPagamentoFuncionario" AS ENUM ('PIX', 'PIX_API', 'ESPECIE');

-- CreateTable
CREATE TABLE "arh_cargos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "salarioMensal" DECIMAL(12,2) NOT NULL,
    "cargaHorariaMensal" INTEGER,
    "adicionalPericulosidade" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arh_cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arh_funcoes_diaristas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "valorDiariaBase" DECIMAL(12,2) NOT NULL,
    "duracaoPadraoHoras" INTEGER,
    "exigeEpi" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arh_funcoes_diaristas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arh_funcionarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(180) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "rg" VARCHAR(20),
    "pis" VARCHAR(20),
    "ctps" VARCHAR(30),
    "dataNascimento" TIMESTAMP(3),
    "telefone" VARCHAR(20),
    "celular" VARCHAR(20),
    "email" VARCHAR(120),
    "estadoCivil" VARCHAR(30),
    "endereco" JSONB,
    "dadosBancarios" JSONB,
    "dependentes" JSONB,
    "observacoes" TEXT,
    "tipoContrato" "TipoContratoFuncionario" NOT NULL,
    "cargoId" INTEGER,
    "funcaoId" INTEGER,
    "salarioCustomizado" DECIMAL(12,2),
    "valorDiariaCustomizada" DECIMAL(12,2),
    "recebeViaPixApi" BOOLEAN NOT NULL DEFAULT false,
    "meioPagamentoPreferido" "MeioPagamentoFuncionario" DEFAULT 'PIX',
    "status" "StatusFuncionario" NOT NULL DEFAULT 'ATIVO',
    "dataAdmissao" TIMESTAMP(3),
    "dataDemissao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arh_funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arh_folhas_pagamento" (
    "id" SERIAL NOT NULL,
    "competenciaMes" INTEGER NOT NULL,
    "competenciaAno" INTEGER NOT NULL,
    "referencia" VARCHAR(40),
    "status" "StatusFolhaPagamento" NOT NULL DEFAULT 'RASCUNHO',
    "observacoes" TEXT,
    "totalBruto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalLiquido" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalPago" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalPendente" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "quantidadeLancamentos" INTEGER NOT NULL DEFAULT 0,
    "dataProcessamento" TIMESTAMP(3),
    "dataFechamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arh_folhas_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arh_funcionarios_pagamento" (
    "id" SERIAL NOT NULL,
    "folhaId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "cargoId" INTEGER,
    "funcaoId" INTEGER,
    "tipoContrato" "TipoContratoFuncionario" NOT NULL,
    "referenciaNomeCargo" VARCHAR(120),
    "referenciaNomeFuncao" VARCHAR(120),
    "salarioBaseReferencia" DECIMAL(12,2),
    "valorDiariaAplicada" DECIMAL(12,2),
    "diasTrabalhados" INTEGER NOT NULL DEFAULT 0,
    "faltas" INTEGER NOT NULL DEFAULT 0,
    "horasExtras" DECIMAL(10,2),
    "valorHoraExtra" DECIMAL(10,2),
    "ajudaCusto" DECIMAL(12,2) DEFAULT 0,
    "descontosExtras" DECIMAL(12,2) DEFAULT 0,
    "adiantamento" DECIMAL(12,2) DEFAULT 0,
    "valorBruto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorLiquido" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "meioPagamento" "MeioPagamentoFuncionario" NOT NULL DEFAULT 'PIX',
    "pagamentoEfetuado" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" TIMESTAMP(3),
    "statusPagamento" "StatusFuncionarioPagamento" NOT NULL DEFAULT 'PENDENTE',
    "pagamentoApiItemId" INTEGER,
    "observacoes" TEXT,
    "funcionarioSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arh_funcionarios_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "arh_cargos_nome_key" ON "arh_cargos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "arh_funcoes_diaristas_nome_key" ON "arh_funcoes_diaristas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "arh_funcionarios_cpf_key" ON "arh_funcionarios"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "arh_folhas_pagamento_competenciaMes_competenciaAno_key" ON "arh_folhas_pagamento"("competenciaMes", "competenciaAno");

-- CreateIndex
CREATE UNIQUE INDEX "arh_funcionarios_pagamento_pagamentoApiItemId_key" ON "arh_funcionarios_pagamento"("pagamentoApiItemId");

-- CreateIndex
CREATE INDEX "arh_funcionarios_pagamento_folhaId_idx" ON "arh_funcionarios_pagamento"("folhaId");

-- CreateIndex
CREATE INDEX "arh_funcionarios_pagamento_statusPagamento_idx" ON "arh_funcionarios_pagamento"("statusPagamento");

-- CreateIndex
CREATE UNIQUE INDEX "arh_funcionarios_pagamento_folhaId_funcionarioId_key" ON "arh_funcionarios_pagamento"("folhaId", "funcionarioId");

-- CreateIndex
CREATE INDEX "pagamento_api_item_funcionarioPagamentoId_idx" ON "pagamento_api_item"("funcionarioPagamentoId");

-- AddForeignKey
ALTER TABLE "arh_funcionarios" ADD CONSTRAINT "arh_funcionarios_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "arh_cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_funcionarios" ADD CONSTRAINT "arh_funcionarios_funcaoId_fkey" FOREIGN KEY ("funcaoId") REFERENCES "arh_funcoes_diaristas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_funcionarios_pagamento" ADD CONSTRAINT "arh_funcionarios_pagamento_folhaId_fkey" FOREIGN KEY ("folhaId") REFERENCES "arh_folhas_pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_funcionarios_pagamento" ADD CONSTRAINT "arh_funcionarios_pagamento_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "arh_funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_funcionarios_pagamento" ADD CONSTRAINT "arh_funcionarios_pagamento_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "arh_cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_funcionarios_pagamento" ADD CONSTRAINT "arh_funcionarios_pagamento_funcaoId_fkey" FOREIGN KEY ("funcaoId") REFERENCES "arh_funcoes_diaristas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_funcionarios_pagamento" ADD CONSTRAINT "arh_funcionarios_pagamento_pagamentoApiItemId_fkey" FOREIGN KEY ("pagamentoApiItemId") REFERENCES "pagamento_api_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
