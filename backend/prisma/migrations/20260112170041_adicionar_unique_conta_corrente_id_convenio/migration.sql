/*
  Warnings:

  - A unique constraint covering the columns `[contaCorrenteId]` on the table `convenio_cobranca` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "convenio_cobranca_contaCorrenteId_key" ON "convenio_cobranca"("contaCorrenteId");
