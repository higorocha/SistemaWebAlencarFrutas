/*
  Warnings:

  - You are about to drop the column `fitaColheita` on the `pedidos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "frutas_pedidos" ADD COLUMN     "fitaColheita" TEXT;

-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "fitaColheita";
