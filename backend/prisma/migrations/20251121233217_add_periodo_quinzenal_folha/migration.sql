/*
  Warnings:

  - A unique constraint covering the columns `[competenciaMes,competenciaAno,periodo]` on the table `arh_folhas_pagamento` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `periodo` to the `arh_folhas_pagamento` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "arh_folhas_pagamento_competenciaMes_competenciaAno_key";

-- AlterTable
ALTER TABLE "arh_folhas_pagamento" ADD COLUMN     "periodo" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "arh_folhas_pagamento_competenciaMes_competenciaAno_periodo_key" ON "arh_folhas_pagamento"("competenciaMes", "competenciaAno", "periodo");
