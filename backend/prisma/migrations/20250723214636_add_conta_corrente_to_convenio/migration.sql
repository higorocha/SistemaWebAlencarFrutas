/*
  Warnings:

  - A unique constraint covering the columns `[bancoCodigo,agencia,contaCorrente]` on the table `conta_corrente` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "convenio_cobranca" (
    "id" SERIAL NOT NULL,
    "contaCorrenteId" INTEGER NOT NULL,
    "juros" DOUBLE PRECISION NOT NULL,
    "diasAberto" INTEGER NOT NULL,
    "multaAtiva" BOOLEAN NOT NULL,
    "layoutBoletoFundoBranco" BOOLEAN NOT NULL,
    "valorMulta" DOUBLE PRECISION,
    "carenciaMulta" INTEGER,
    "convenio" TEXT NOT NULL,
    "carteira" TEXT NOT NULL,
    "variacao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convenio_cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conta_corrente_bancoCodigo_agencia_contaCorrente_key" ON "conta_corrente"("bancoCodigo", "agencia", "contaCorrente");

-- AddForeignKey
ALTER TABLE "convenio_cobranca" ADD CONSTRAINT "convenio_cobranca_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "conta_corrente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
