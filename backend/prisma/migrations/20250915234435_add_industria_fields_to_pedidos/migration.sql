-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "ind_data_descarga" TIMESTAMP(3),
ADD COLUMN     "ind_data_entrada" TIMESTAMP(3),
ADD COLUMN     "ind_media_mililitro" DOUBLE PRECISION,
ADD COLUMN     "ind_numero_nf" INTEGER,
ADD COLUMN     "ind_peso_medio" DOUBLE PRECISION;
