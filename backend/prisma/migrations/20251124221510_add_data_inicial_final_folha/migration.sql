/*
  Warnings:

  - Added the required column `dataFinal` to the `arh_folhas_pagamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataInicial` to the `arh_folhas_pagamento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "arh_folhas_pagamento" ADD COLUMN     "dataFinal" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dataInicial" TIMESTAMP(3) NOT NULL;
