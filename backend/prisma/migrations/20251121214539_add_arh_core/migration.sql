/*
  Warnings:

  - Added the required column `usuarioCriacaoId` to the `arh_folhas_pagamento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "StatusFolhaPagamento" ADD VALUE 'PENDENTE_LIBERACAO';

-- AlterTable
ALTER TABLE "arh_folhas_pagamento" ADD COLUMN     "dataLiberacao" TIMESTAMP(3),
ADD COLUMN     "usuarioCriacaoId" INTEGER NOT NULL,
ADD COLUMN     "usuarioLiberacaoId" INTEGER;

-- AddForeignKey
ALTER TABLE "arh_folhas_pagamento" ADD CONSTRAINT "arh_folhas_pagamento_usuarioCriacaoId_fkey" FOREIGN KEY ("usuarioCriacaoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arh_folhas_pagamento" ADD CONSTRAINT "arh_folhas_pagamento_usuarioLiberacaoId_fkey" FOREIGN KEY ("usuarioLiberacaoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
