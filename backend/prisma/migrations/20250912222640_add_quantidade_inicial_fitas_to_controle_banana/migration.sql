/*
  Warnings:

  - Added the required column `quantidadeInicialFitas` to the `controle_banana` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "controle_banana" ADD COLUMN     "quantidadeInicialFitas" INTEGER NOT NULL;
