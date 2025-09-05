-- CreateEnum
CREATE TYPE "StatusFornecedor" AS ENUM ('ATIVO', 'INATIVO');

-- CreateTable
CREATE TABLE "fornecedores" (
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
    "status" "StatusFornecedor" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);
