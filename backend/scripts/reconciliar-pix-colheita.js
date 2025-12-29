/**
 * Reconciliação PIX-API (colheitas) - Diagnóstico (JS)
 *
 * Uso:
 *   cd SistemaWebAlencarFrutas/backend
 *   node scripts/reconciliar-pix-colheita.js --pedidoId 528 --verbose
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = { verbose: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pedidoId') args.pedidoId = Number(argv[++i]);
    else if (a === '--verbose') args.verbose = true;
  }
  if (!args.pedidoId || Number.isNaN(args.pedidoId)) {
    throw new Error('Uso: node scripts/reconciliar-pix-colheita.js --pedidoId <id> [--verbose]');
  }
  return args;
}

function toNumberMoney(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
  return Number(v);
}

function moneyEq(a, b, tol = 0.01) {
  return Math.abs(a - b) <= tol;
}

async function main() {
  const { pedidoId, verbose } = parseArgs(process.argv);

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { id: true, numeroPedido: true, status: true },
  });
  if (!pedido) throw new Error(`Pedido não encontrado: id=${pedidoId}`);

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
                select: { id: true, numeroRequisicao: true, tipoPagamentoApi: true, status: true },
              },
            },
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

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
    console.log('✅ Nenhuma colheita pendente/processando sem vínculo PIX-API encontrada.');
    return;
  }

  console.log('Colheitas candidatas (pendente/processando e sem vínculo):');
  for (const c of candidatas) {
    console.log(
      `- colheitaId=${c.id} turmaColheitaId=${c.turmaColheitaId} (${c.turmaColheita?.nomeColhedor ?? 'N/A'}) valor=R$ ${toNumberMoney(
        c.valorColheita,
      ).toFixed(2)} status=${c.statusPagamento}`,
    );
  }
  console.log('');

  // ✅ NOVO: Buscar itens PIX PROCESSADOS do MESMO numeroPedido, inclusive itens com 0 vínculos.
  // Isso cobre o caso "colheita única" onde o vínculo foi apagado e o item ficou "órfão".
  const itensPossiveis = await prisma.pagamentoApiItem.findMany({
    where: {
      status: 'PROCESSADO',
      processadoComSucesso: true,
      lote: { tipoPagamentoApi: 'PIX' },
      descricaoInstantaneoEnviada: (pedido.numeroPedido || '').toString().trim(),
    },
    include: {
      lote: { select: { id: true, numeroRequisicao: true, tipoPagamentoApi: true, status: true } },
      colheitas: {
        select: {
          valorColheita: true,
          turmaColheitaCusto: { select: { turmaColheitaId: true } },
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  if (itensPossiveis.length === 0) {
    console.log('⚠️ Nenhum PagamentoApiItem PROCESSADO (PIX) encontrado para este número de pedido.');
    return;
  }
  if (verbose) console.log(`Itens PIX PROCESSADOS candidatos: ${itensPossiveis.length}`);

  const sugestoes = [];
  // Para evitar mostrar o mesmo item para duas colheitas com o mesmo valor (ex.: R$ 60 duas vezes),
  // fazemos uma escolha 1:1 também no diagnóstico (melhor para visualizar o plano de correção).
  const usados = new Set();

  const turmas = await prisma.turmaColheita.findMany({
    where: { id: { in: Array.from(new Set(candidatas.map((c) => c.turmaColheitaId))) } },
    select: { id: true, nomeColhedor: true, chavePix: true, responsavelChavePix: true },
  });
  const turmaById = new Map(turmas.map((t) => [t.id, t]));

  for (const c of candidatas) {
    const valorColheita = toNumberMoney(c.valorColheita);
    const candidatos = [];
    for (const item of itensPossiveis) {
      if (usados.has(item.id)) continue;
      const soma = item.colheitas.reduce((acc, rel) => acc + toNumberMoney(rel.valorColheita), 0);
      const itemValor = toNumberMoney(item.valorEnviado);
      const diff = Number((itemValor - soma).toFixed(2));
      if (!moneyEq(diff, valorColheita)) continue;

      const matchNumeroPedido =
        (item.descricaoInstantaneoEnviada || '').toString().trim() === (pedido.numeroPedido || '').toString().trim();
      const turmaDoItem = item.colheitas?.[0]?.turmaColheitaCusto?.turmaColheitaId;
      const turmaMatch = turmaDoItem ? turmaDoItem === c.turmaColheitaId : null; // null = item sem vínculos

      const turma = turmaById.get(c.turmaColheitaId) || null;
      const chaveItem = (item.chavePixEnviada || '').toString().trim();
      const respItem = (item.responsavelChavePixEnviado || '').toString().trim().toUpperCase();
      const chaveTurma = (turma?.chavePix || '').toString().trim();
      const respTurma = (turma?.responsavelChavePix || '').toString().trim().toUpperCase();
      const nomeTurma = (turma?.nomeColhedor || '').toString().trim().toUpperCase();
      const pixKeyMatch = chaveItem && chaveTurma && chaveItem === chaveTurma;
      const pixRespMatch =
        respItem &&
        (respItem === respTurma || respItem === nomeTurma || respItem.includes(nomeTurma) || nomeTurma.includes(respItem));

      candidatos.push({
        item,
        matchNumeroPedido,
        turmaMatch,
        pixKeyMatch,
        pixRespMatch,
        soma,
        itemValor,
        diff,
      });
    }

    if (candidatos.length === 0) continue;

    candidatos.sort((a, b) => {
      const rank = (x) => {
        if (x.turmaMatch === true) return 0;
        if (x.turmaMatch === false) return 3;
        if (x.pixKeyMatch) return 1;
        if (x.pixRespMatch) return 2;
        return 4;
      };
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      const ta = a.item.createdAt ? new Date(a.item.createdAt).getTime() : 0;
      const tb = b.item.createdAt ? new Date(b.item.createdAt).getTime() : 0;
      return ta - tb;
    });

    const escolhido = candidatos[0];
    usados.add(escolhido.item.id);

    sugestoes.push({
      colheitaId: c.id,
      colheitaValor: valorColheita,
      itemId: escolhido.item.id,
      numeroRequisicao: escolhido.item.lote.numeroRequisicao,
      itemValor: escolhido.itemValor,
      somaVinculos: Number(escolhido.soma.toFixed(2)),
      diferenca: escolhido.diff,
      matchNumeroPedido: escolhido.matchNumeroPedido,
      turmaMatch: escolhido.turmaMatch,
      itemTemVinculos: escolhido.item.colheitas.length > 0,
    });
  }

  if (sugestoes.length === 0) {
    console.log('⚠️ Nenhuma correspondência exata encontrada (diferença do item == valor colheita faltante).');
    return;
  }

  console.log('✅ Sugestões encontradas (vínculo faltante):');
  for (const s of sugestoes) {
    console.log(
      `- colheitaId=${s.colheitaId} (R$ ${s.colheitaValor.toFixed(2)}) -> itemId=${s.itemId} lote=${s.numeroRequisicao} ` +
        `itemValor=R$ ${s.itemValor.toFixed(2)} somaVinculos=R$ ${s.somaVinculos.toFixed(2)} diff=R$ ${s.diferenca.toFixed(2)} ` +
        `${s.matchNumeroPedido ? '[match numeroPedido]' : ''}` +
        `${s.itemTemVinculos ? (s.turmaMatch === true ? ' [turma ok]' : s.turmaMatch === false ? ' [turma diferente]' : '') : ' [item sem vínculos]'}`,
    );
  }

  console.log('');
  console.log('Próximo passo (dry-run correção):');
  console.log(`node scripts/aplicar-reconciliacao-pix-colheita.js --pedidoId ${pedidoId} --dry-run`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('❌ Erro:', err?.message || err);
    await prisma.$disconnect();
    process.exit(1);
  });


