/*
  Warnings:

  - Added the required column `contaDestino` to the `pagamentos_pedidos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContaDestino" AS ENUM ('ALENCAR', 'FRANCIALDA', 'GAVETA');

-- AlterTable
ALTER TABLE "pagamentos_pedidos" ADD COLUMN     "contaDestino" "ContaDestino" NOT NULL;
