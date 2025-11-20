const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const lotes = await prisma.pagamentoApiLote.groupBy({
      by: ['estadoRequisicao', 'estadoRequisicaoAtual', 'status'],
      _count: { _all: true },
    });
    console.log('Estados de lote:', lotes);

    const itens = await prisma.pagamentoApiItem.groupBy({
      by: ['estadoPagamentoIndividual', 'status'],
      _count: { _all: true },
    });
    console.log('Estados de itens:', itens);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

