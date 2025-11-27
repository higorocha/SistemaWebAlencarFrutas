-- AlterTable
ALTER TABLE "arh_folhas_pagamento" ADD COLUMN     "contaCorrenteId" INTEGER,
ADD COLUMN     "dataPagamento" TIMESTAMP(3),
ADD COLUMN     "meioPagamento" "MeioPagamentoFuncionario";

-- AddForeignKey
ALTER TABLE "arh_folhas_pagamento" ADD CONSTRAINT "arh_folhas_pagamento_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "conta_corrente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
