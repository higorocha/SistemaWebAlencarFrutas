/**
 * Reconciliação PIX-API (colheitas) - Diagnóstico
 *
 * Objetivo:
 * - Dado um pedidoId, identificar colheitas (TurmaColheitaPedidoCusto) com valorColheita
 *   que ficaram PENDENTE/PROCESSANDO e sem vínculo em PagamentoApiItemColheita,
 *   e tentar encontrar um PagamentoApiItem PROCESSADO cujo "gap" (valorEnviado - soma vínculos)
 *   bata exatamente com o valor da colheita faltante.
 *
 * Uso:
 *   cd SistemaWebAlencarFrutas/backend
 *   npx ts-node scripts/reconciliar-pix-colheita.ts --pedidoId 528
 *
 * Opcional:
 *   --verbose
 */

import { PrismaClient, StatusPagamentoItem, TipoPagamentoApi } from '@prisma/client';

const prisma = new PrismaClient();

type Args = {
  pedidoId: number;
  verbose: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: any = { verbose: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pedidoId') {
      args.pedidoId = Number(argv[++i]);
    } else if (a === '--verbose') {
      args.verbose = true;
    }
  }
  if (!args.pedidoId || Number.isNaN(args.pedidoId)) {
    throw new Error('Uso: npx ts-node scripts/reconciliar-pix-colheita.ts --pedidoId <id> [--verbose]');
  }
  return args as Args;
}

function toNumberMoney(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  // Prisma Decimal
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
  return Number(v);
}

function moneyEq(a: number, b: number, tol = 0.01): boolean {
  return Math.abs(a - b) <= tol;
}

async function main() {
  const { pedidoId, verbose } = parseArgs(process.argv);

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { id: true, numeroPedido: true, status: true },
  });
  if (!pedido) {
    throw new Error(`Pedido não encontrado: id=${pedidoId}`);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔎 RECONCILIAÇÃO PIX-API (DIAGNÓSTICO)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Pedido ID: ${pedido.id}`);
  console.log(`Número Pedido: ${pedido.numeroPedido}`);
  console.log(`Status Pedido: ${pedido.status}`);
  console.log('');

  const custos = await prisma.turmaColheitaPedidoCusto.findMany({
    where: { pedidoId },
    include: {
      turmaColheita: { select: { id: true, nomeColhedor: true } },
      pagamentoApiItemColheitas: {
        include: {
          pagamentoApiItem: {
            select: {
              id: true,
              valorEnviado: true,
              status: true,
              processadoComSucesso: true,
              descricaoInstantaneoEnviada: true,
              ultimaAtualizacaoStatus: true,
              payloadConsultaIndividual: true,
              lote: {
                select: {
                  id: true,
                  numeroRequisicao: true,
                  tipoPagamentoApi: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  if (custos.length === 0) {
    console.log('Nenhuma colheita (TurmaColheitaPedidoCusto) encontrada para o pedido.');
    return;
  }

  const custosSemVinculo = custos.filter((c) => (c.pagamentoApiItemColheitas?.length ?? 0) === 0);
  const custosComVinculo = custos.filter((c) => (c.pagamentoApiItemColheitas?.length ?? 0) > 0);

  console.log(`Total de colheitas no pedido: ${custos.length}`);
  console.log(`- Com vínculo PIX-API: ${custosComVinculo.length}`);
  console.log(`- Sem vínculo PIX-API: ${custosSemVinculo.length}`);
  console.log('');

  const candidatas = custosSemVinculo
    .filter((c) => c.valorColheita != null)
    .filter((c) => ['PENDENTE', 'PROCESSANDO'].includes(String(c.statusPagamento)));

  if (candidatas.length === 0) {
    console.log('✅ Nenhuma colheita pendente/processando sem vínculo PIX-API encontrada para este pedido.');
    return;
  }

  console.log('Colheitas candidatas (pendente/processando e sem vínculo):');
  for (const c of candidatas) {
    console.log(
      `- colheitaId=${c.id} turmaColheitaId=${c.turmaColheitaId} (${c.turmaColheita?.nomeColhedor ?? 'N/A'}) valor=R$ ${toNumberMoney(c.valorColheita).toFixed(2)} status=${c.statusPagamento}`,
    );
  }
  console.log('');

  // Buscar itens de pagamento PIX-API relacionados às turmas presentes nessas colheitas
  const turmaIds = Array.from(new Set(candidatas.map((c) => c.turmaColheitaId)));

  const itensPossiveis = await prisma.pagamentoApiItem.findMany({
    where: {
      status: StatusPagamentoItem.PROCESSADO,
      processadoComSucesso: true,
      lote: {
        tipoPagamentoApi: TipoPagamentoApi.PIX,
      },
      OR: turmaIds.map((turmaColheitaId) => ({
        colheitas: {
          some: {
            turmaColheitaCusto: {
              turmaColheitaId,
            },
          },
        },
      })),
    },
    include: {
      lote: { select: { id: true, numeroRequisicao: true, tipoPagamentoApi: true, status: true } },
      colheitas: {
        select: {
          id: true,
          valorColheita: true,
          turmaColheitaCustoId: true,
          turmaColheitaCusto: {
            select: { id: true, turmaColheitaId: true, pedidoId: true, dataPagamento: true },
          },
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  if (itensPossiveis.length === 0) {
    console.log('⚠️ Nenhum PagamentoApiItem PROCESSADO (PIX) encontrado para as turmas relacionadas.');
    return;
  }

  if (verbose) {
    console.log(`Itens PIX PROCESSADOS candidatos: ${itensPossiveis.length}`);
  }

  const sugestoes: Array<{
    colheitaId: number;
    colheitaValor: number;
    turmaColheitaId: number;
    itemId: number;
    loteId: number;
    numeroRequisicao: number;
    itemValor: number;
    somaVinculos: number;
    diferenca: number;
    score: number;
    matchNumeroPedido: boolean;
  }> = [];

  for (const c of candidatas) {
    const valorColheita = toNumberMoney(c.valorColheita);
    for (const item of itensPossiveis) {
      // precisa bater turma
      const turmaDoItem = item.colheitas?.[0]?.turmaColheitaCusto?.turmaColheitaId;
      if (turmaDoItem !== c.turmaColheitaId) continue;

      const soma = item.colheitas.reduce((acc, rel) => acc + toNumberMoney(rel.valorColheita), 0);
      const itemValor = toNumberMoney(item.valorEnviado);
      const diff = Number((itemValor - soma).toFixed(2));

      if (!moneyEq(diff, valorColheita)) continue;

      const matchNumeroPedido =
        (item.descricaoInstantaneoEnviada || '').toString().trim() === (pedido.numeroPedido || '').toString().trim();

      // score simples: preferir item que tem descricaoInstantaneo igual ao numero do pedido
      const score = (matchNumeroPedido ? 10 : 0) + 1;

      sugestoes.push({
        colheitaId: c.id,
        colheitaValor: valorColheita,
        turmaColheitaId: c.turmaColheitaId,
        itemId: item.id,
        loteId: item.lote.id,
        numeroRequisicao: item.lote.numeroRequisicao,
        itemValor,
        somaVinculos: Number(soma.toFixed(2)),
        diferenca: diff,
        score,
        matchNumeroPedido,
      });
    }
  }

  if (sugestoes.length === 0) {
    console.log('⚠️ Nenhuma correspondência exata encontrada (diferença do item == valor colheita faltante).');
    console.log('Dica: verifique se o item PIX está PROCESSADO e se a colheita faltante tem o valor correto.');
    return;
  }

  // ordenar e escolher melhor sugestão por colheita
  sugestoes.sort((a, b) => b.score - a.score);

  console.log('✅ Sugestões encontradas (vínculo faltante):');
  for (const s of sugestoes) {
    console.log(
      `- colheitaId=${s.colheitaId} (R$ ${s.colheitaValor.toFixed(2)}) -> itemId=${s.itemId} lote=${s.numeroRequisicao} ` +
        `itemValor=R$ ${s.itemValor.toFixed(2)} somaVinculos=R$ ${s.somaVinculos.toFixed(2)} diff=R$ ${s.diferenca.toFixed(2)} ` +
        `${s.matchNumeroPedido ? '[match numeroPedido]' : ''}`,
    );
  }

  console.log('');
  console.log('Próximo passo: executar o script de correção em dry-run:');
  console.log(`npx ts-node scripts/aplicar-reconciliacao-pix-colheita.ts --pedidoId ${pedidoId} --dry-run`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('❌ Erro:', err instanceof Error ? err.message : err);
    await prisma.$disconnect();
    process.exit(1);
  });


