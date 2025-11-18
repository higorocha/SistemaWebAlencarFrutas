-- AlterTable
ALTER TABLE "pagamento_api_item" ADD COLUMN     "dataCancelamento" TIMESTAMP(3),
ADD COLUMN     "usuarioCancelamentoId" INTEGER;

-- AlterTable
ALTER TABLE "pagamento_api_lote" ADD COLUMN     "dataLiberacao" TIMESTAMP(3),
ADD COLUMN     "usuarioCriacaoId" INTEGER,
ADD COLUMN     "usuarioLiberacaoId" INTEGER;

-- CreateIndex
CREATE INDEX "pagamento_api_item_usuarioCancelamentoId_idx" ON "pagamento_api_item"("usuarioCancelamentoId");

-- CreateIndex
CREATE INDEX "pagamento_api_lote_usuarioCriacaoId_idx" ON "pagamento_api_lote"("usuarioCriacaoId");

-- CreateIndex
CREATE INDEX "pagamento_api_lote_usuarioLiberacaoId_idx" ON "pagamento_api_lote"("usuarioLiberacaoId");

-- AddForeignKey
ALTER TABLE "pagamento_api_lote" ADD CONSTRAINT "pagamento_api_lote_usuarioCriacaoId_fkey" FOREIGN KEY ("usuarioCriacaoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_api_lote" ADD CONSTRAINT "pagamento_api_lote_usuarioLiberacaoId_fkey" FOREIGN KEY ("usuarioLiberacaoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_api_item" ADD CONSTRAINT "pagamento_api_item_usuarioCancelamentoId_fkey" FOREIGN KEY ("usuarioCancelamentoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
