/*
  Warnings:

  - You are about to drop the column `descontosExtras` on the `arh_funcionarios_pagamento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "arh_funcionarios_pagamento" DROP COLUMN "descontosExtras",
ADD COLUMN     "extras" DECIMAL(12,2) DEFAULT 0;
