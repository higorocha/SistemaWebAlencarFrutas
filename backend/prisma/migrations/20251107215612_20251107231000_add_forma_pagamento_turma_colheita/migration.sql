/*
  Warnings:

  - You are about to drop the column `forma_pagamento` on the `turma_colheita_pedido_custo` table. All the data in the column will be lost.

*/
-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'turma_colheita_pedido_custo'
      AND column_name = 'forma_pagamento'
  ) THEN
    ALTER TABLE "turma_colheita_pedido_custo" DROP COLUMN "forma_pagamento";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'turma_colheita_pedido_custo'
      AND column_name = 'formaPagamento'
  ) THEN
    ALTER TABLE "turma_colheita_pedido_custo" ADD COLUMN "formaPagamento" VARCHAR(50);
  END IF;
END $$;
