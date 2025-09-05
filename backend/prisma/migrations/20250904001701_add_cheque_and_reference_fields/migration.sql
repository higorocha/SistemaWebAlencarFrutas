-- AlterEnum
ALTER TYPE "MetodoPagamento" ADD VALUE 'CHEQUE';

-- AlterTable
ALTER TABLE "pagamentos_pedidos" ADD COLUMN     "chequeCompensado" BOOLEAN DEFAULT false,
ADD COLUMN     "referenciaExterna" VARCHAR(100);
