-- AlterTable
ALTER TABLE "conta_corrente" ADD COLUMN     "intervalo" INTEGER,
ADD COLUMN     "monitorar" BOOLEAN NOT NULL DEFAULT false;
