-- CreateEnum
CREATE TYPE "CategoriaArea" AS ENUM ('COLONO', 'TECNICO', 'EMPRESARIAL', 'ADJACENTE');

-- CreateEnum
CREATE TYPE "PeriodicidadeCultura" AS ENUM ('PERENE', 'TEMPORARIA');

-- CreateTable
CREATE TABLE "culturas" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "periodicidade" "PeriodicidadeCultura" NOT NULL,
    "permitirConsorcio" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_agricolas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "categoria" "CategoriaArea" NOT NULL DEFAULT 'COLONO',
    "area_total" DOUBLE PRECISION NOT NULL,
    "coordenadas" JSONB,
    "mapa_leitura" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_agricolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes_culturas" (
    "id" SERIAL NOT NULL,
    "area_agricola_id" INTEGER NOT NULL,
    "cultura_id" INTEGER NOT NULL,
    "area_plantada" DOUBLE PRECISION NOT NULL,
    "area_produzindo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_culturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "culturas_descricao_key" ON "culturas"("descricao");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_culturas_area_agricola_id_cultura_id_key" ON "lotes_culturas"("area_agricola_id", "cultura_id");

-- AddForeignKey
ALTER TABLE "lotes_culturas" ADD CONSTRAINT "lotes_culturas_area_agricola_id_fkey" FOREIGN KEY ("area_agricola_id") REFERENCES "areas_agricolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_culturas" ADD CONSTRAINT "lotes_culturas_cultura_id_fkey" FOREIGN KEY ("cultura_id") REFERENCES "culturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
