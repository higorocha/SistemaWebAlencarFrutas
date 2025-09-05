-- CreateTable
CREATE TABLE "config_emails" (
    "id" SERIAL NOT NULL,
    "servidorSMTP" TEXT NOT NULL,
    "porta" INTEGER NOT NULL,
    "emailEnvio" TEXT NOT NULL,
    "nomeExibicao" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "metodoAutenticacao" TEXT NOT NULL,
    "timeoutConexao" INTEGER NOT NULL,
    "usarSSL" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_whatsapp" (
    "id" SERIAL NOT NULL,
    "phone_number_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "business_account_id" TEXT,
    "verify_token" TEXT,
    "numero_telefone" TEXT NOT NULL,
    "nome_exibicao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "webhook_url" TEXT,
    "configuracoes_adicionais" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_whatsapp_pkey" PRIMARY KEY ("id")
);
