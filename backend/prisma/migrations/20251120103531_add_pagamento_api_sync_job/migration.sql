-- CreateEnum
CREATE TYPE "PagamentoApiSyncJobTipo" AS ENUM ('LOTE', 'ITEM');

-- CreateEnum
CREATE TYPE "PagamentoApiSyncJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "pagamento_api_sync_job" (
    "id" SERIAL NOT NULL,
    "tipo" "PagamentoApiSyncJobTipo" NOT NULL,
    "status" "PagamentoApiSyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "contaCorrenteId" INTEGER NOT NULL,
    "numeroRequisicao" INTEGER,
    "identificadorPagamento" TEXT,
    "loteId" INTEGER,
    "runAfter" TIMESTAMP(3) NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "ultimaExecucao" TIMESTAMP(3),
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamento_api_sync_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pagamento_api_sync_job_status_runAfter_idx" ON "pagamento_api_sync_job"("status", "runAfter");

-- CreateIndex
CREATE INDEX "pagamento_api_sync_job_tipo_numeroRequisicao_idx" ON "pagamento_api_sync_job"("tipo", "numeroRequisicao");

-- CreateIndex
CREATE INDEX "pagamento_api_sync_job_tipo_identificadorPagamento_idx" ON "pagamento_api_sync_job"("tipo", "identificadorPagamento");

-- CreateIndex
CREATE INDEX "pagamento_api_sync_job_contaCorrenteId_idx" ON "pagamento_api_sync_job"("contaCorrenteId");

-- AddForeignKey
ALTER TABLE "pagamento_api_sync_job" ADD CONSTRAINT "pagamento_api_sync_job_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "conta_corrente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_api_sync_job" ADD CONSTRAINT "pagamento_api_sync_job_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "pagamento_api_lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
