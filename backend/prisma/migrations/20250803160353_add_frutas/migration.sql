-- CreateEnum
CREATE TYPE "CategoriaFruta" AS ENUM ('CITRICOS', 'TROPICAIS', 'TEMPERADAS', 'SECAS', 'EXOTICAS', 'VERMELHAS', 'VERDES');

-- CreateEnum
CREATE TYPE "StatusFruta" AS ENUM ('ATIVA', 'INATIVA');

-- CreateTable
CREATE TABLE "frutas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "codigo" TEXT,
    "categoria" "CategoriaFruta",
    "descricao" TEXT,
    "status" "StatusFruta" DEFAULT 'ATIVA',
    "nome_cientifico" TEXT,
    "cor_predominante" TEXT,
    "epoca_colheita" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frutas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "frutas_codigo_key" ON "frutas"("codigo");
