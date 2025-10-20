-- Adicionar novos níveis e campo cultura_id
ALTER TYPE "NivelUsuario" ADD VALUE 'GERENTE_GERAL';
ALTER TYPE "NivelUsuario" ADD VALUE 'ESCRITORIO';
ALTER TYPE "NivelUsuario" ADD VALUE 'GERENTE_CULTURA';

ALTER TABLE "usuarios" ADD COLUMN "cultura_id" INTEGER;
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cultura_id_fkey" FOREIGN KEY ("cultura_id") REFERENCES "culturas"("id") ON DELETE SET NULL;
CREATE INDEX "usuarios_cultura_id_idx" ON "usuarios"("cultura_id");
