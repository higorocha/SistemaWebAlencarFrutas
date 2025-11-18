/*
  Warnings:

  - A unique constraint covering the columns `[contaCorrenteId]` on the table `sequencia_numero_requisicao` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contaCorrenteId` to the `sequencia_numero_requisicao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sequencia_numero_requisicao" ADD COLUMN     "contaCorrenteId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sequencia_numero_requisicao_contaCorrenteId_key" ON "sequencia_numero_requisicao"("contaCorrenteId");

-- AddForeignKey
ALTER TABLE "sequencia_numero_requisicao" ADD CONSTRAINT "sequencia_numero_requisicao_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "conta_corrente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
