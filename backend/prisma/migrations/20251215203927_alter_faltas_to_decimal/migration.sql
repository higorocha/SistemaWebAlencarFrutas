/*
  Warnings:

  - You are about to alter the column `faltas` on the `arh_funcionarios_pagamento` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "arh_funcionarios_pagamento" ALTER COLUMN "faltas" DROP NOT NULL,
ALTER COLUMN "faltas" SET DEFAULT 0,
ALTER COLUMN "faltas" SET DATA TYPE DECIMAL(10,2);
