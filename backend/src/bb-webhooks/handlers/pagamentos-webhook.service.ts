import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BbWebhookEvent, $Enums } from '@prisma/client';

interface WebhookPagamentoItem {
  numeroRequisicaoPagamento: number;
  codigoIdentificadorPagamento: string;
  nomeDoFavorecido?: string;
  numeroCPFouCNPJ?: number;
  dataPagamento: string; // Formato: "2024-05-10"
  valorPagamento: number;
  codigoTextoEstado: number; // 1 = Pago, 2 = Não pago
  textoEstado: string; // "Pago" ou "Não pago"
  codigoIdentificadorInformadoCliente?: string;
  codigoDescricaoTipoPagamento?: number;
  descricaoTipoPagamento?: string;
}

@Injectable()
export class PagamentosWebhookService {
  private readonly logger = new Logger(PagamentosWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Processa um evento de webhook de pagamentos
   */
  async processarEvento(
    evento: BbWebhookEvent,
    payloadArray: WebhookPagamentoItem[],
  ): Promise<{
    processados: number;
    descartados: number;
    erros: any[];
  }> {
    this.logger.log(
      `[PAGAMENTOS-WEBHOOK] Processando evento ${evento.id} com ${payloadArray.length} item(ns)`,
    );

    let quantidadeProcessados = 0;
    let quantidadeDescartados = 0;
    const erros: any[] = [];

    for (const item of payloadArray) {
      try {
        const resultado = await this.processarItem(item);
        if (resultado.processado) {
          quantidadeProcessados++;
        } else {
          quantidadeDescartados++;
          if (resultado.motivo) {
            this.logger.log(
              `[PAGAMENTOS-WEBHOOK] Item descartado: ${resultado.motivo}`,
            );
          }
        }
      } catch (error) {
        quantidadeDescartados++;
        erros.push({
          item: item.codigoIdentificadorPagamento,
          erro: error.message,
          stack: error.stack,
        });
        this.logger.error(
          `[PAGAMENTOS-WEBHOOK] Erro ao processar item ${item.codigoIdentificadorPagamento}: ${error.message}`,
        );
      }
    }

    return {
      processados: quantidadeProcessados,
      descartados: quantidadeDescartados,
      erros,
    };
  }

  /**
   * Processa um item individual do webhook
   */
  private async processarItem(
    item: WebhookPagamentoItem,
  ): Promise<{ processado: boolean; motivo?: string }> {
    this.logger.log(
      `[PAGAMENTOS-WEBHOOK] Recebido item: ${item.codigoIdentificadorPagamento} (Requisicao: ${item.numeroRequisicaoPagamento}, Estado: ${item.textoEstado})`,
    );

    // Verificar se o estado é "Pago" (codigoTextoEstado = 1)
    if (item.codigoTextoEstado !== 1) {
      this.logger.log(
        `[PAGAMENTOS-WEBHOOK] Item ${item.codigoIdentificadorPagamento} não está pago (estado: ${item.codigoTextoEstado}). Ignorando.`,
      );
      return {
        processado: false,
        motivo: `Estado não é "Pago" (codigoTextoEstado: ${item.codigoTextoEstado})`,
      };
    }

    // Buscar lote por numeroRequisicaoPagamento
    const lote = await this.prisma.pagamentoApiLote.findUnique({
      where: { numeroRequisicao: item.numeroRequisicaoPagamento },
    });

    if (!lote) {
      this.logger.log(
        `[PAGAMENTOS-WEBHOOK] Lote ${item.numeroRequisicaoPagamento} não encontrado. Descartando item.`,
      );
      return {
        processado: false,
        motivo: `Lote ${item.numeroRequisicaoPagamento} não encontrado (ambiente local ou lote inexistente)`,
      };
    }

    // Buscar item por codigoIdentificadorPagamento
    // Pode ser identificadorPagamento (PIX) ou codigoIdentificadorPagamento (Boleto/Guia)
    const itemPagamento = await this.prisma.pagamentoApiItem.findFirst({
      where: {
        loteId: lote.id,
        OR: [
          { identificadorPagamento: item.codigoIdentificadorPagamento },
          { codigoIdentificadorPagamento: item.codigoIdentificadorPagamento },
        ],
      },
      include: {
        colheitas: {
          include: {
            turmaColheitaCusto: true,
          },
        },
      },
    });

    if (!itemPagamento) {
      this.logger.log(
        `[PAGAMENTOS-WEBHOOK] Item ${item.codigoIdentificadorPagamento} não encontrado no lote ${item.numeroRequisicaoPagamento}. Descartando.`,
      );
      return {
        processado: false,
        motivo: `Item ${item.codigoIdentificadorPagamento} não encontrado no lote`,
      };
    }

    // Converter dataPagamento (formato: "2024-05-10") para Date
    const dataPagamentoEfetivo = new Date(item.dataPagamento + 'T12:00:00Z');

    // Preparar payload atualizado com dados do webhook
    const payloadAtualizado = {
      ...(itemPagamento.payloadItemRespostaAtual as any || {}),
      webhook: {
        ...item,
        dataProcessamento: new Date().toISOString(),
      },
    };

    // Atualizar item de pagamento
    await this.prisma.pagamentoApiItem.update({
      where: { id: itemPagamento.id },
      data: {
        status: $Enums.StatusPagamentoItem.PROCESSADO,
        processadoComSucesso: true,
        estadoPagamentoIndividual: 'Pago',
        payloadItemRespostaAtual: payloadAtualizado as any,
        ultimaAtualizacaoStatus: new Date(),
        indicadorMovimentoAceitoAtual: 'S', // Pago = aceito (PIX)
        indicadorAceiteAtual: 'S', // Para boleto/guia
        indicadorAceiteGuiaAtual: 'S', // Para guia
      },
    });

    this.logger.log(
      `[PAGAMENTOS-WEBHOOK] Item ${itemPagamento.id} atualizado como PAGO`,
    );

    // Atualizar colheitas (APENAS se for pagamento de colheitas)
    if (itemPagamento.colheitas && itemPagamento.colheitas.length > 0) {
      await this.atualizarColheitas(itemPagamento.id, dataPagamentoEfetivo);
    } else {
      this.logger.log(
        `[PAGAMENTOS-WEBHOOK] Item ${itemPagamento.id} não possui colheitas vinculadas (não é pagamento de colheitas)`,
      );
    }

    // Atualizar lote (verificar se todos os itens foram pagos)
    await this.atualizarLote(lote.id);

    return { processado: true };
  }

  /**
   * Atualiza as colheitas vinculadas ao item de pagamento
   * APENAS para pagamentos de colheitas
   */
  private async atualizarColheitas(
    itemId: number,
    dataPagamento: Date,
  ): Promise<void> {
    this.logger.log(
      `[PAGAMENTOS-WEBHOOK] Atualizando colheitas do item ${itemId}`,
    );

    // Buscar todas as colheitas vinculadas ao item
    const colheitas = await this.prisma.pagamentoApiItemColheita.findMany({
      where: { pagamentoApiItemId: itemId },
      include: {
        turmaColheitaCusto: true,
      },
    });

    if (colheitas.length === 0) {
      return;
    }

    // Atualizar cada colheita
    for (const colheitaRel of colheitas) {
      await this.prisma.turmaColheitaPedidoCusto.update({
        where: { id: colheitaRel.turmaColheitaCustoId },
        data: {
          statusPagamento: 'PAGO',
          pagamentoEfetuado: true,
          dataPagamento: dataPagamento,
        },
      });

      this.logger.log(
        `[PAGAMENTOS-WEBHOOK] Colheita ${colheitaRel.turmaColheitaCustoId} marcada como PAGO`,
      );
    }

    // Verificar se todas as colheitas de cada turma foram pagas
    // Agrupar por turmaColheitaId
    const turmasMap = new Map<number, number[]>();
    for (const colheitaRel of colheitas) {
      const turmaId = colheitaRel.turmaColheitaCusto.turmaColheitaId;
      if (!turmasMap.has(turmaId)) {
        turmasMap.set(turmaId, []);
      }
      turmasMap.get(turmaId)!.push(colheitaRel.turmaColheitaCustoId);
    }

    // Para cada turma, verificar se todas as colheitas foram pagas
    for (const [turmaId, colheitaIds] of turmasMap.entries()) {
      const totalColheitas = await this.prisma.turmaColheitaPedidoCusto.count({
        where: { turmaColheitaId: turmaId },
      });

      const colheitasPagas = await this.prisma.turmaColheitaPedidoCusto.count({
        where: {
          turmaColheitaId: turmaId,
          statusPagamento: 'PAGO',
        },
      });

      if (colheitasPagas === totalColheitas) {
        this.logger.log(
          `[PAGAMENTOS-WEBHOOK] Todas as colheitas da turma ${turmaId} foram pagas`,
        );
        // Aqui você pode adicionar lógica adicional se necessário
        // (ex: atualizar indicadores agregados da turma)
      }
    }

    this.logger.log(
      `[PAGAMENTOS-WEBHOOK] ${colheitas.length} colheita(s) atualizada(s)`,
    );
  }

  /**
   * Atualiza o lote após processar um item
   */
  private async atualizarLote(loteId: number): Promise<void> {
    // Buscar todos os itens do lote
    const itens = await this.prisma.pagamentoApiItem.findMany({
      where: { loteId },
    });

    const totalItens = itens.length;
    const itensPagos = itens.filter(
      (item) => item.status === $Enums.StatusPagamentoItem.PROCESSADO,
    ).length;

    // Se todos os itens foram pagos, atualizar estado do lote
    if (itensPagos === totalItens && totalItens > 0) {
      await this.prisma.pagamentoApiLote.update({
        where: { id: loteId },
        data: {
          estadoRequisicaoAtual: 9, // Liberado/Pago
          status: $Enums.StatusPagamentoLote.CONCLUIDO,
          processadoComSucesso: true,
        },
      });

      this.logger.log(
        `[PAGAMENTOS-WEBHOOK] Lote ${loteId} atualizado: todos os itens foram pagos`,
      );
    } else {
      // Atualizar apenas o estado atual (mantém status como LIBERADO se já estava)
      await this.prisma.pagamentoApiLote.update({
        where: { id: loteId },
        data: {
          estadoRequisicaoAtual: 9, // Liberado/Pago (pelo menos parcialmente)
        },
      });
    }
  }
}

