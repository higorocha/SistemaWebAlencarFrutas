/*
  Warnings:

  - You are about to drop the column `meioPagamentoPreferido` on the `arh_funcionarios` table. All the data in the column will be lost.
  - You are about to drop the column `recebeViaPixApi` on the `arh_funcionarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "arh_funcionarios" DROP COLUMN "meioPagamentoPreferido",
DROP COLUMN "recebeViaPixApi",
ADD COLUMN     "apelido" VARCHAR(100),
ADD COLUMN     "chavePix" VARCHAR(200),
ADD COLUMN     "responsavelChavePix" VARCHAR(180);
