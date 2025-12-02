/*
  Warnings:

  - You are about to drop the column `contaCorrenteId` on the `sequencia_numero_requisicao` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[numeroContratoPagamento]` on the table `sequencia_numero_requisicao` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numeroContratoPagamento` to the `sequencia_numero_requisicao` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "sequencia_numero_requisicao" DROP CONSTRAINT "sequencia_numero_requisicao_contaCorrenteId_fkey";

-- DropIndex
DROP INDEX "sequencia_numero_requisicao_contaCorrenteId_key";

-- AlterTable
ALTER TABLE "sequencia_numero_requisicao" DROP COLUMN "contaCorrenteId",
ADD COLUMN     "numeroContratoPagamento" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sequencia_numero_requisicao_numeroContratoPagamento_key" ON "sequencia_numero_requisicao"("numeroContratoPagamento");
