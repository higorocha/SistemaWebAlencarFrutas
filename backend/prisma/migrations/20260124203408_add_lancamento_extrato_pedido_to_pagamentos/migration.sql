-- AlterTable
ALTER TABLE "pagamentos_pedidos" ADD COLUMN     "lancamentoExtratoPedidoId" INTEGER;

-- AddForeignKey
ALTER TABLE "pagamentos_pedidos" ADD CONSTRAINT "pagamentos_pedidos_lancamentoExtratoPedidoId_fkey" FOREIGN KEY ("lancamentoExtratoPedidoId") REFERENCES "lancamentos_extrato_pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
