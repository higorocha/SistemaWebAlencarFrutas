-- CreateIndex
CREATE INDEX "historico_pedidos_pedido_id_created_at_idx" ON "historico_pedidos"("pedido_id", "created_at");

-- CreateIndex
CREATE INDEX "historico_pedidos_usuario_id_idx" ON "historico_pedidos"("usuario_id");

-- CreateIndex
CREATE INDEX "historico_pedidos_acao_idx" ON "historico_pedidos"("acao");

-- CreateIndex
CREATE INDEX "historico_pedidos_created_at_idx" ON "historico_pedidos"("created_at");
