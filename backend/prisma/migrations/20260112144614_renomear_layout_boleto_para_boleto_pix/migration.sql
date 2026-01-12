/*
  Warnings:

  - You are about to drop the column `layoutBoletoFundoBranco` on the `convenio_cobranca` table. All the data in the column will be lost.
  - Added the required column `boletoPix` to the `convenio_cobranca` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "convenio_cobranca" DROP COLUMN "layoutBoletoFundoBranco",
ADD COLUMN     "boletoPix" BOOLEAN NOT NULL,
ADD COLUMN     "chavePix" TEXT;
