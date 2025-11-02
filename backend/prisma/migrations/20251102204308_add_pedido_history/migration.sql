-- CreateTable
CREATE TABLE "historico_pedidos" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "acao" VARCHAR(255) NOT NULL,
    "status_anterior" "StatusPedido",
    "status_novo" "StatusPedido",
    "detalhes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_pedidos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "historico_pedidos" ADD CONSTRAINT "historico_pedidos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_pedidos" ADD CONSTRAINT "historico_pedidos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
