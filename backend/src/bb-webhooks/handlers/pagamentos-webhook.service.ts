import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BbWebhookEvent, $Enums } from '@prisma/client';
import { PagamentosService } from '../../pagamentos/pagamentos.service';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly pagamentosService: PagamentosService,
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
    console.log(
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
            console.log(
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
        console.error(
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
   * Agora trata todos os estados, não apenas "Pago", seguindo o mesmo comportamento dos jobs
   */
  private async processarItem(
    item: WebhookPagamentoItem,
  ): Promise<{ processado: boolean; motivo?: string }> {
    console.log(
      `[PAGAMENTOS-WEBHOOK] Recebido item: ${item.codigoIdentificadorPagamento} (Requisicao: ${item.numeroRequisicaoPagamento}, Estado: ${item.textoEstado}, CodigoEstado: ${item.codigoTextoEstado})`,
    );

    // Normalizar estado do webhook para o formato usado no sistema
    const estadoNormalizado = this.normalizarEstadoWebhook(item.textoEstado, item.codigoTextoEstado);
    console.log(
      `[PAGAMENTOS-WEBHOOK] Estado normalizado: ${estadoNormalizado}`,
    );

    // Buscar lote por numeroRequisicaoPagamento
    const lote = await this.prisma.pagamentoApiLote.findUnique({
      where: { numeroRequisicao: item.numeroRequisicaoPagamento },
    });

    if (!lote) {
      console.log(
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
        funcionarioPagamento: true,
      },
    });

    if (!itemPagamento) {
      console.log(
        `[PAGAMENTOS-WEBHOOK] Item ${item.codigoIdentificadorPagamento} não encontrado no lote ${item.numeroRequisicaoPagamento}. Descartando.`,
      );
      return {
        processado: false,
        motivo: `Item ${item.codigoIdentificadorPagamento} não encontrado no lote`,
      };
    }

    // IMPORTANTE: Verificar se o item já está como PROCESSADO (pago)
    // Se estiver, preservar esse status mesmo se o webhook indicar outro estado
    const itemJaPago = itemPagamento.status === $Enums.StatusPagamentoItem.PROCESSADO;

    // Preparar payload atualizado com dados do webhook
    const payloadAtualizado = {
      ...(itemPagamento.payloadItemRespostaAtual as any || {}),
      webhook: {
        ...item,
        dataProcessamento: new Date().toISOString(),
      },
    };

    // Tratar diferentes estados do webhook
    if (estadoNormalizado === 'PAGO') {
      // Item foi pago
      if (!itemJaPago) {
        // Converter dataPagamento (formato: "2024-05-10") para Date
        const dataPagamentoEfetivo = item.dataPagamento 
          ? new Date(item.dataPagamento + 'T12:00:00Z')
          : new Date();

        // Atualizar item de pagamento
        await this.prisma.pagamentoApiItem.update({
          where: { id: itemPagamento.id },
          data: {
            status: $Enums.StatusPagamentoItem.PROCESSADO,
            processadoComSucesso: true,
            estadoPagamentoIndividual: 'Pago',
            payloadItemRespostaAtual: payloadAtualizado as any,
            ultimaAtualizacaoStatus: new Date(),
            indicadorMovimentoAceitoAtual: 'S',
            indicadorAceiteAtual: 'S',
            indicadorAceiteGuiaAtual: 'S',
          },
        });

        console.log(
          `[PAGAMENTOS-WEBHOOK] Item ${itemPagamento.id} atualizado como PAGO`,
        );

        // Atualizar colheitas (APENAS se for pagamento de colheitas)
        if (itemPagamento.colheitas && itemPagamento.colheitas.length > 0) {
          await this.atualizarColheitas(itemPagamento.id, dataPagamentoEfetivo);
        }

        // Atualizar funcionário (APENAS se for pagamento de funcionário)
        if (itemPagamento.funcionarioPagamento) {
          await this.pagamentosService.atualizarFuncionarioPagamentoDoItem(
            itemPagamento.id,
            'PAGO',
            dataPagamentoEfetivo,
          );
        }
      } else {
        console.log(
          `[PAGAMENTOS-WEBHOOK] Item ${itemPagamento.id} já está como PROCESSADO (pago), preservando status`,
        );
      }
    } else if (estadoNormalizado === 'BLOQUEADO' || estadoNormalizado === 'REJEITADO' || estadoNormalizado === 'CANCELADO') {
      // Item bloqueado, rejeitado ou cancelado
      if (!itemJaPago) {
        // Atualizar item
        await this.prisma.pagamentoApiItem.update({
          where: { id: itemPagamento.id },
          data: {
            status: $Enums.StatusPagamentoItem.REJEITADO,
            processadoComSucesso: false,
            estadoPagamentoIndividual: estadoNormalizado,
            payloadItemRespostaAtual: payloadAtualizado as any,
            ultimaAtualizacaoStatus: new Date(),
          },
        });

        console.log(
          `[PAGAMENTOS-WEBHOOK] Item ${itemPagamento.id} atualizado como ${estadoNormalizado}`,
        );

        // Reverter colheitas (APENAS se for pagamento de colheitas)
        if (itemPagamento.colheitas && itemPagamento.colheitas.length > 0) {
          await this.pagamentosService.reverterColheitasDoItemParaPendente(itemPagamento.id);
        }

        // Atualizar funcionário (APENAS se for pagamento de funcionário)
        if (itemPagamento.funcionarioPagamento) {
          await this.pagamentosService.atualizarFuncionarioPagamentoDoItem(
            itemPagamento.id,
            'REJEITADO',
            null,
          );
        }

        // Verificar e atualizar lote com itens bloqueados
        await this.pagamentosService.verificarEAtualizarLoteComItensBloqueados(lote.id);
      } else {
        console.log(
          `[PAGAMENTOS-WEBHOOK] Item ${itemPagamento.id} já está como PROCESSADO (pago), preservando status mesmo com estado ${estadoNormalizado}`,
        );
      }
    } else {
      // Estado desconhecido ou pendente - apenas atualizar payload
      await this.prisma.pagamentoApiItem.update({
        where: { id: itemPagamento.id },
        data: {
          estadoPagamentoIndividual: estadoNormalizado,
          payloadItemRespostaAtual: payloadAtualizado as any,
          ultimaAtualizacaoStatus: new Date(),
        },
      });

      console.log(
        `[PAGAMENTOS-WEBHOOK] Item ${itemPagamento.id} atualizado com estado ${estadoNormalizado} (sem alteração de status interno)`,
      );
    }

    // Atualizar lote (verificar se todos os itens foram pagos ou se há itens bloqueados)
    await this.atualizarLote(lote.id);

    return { processado: true };
  }

  /**
   * Normaliza o estado recebido do webhook para o formato usado no sistema
   */
  private normalizarEstadoWebhook(textoEstado: string, codigoEstado: number): string {
    const estadoUpper = textoEstado?.toUpperCase() || '';
    
    // Mapear estados do webhook para estados do sistema
    if (codigoEstado === 1 || estadoUpper.includes('PAGO')) {
      return 'Pago';
    }
    if (estadoUpper.includes('BLOQUEADO')) {
      return 'BLOQUEADO';
    }
    if (estadoUpper.includes('REJEITADO') || estadoUpper.includes('REJEITADO')) {
      return 'REJEITADO';
    }
    if (estadoUpper.includes('CANCELADO')) {
      return 'CANCELADO';
    }
    if (codigoEstado === 2 || estadoUpper.includes('NÃO PAGO') || estadoUpper.includes('NAO PAGO')) {
      return 'PENDENTE';
    }
    
    // Estado desconhecido - retornar como está
    return textoEstado || 'DESCONHECIDO';
  }

  /**
   * Atualiza as colheitas vinculadas ao item de pagamento
   * APENAS para pagamentos de colheitas
   */
  private async atualizarColheitas(
    itemId: number,
    dataPagamento: Date,
  ): Promise<void> {
    console.log(
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

      console.log(
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
        console.log(
          `[PAGAMENTOS-WEBHOOK] Todas as colheitas da turma ${turmaId} foram pagas`,
        );
        // Aqui você pode adicionar lógica adicional se necessário
        // (ex: atualizar indicadores agregados da turma)
      }
    }

    console.log(
      `[PAGAMENTOS-WEBHOOK] ${colheitas.length} colheita(s) atualizada(s)`,
    );
  }

  /**
   * Atualiza o lote após processar um item
   * Segue o mesmo comportamento dos jobs: verifica itens bloqueados e preserva status
   */
  private async atualizarLote(loteId: number): Promise<void> {
    // IMPORTANTE: Verificar se há itens bloqueados ANTES de atualizar o lote
    // Se houver itens bloqueados, o lote será marcado como rejeitado (estado 7)
    const temItensBloqueados = await this.pagamentosService.verificarEAtualizarLoteComItensBloqueados(loteId);

    if (temItensBloqueados) {
      // Lote já foi atualizado como rejeitado pelo método acima
      console.log(
        `[PAGAMENTOS-WEBHOOK] Lote ${loteId} marcado como rejeitado devido a itens bloqueados`,
      );
      return;
    }

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

      console.log(
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

