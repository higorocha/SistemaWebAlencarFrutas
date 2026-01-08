/*
  Warnings:

  - A unique constraint covering the columns `[adiantamentoId,folhaId,funcionarioPagamentoId,parcelaNumero]` on the table `arh_lancamentos_adiantamento` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "arh_lancamentos_adiantamento_adiantamentoId_folhaId_funcion_key";

-- CreateIndex
CREATE UNIQUE INDEX "arh_lancamentos_adiantamento_adiantamentoId_folhaId_funcion_key" ON "arh_lancamentos_adiantamento"("adiantamentoId", "folhaId", "funcionarioPagamentoId", "parcelaNumero");
