/*
  Warnings:

  - You are about to drop the `fornecedores` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusCliente" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO', 'PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_REALIZADO', 'PEDIDO_FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "UnidadeMedida" AS ENUM ('KG', 'CX', 'TON');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('PIX', 'BOLETO', 'TRANSFERENCIA', 'DINHEIRO');

-- DropTable
DROP TABLE "fornecedores";

-- DropEnum
DROP TYPE "StatusFornecedor";

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "razaoSocial" VARCHAR(100),
    "cnpj" VARCHAR(18),
    "cpf" VARCHAR(14),
    "inscricaoEstadual" VARCHAR(20),
    "inscricaoMunicipal" VARCHAR(20),
    "cep" VARCHAR(9),
    "logradouro" VARCHAR(100),
    "numero" VARCHAR(10),
    "complemento" VARCHAR(50),
    "bairro" VARCHAR(50),
    "cidade" VARCHAR(50),
    "estado" VARCHAR(2),
    "telefone1" VARCHAR(15),
    "telefone2" VARCHAR(15),
    "email1" VARCHAR(100),
    "email2" VARCHAR(100),
    "observacoes" TEXT,
    "status" "StatusCliente" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "numeroPedido" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "frutaId" INTEGER NOT NULL,
    "areaAgricolaId" INTEGER,
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevistaColheita" TIMESTAMP(3) NOT NULL,
    "dataColheita" TIMESTAMP(3),
    "quantidadePrevista" DOUBLE PRECISION NOT NULL,
    "quantidadeReal" DOUBLE PRECISION,
    "unidadeMedida1" "UnidadeMedida" NOT NULL,
    "unidadeMedida2" "UnidadeMedida",
    "fitaColheita" TEXT,
    "valorUnitario" DOUBLE PRECISION,
    "valorTotal" DOUBLE PRECISION,
    "frete" DOUBLE PRECISION,
    "icms" DOUBLE PRECISION,
    "desconto" DOUBLE PRECISION,
    "abatimento" DOUBLE PRECISION,
    "valorFinal" DOUBLE PRECISION,
    "metodoPagamento" "MetodoPagamento",
    "dataPagamento" TIMESTAMP(3),
    "status" "StatusPedido" NOT NULL DEFAULT 'PEDIDO_CRIADO',
    "observacoes" TEXT,
    "observacoesColheita" TEXT,
    "observacoesPagamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numeroPedido_key" ON "pedidos"("numeroPedido");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_frutaId_fkey" FOREIGN KEY ("frutaId") REFERENCES "frutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_areaAgricolaId_fkey" FOREIGN KEY ("areaAgricolaId") REFERENCES "areas_agricolas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
