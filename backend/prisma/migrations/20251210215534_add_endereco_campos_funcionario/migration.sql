-- AlterTable
ALTER TABLE "arh_funcionarios" ADD COLUMN     "bairro" VARCHAR(50),
ADD COLUMN     "cep" VARCHAR(9),
ADD COLUMN     "cidade" VARCHAR(50),
ADD COLUMN     "complemento" VARCHAR(50),
ADD COLUMN     "estado" VARCHAR(2),
ADD COLUMN     "logradouro" VARCHAR(100),
ADD COLUMN     "numero" VARCHAR(10);
