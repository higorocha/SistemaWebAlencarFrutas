/*
  Warnings:

  - You are about to drop the column `abatimento` on the `pedidos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "abatimento",
ADD COLUMN     "avaria" DOUBLE PRECISION,
ADD COLUMN     "nomeMotorista" TEXT,
ADD COLUMN     "pesagem" TEXT,
ADD COLUMN     "placaPrimaria" TEXT,
ADD COLUMN     "placaSecundaria" TEXT;
