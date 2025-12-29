/**
 * Reconciliação PIX-API (colheitas) - Correção
 *
 * O que faz:
 * - Para um pedidoId, acha colheitas pendentes/processando sem vínculo PIX-API
 * - Procura PagamentoApiItem PROCESSADO cujo "gap" (valorEnviado - soma vínculos) == valorColheita
 * - Se achar, aplica:
 *    1) cria PagamentoApiItemColheita (vínculo N:N)
 *    2) marca TurmaColheitaPedidoCusto como PAGO (dataPagamento inferida)
 *
 * Segurança:
 * - Por padrão roda em DRY-RUN
 * - Para aplicar de fato use --apply
 *
 * Uso:
 *   cd SistemaWebAlencarFrutas/backend
 *   npx ts-node scripts/aplicar-reconciliacao-pix-colheita.ts --pedidoId 528 --dry-run
 *   npx ts-node scripts/aplicar-reconciliacao-pix-colheita.ts --pedidoId 528 --apply
 */

import { PrismaClient, StatusPagamentoItem, TipoPagamentoApi } from '@prisma/client';

const prisma = new PrismaClient();

type Args = {
  pedidoId: number;
  apply: boolean;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: any = { apply: false, dryRun: true };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pedidoId') {
      args.pedidoId = Number(argv[++i]);
    } else if (a === '--apply') {
      args.apply = true;
      args.dryRun = false;
    } else if (a === '--dry-run') {
      args.dryRun = true;
      args.apply = false;
    }
  }
  if (!args.pedidoId || Number.isNaN(args.pedidoId)) {
    throw new Error(
      'Uso: npx ts-node scripts/aplicar-reconciliacao-pix-colheita.ts --pedidoId <id> (--dry-run | --apply)',
    );
  }
  return args as Args;
}

function toNumberMoney(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
  return Number(v);
}

function moneyEq(a: number, b: number, tol = 0.01): boolean {
  return Math.abs(a - b) <= tol;
}

function parseDataPagamentoFromBB(raw: any): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    // ddmmaaaa
    if (/^\d{8}$/.test(s)) {
      const dd = Number(s.slice(0, 2));
      const mm = Number(s.slice(2, 4));
      const yyyy = Number(s.slice(4, 8));
      if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
        return new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
      }
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
  if (!pedido) {
    throw new Error(`Pedido não encontrado: id=${pedidoId}`);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🧩 RECONCILIAÇÃO PIX-API (CORREÇÃO) - Pedido ${pedido.numeroPedido} (id=${pedidoId})`);
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const custos = await prisma.turmaColheitaPedidoCusto.findMany({
    where: { pedidoId },
    include: {
      turmaColheita: { select: { id: true, nomeColhedor: true } },
      pagamentoApiItemColheitas: {
        select: { id: true },
      },
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

  const turmaIds = Array.from(new Set(faltantes.map((c) => c.turmaColheitaId)));

  const itensPossiveis = await prisma.pagamentoApiItem.findMany({
    where: {
      status: StatusPagamentoItem.PROCESSADO,
      processadoComSucesso: true,
      lote: { tipoPagamentoApi: TipoPagamentoApi.PIX },
      OR: turmaIds.map((turmaColheitaId) => ({
        colheitas: { some: { turmaColheitaCusto: { turmaColheitaId } } },
      })),
    },
    include: {
      lote: { select: { id: true, numeroRequisicao: true } },
      colheitas: {
        include: {
          turmaColheitaCusto: { select: { id: true, turmaColheitaId: true, dataPagamento: true } },
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  if (itensPossiveis.length === 0) {
    console.log('⚠️ Nenhum item PIX PROCESSADO encontrado para as turmas relacionadas. Nada a aplicar.');
    return;
  }

  const correcoes: Array<{
    colheitaId: number;
    turmaColheitaId: number;
    valorColheita: number;
    itemId: number;
    loteId: number;
    numeroRequisicao: number;
    dataPagamento: Date;
  }> = [];

  for (const c of faltantes) {
    const valorColheita = toNumberMoney(c.valorColheita);
    for (const item of itensPossiveis) {
      const turmaDoItem = item.colheitas?.[0]?.turmaColheitaCusto?.turmaColheitaId;
      if (turmaDoItem !== c.turmaColheitaId) continue;

      const soma = item.colheitas.reduce((acc, rel) => acc + toNumberMoney(rel.valorColheita), 0);
      const itemValor = toNumberMoney(item.valorEnviado);
      const diff = Number((itemValor - soma).toFixed(2));
      if (!moneyEq(diff, valorColheita)) continue;

      // dataPagamento preferida: usar dataPagamento já registrada em alguma colheita paga do mesmo item
      const dataDoItem = item.colheitas
        .map((rel) => rel.turmaColheitaCusto?.dataPagamento)
        .filter(Boolean)
        .sort((a: any, b: any) => (a as Date).getTime() - (b as Date).getTime())
        .pop() as Date | undefined;

      // fallback: tentar extrair do payloadConsultaIndividual (se existir)
      const payload = item.payloadConsultaIndividual as any;
      const dataBB = parseDataPagamentoFromBB(payload?.dataPagamento) || parseDataPagamentoFromBB(payload?.dataPagamentoEfetivo);

      const dataPagamento = dataDoItem || dataBB || new Date();

      correcoes.push({
        colheitaId: c.id,
        turmaColheitaId: c.turmaColheitaId,
        valorColheita,
        itemId: item.id,
        loteId: item.lote.id,
        numeroRequisicao: item.lote.numeroRequisicao,
        dataPagamento,
      });
      break;
    }
  }

  if (correcoes.length === 0) {
    console.log('⚠️ Não foi encontrada correção automática com correspondência exata de valores.');
    console.log('Verifique se o item PIX correspondente está PROCESSADO e se os valores batem.');
    return;
  }

  console.log('Correções propostas:');
  for (const c of correcoes) {
    console.log(
      `- colheitaId=${c.colheitaId} turmaColheitaId=${c.turmaColheitaId} valor=R$ ${c.valorColheita.toFixed(
        2,
      )} -> itemId=${c.itemId} lote=${c.numeroRequisicao} dataPagamento=${c.dataPagamento.toISOString()}`,
    );
  }
  console.log('');

  if (dryRun) {
    console.log('DRY-RUN: nada foi alterado. Execute com --apply para aplicar.');
    return;
  }

  // Apply em transação por segurança
  await prisma.$transaction(async (tx) => {
    for (const c of correcoes) {
      // 1) criar vínculo (idempotente)
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

      // 2) marcar colheita como paga (idempotente)
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
    console.error('❌ Erro:', err instanceof Error ? err.message : err);
    await prisma.$disconnect();
    process.exit(1);
  });


