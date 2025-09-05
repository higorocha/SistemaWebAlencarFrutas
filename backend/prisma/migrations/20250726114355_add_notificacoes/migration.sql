-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('SISTEMA', 'PIX', 'COBRANCA', 'FATURA', 'BOLETO', 'ALERTA');

-- CreateEnum
CREATE TYPE "StatusNotificacao" AS ENUM ('NAO_LIDA', 'LIDA', 'DESCARTADA');

-- CreateEnum
CREATE TYPE "PrioridadeNotificacao" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL DEFAULT 'SISTEMA',
    "status" "StatusNotificacao" NOT NULL DEFAULT 'NAO_LIDA',
    "prioridade" "PrioridadeNotificacao" NOT NULL DEFAULT 'MEDIA',
    "usuario_id" INTEGER,
    "dados_adicionais" JSONB,
    "link" VARCHAR(255),
    "expirar_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
