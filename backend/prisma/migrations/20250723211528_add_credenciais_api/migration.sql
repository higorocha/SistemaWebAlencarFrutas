-- CreateTable
CREATE TABLE "credenciais_api" (
    "id" SERIAL NOT NULL,
    "banco" TEXT NOT NULL,
    "contaCorrenteId" INTEGER NOT NULL,
    "modalidadeApi" TEXT NOT NULL,
    "developerAppKey" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "clienteSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credenciais_api_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credenciais_api_banco_contaCorrenteId_modalidadeApi_key" ON "credenciais_api"("banco", "contaCorrenteId", "modalidadeApi");

-- AddForeignKey
ALTER TABLE "credenciais_api" ADD CONSTRAINT "credenciais_api_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "conta_corrente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
