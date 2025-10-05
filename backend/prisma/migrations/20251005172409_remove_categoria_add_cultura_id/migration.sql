/*
  Warnings:

  - You are about to drop the column `categoria` on the `frutas` table. All the data in the column will be lost.
  - Added the required column `cultura_id` to the `frutas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "frutas" DROP COLUMN "categoria",
ADD COLUMN     "cultura_id" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "CategoriaFruta";

-- AddForeignKey
ALTER TABLE "frutas" ADD CONSTRAINT "frutas_cultura_id_fkey" FOREIGN KEY ("cultura_id") REFERENCES "culturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
