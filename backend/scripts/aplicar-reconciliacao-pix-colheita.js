/**
 * Reconciliação PIX-API (colheitas) - Correção (JS)
 *
 * Uso:
 *   cd SistemaWebAlencarFrutas/backend
 *   node scripts/aplicar-reconciliacao-pix-colheita.js --pedidoId 528 --dry-run
 *   node scripts/aplicar-reconciliacao-pix-colheita.js --pedidoId 528 --apply
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = { apply: false, dryRun: true };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pedidoId') args.pedidoId = Number(argv[++i]);
    else if (a === '--apply') {
      args.apply = true;
      args.dryRun = false;
    } else if (a === '--dry-run') {
      args.dryRun = true;
      args.apply = false;
    }
  }
  if (!args.pedidoId || Number.isNaN(args.pedidoId)) {
    throw new Error(
      'Uso: node scripts/aplicar-reconciliacao-pix-colheita.js --pedidoId <id> (--dry-run | --apply)',
    );
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

function parseDataPagamentoFromBB(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (/^\d{8}$/.test(s)) {
      const dd = Number(s.slice(0, 2));
      const mm = Number(s.slice(2, 4));
      const yyyy = Number(s.slice(4, 8));
      if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) return new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

async function main() {
  const { pedidoId, apply, dryRun } = parseArgs(process.argv);

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { id: true, numeroPedido: true },
  });
  if (!pedido) throw new Error(`Pedido não encontrado: id=${pedidoId}`);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🧩 RECONCILIAÇÃO PIX-API (CORREÇÃO) - Pedido ${pedido.numeroPedido} (id=${pedidoId})`);
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const custos = await prisma.turmaColheitaPedidoCusto.findMany({
    where: { pedidoId },
    include: {
      pagamentoApiItemColheitas: { select: { id: true } },
    },
    orderBy: { id: 'asc' },
  });

  const faltantes = custos
    .filter((c) => (c.pagamentoApiItemColheitas?.length ?? 0) === 0)
    .filter((c) => c.valorColheita != null)
    .filter((c) => ['PENDENTE', 'PROCESSANDO'].includes(String(c.statusPagamento)));

  if (faltantes.length === 0) {
    console.log('✅ Nenhuma colheita faltante para reconciliar neste pedido.');
    return;
  }

  // ✅ NOVO: buscar itens PIX PROCESSADOS do MESMO numeroPedido, inclusive itens com 0 vínculos.
  const itensPossiveis = await prisma.pagamentoApiItem.findMany({
    where: {
      status: 'PROCESSADO',
      processadoComSucesso: true,
      lote: { tipoPagamentoApi: 'PIX' },
      descricaoInstantaneoEnviada: (pedido.numeroPedido || '').toString().trim(),
    },
    select: {
      id: true,
      valorEnviado: true,
      createdAt: true,
      chavePixEnviada: true,
      responsavelChavePixEnviado: true,
      payloadConsultaIndividual: true,
      lote: { select: { id: true, numeroRequisicao: true } },
      colheitas: {
        include: {
          turmaColheitaCusto: { select: { turmaColheitaId: true, dataPagamento: true } },
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  // Carregar dados das turmas para melhorar o match em itens "órfãos" (sem vínculos)
  const turmaIds = Array.from(new Set(faltantes.map((c) => c.turmaColheitaId)));
  const turmas = await prisma.turmaColheita.findMany({
    where: { id: { in: turmaIds } },
    select: { id: true, nomeColhedor: true, chavePix: true, responsavelChavePix: true },
  });
  const turmaById = new Map(turmas.map((t) => [t.id, t]));

  // Vamos escolher itens de forma 1:1 (não reutilizar o mesmo item para duas colheitas).
  // Para valores repetidos (ex: R$ 60 duas vezes), precisamos de itens distintos com diff=60.
  const usados = new Set();
  const correcoes = [];

  for (const c of faltantes) {
    const valorColheita = toNumberMoney(c.valorColheita);
    // candidatos por valor (diff == valorColheita) e ainda não usados
    const candidatos = [];
    for (const item of itensPossiveis) {
      if (usados.has(item.id)) continue;
      const soma = item.colheitas.reduce((acc, rel) => acc + toNumberMoney(rel.valorColheita), 0);
      const itemValor = toNumberMoney(item.valorEnviado);
      const diff = Number((itemValor - soma).toFixed(2));
      if (!moneyEq(diff, valorColheita)) continue;

      // Se item tiver vínculos, preferir os que batem turma
      const turmaDoItem = item.colheitas?.[0]?.turmaColheitaCusto?.turmaColheitaId || null;
      const turmaMatch = turmaDoItem ? turmaDoItem === c.turmaColheitaId : null;

      // Melhorar match para itens sem vínculos usando chavePix/responsável
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

      const dataDoItem = item.colheitas
        .map((rel) => rel.turmaColheitaCusto?.dataPagamento)
        .filter(Boolean)
        .sort((a, b) => a.getTime() - b.getTime())
        .pop();

      const payload = item.payloadConsultaIndividual || null;
      const dataBB = parseDataPagamentoFromBB(payload?.dataPagamento) || parseDataPagamentoFromBB(payload?.dataPagamentoEfetivo);
      const dataPagamento = dataDoItem || dataBB || new Date();

      candidatos.push({
        item,
        turmaMatch,
        dataPagamento,
        pixKeyMatch,
        pixRespMatch,
      });
    }

    if (candidatos.length === 0) continue;

    // ordenar:
    // 1) se item tem vínculos: preferir turmaMatch=true
    // 2) se item sem vínculos: preferir chavePix/responsável bater na turma
    // 3) desempate por createdAt (mais antigo primeiro tende a ser o pagamento original do período)
    candidatos.sort((a, b) => {
      const rank = (x) => {
        if (x.turmaMatch === true) return 0;
        if (x.turmaMatch === false) return 3;
        // sem vínculos (turmaMatch=null)
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

    correcoes.push({
      colheitaId: c.id,
      turmaColheitaId: c.turmaColheitaId,
      valorColheita,
      itemId: escolhido.item.id,
      loteId: escolhido.item.lote.id,
      numeroRequisicao: escolhido.item.lote.numeroRequisicao,
      dataPagamento: escolhido.dataPagamento,
    });
  }

  if (correcoes.length === 0) {
    console.log('⚠️ Não foi encontrada correção automática com correspondência exata de valores.');
    return;
  }

  console.log('Correções propostas:');
  for (const c of correcoes) {
    console.log(
      `- colheitaId=${c.colheitaId} turmaColheitaId=${c.turmaColheitaId} valor=R$ ${c.valorColheita.toFixed(2)} -> itemId=${c.itemId} lote=${c.numeroRequisicao}`,
    );
  }
  console.log('');

  if (dryRun) {
    console.log('DRY-RUN: nada foi alterado. Execute com --apply para aplicar.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const c of correcoes) {
      const exists = await tx.pagamentoApiItemColheita.findFirst({
        where: { pagamentoApiItemId: c.itemId, turmaColheitaCustoId: c.colheitaId },
        select: { id: true },
      });
      if (!exists) {
        await tx.pagamentoApiItemColheita.create({
          data: {
            pagamentoApiItemId: c.itemId,
            turmaColheitaCustoId: c.colheitaId,
            valorColheita: c.valorColheita,
          },
        });
      }

      await tx.turmaColheitaPedidoCusto.update({
        where: { id: c.colheitaId },
        data: {
          statusPagamento: 'PAGO',
          pagamentoEfetuado: true,
          dataPagamento: c.dataPagamento,
          formaPagamento: 'PIX - API',
        },
      });
    }
  });

  console.log(`✅ APPLY concluído: ${correcoes.length} correção(ões) aplicada(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('❌ Erro:', err?.message || err);
    await prisma.$disconnect();
    process.exit(1);
  });


