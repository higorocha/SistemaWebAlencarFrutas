-- AlterTable
-- Adiciona campo desativar à tabela areas_agricolas com valor padrão false
-- Esta alteração é segura e não perde dados existentes
ALTER TABLE "areas_agricolas" ADD COLUMN IF NOT EXISTS "desativar" BOOLEAN NOT NULL DEFAULT false;
