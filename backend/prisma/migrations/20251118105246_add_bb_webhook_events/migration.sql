-- CreateTable
CREATE TABLE "bb_webhook_events" (
    "id" SERIAL NOT NULL,
    "tipoRecurso" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "statusProcessamento" TEXT NOT NULL DEFAULT 'PENDENTE',
    "motivoDescarta" TEXT,
    "erros" JSONB,
    "quantidadeItens" INTEGER,
    "quantidadeProcessados" INTEGER,
    "quantidadeDescartados" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bb_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bb_webhook_events_tipoRecurso_idx" ON "bb_webhook_events"("tipoRecurso");

-- CreateIndex
CREATE INDEX "bb_webhook_events_statusProcessamento_idx" ON "bb_webhook_events"("statusProcessamento");

-- CreateIndex
CREATE INDEX "bb_webhook_events_receivedAt_idx" ON "bb_webhook_events"("receivedAt");
