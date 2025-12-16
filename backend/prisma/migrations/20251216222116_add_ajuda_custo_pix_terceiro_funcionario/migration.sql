-- AlterTable
ALTER TABLE "arh_funcionarios" ADD COLUMN     "ajudaCusto" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "pixTerceiro" BOOLEAN NOT NULL DEFAULT false;
