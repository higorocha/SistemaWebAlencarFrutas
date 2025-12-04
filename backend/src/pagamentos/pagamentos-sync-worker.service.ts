import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PagamentosSyncQueueService } from './pagamentos-sync-queue.service';
import { PagamentosService } from './pagamentos.service';
import { PrismaService } from '../prisma/prisma.service';
import { PagamentoApiSyncJob, $Enums } from '@prisma/client';

@Injectable()
export class PagamentosSyncWorkerService {
  private readonly logger = new Logger(PagamentosSyncWorkerService.name);
  private processing = false;
  private readonly pendingLoteStates = new Set<number>([1, 2, 4, 5, 8, 9, 10]);
  private readonly pendingItemStates = new Set<string>([
    'PENDENTE',
    'CONSISTENTE',
    'AGENDADO',
    'AGUARDANDO DEBITO',
    'DEBITADO',
  ]);
  // Estados finais que indicam que o pagamento foi concluído (sucesso ou falha)
  private readonly finalItemStates = new Set<string>([
    'PAGO', // Sucesso
    'CANCELADO', // Cancelado
    'DEVOLVIDO', // Devolvido
    'REJEITADO', // Rejeitado
    'INCONSISTENTE', // Inconsistente
    'VENCIDO', // Vencido
  ]);

  constructor(
    private readonly queueService: PagamentosSyncQueueService,
    private readonly pagamentosService: PagamentosService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    if (this.processing) {
      this.logger.debug(
        `[SYNC] ${this.formatDate(new Date())} Worker já em execução, pulando tick`,
      );
      return;
    }

    this.processing = true;

    const summary: Array<{
      jobId: number;
      tipo: string;
      referencia: string;
      success: boolean;
      message: string;
    }> = [];
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      while (true) {
        const job = await this.queueService.claimNextJob();
        if (!job) {
          break;
        }

        const start = new Date();
        this.logger.log(
          `[SYNC] ${this.formatDate(
            start,
          )} Iniciando job ${job.id} (${job.tipo} ${this.getReferencia(job)})`,
        );

        const result = await this.processJob(job);

        processed += 1;
        if (result.success) {
          succeeded += 1;
        } else {
          failed += 1;
        }

        if (result.success) {
          if (result.requeueInMinutes) {
            await this.queueService.rescheduleJob(
              job,
              result.requeueInMinutes,
              result.requeueReason,
            );
          } else {
            await this.queueService.markJobDone(job.id);
          }
        }

        summary.push(result);
      }
    } catch (error) {
      this.logger.error(
        'Erro ao processar fila de sincronização de pagamentos',
        error instanceof Error ? error.stack : `${error}`,
      );
    } finally {
      this.processing = false;

      if (processed > 0) {
        this.logger.log(
          `[SYNC] ${this.formatDate(
            new Date(),
          )} Execução concluída: ${processed} job(s) (${succeeded} sucesso, ${failed} falha).`,
        );
        summary.forEach((item) => {
          const status = item.success ? 'OK' : 'ERRO';
          this.logger.log(
            `[SYNC][${status}] Job ${item.jobId} (${item.tipo} ${item.referencia}) => ${item.message}`,
          );
        });
      }
    }
  }

  private async processJob(
    job: PagamentoApiSyncJob,
  ): Promise<{
    jobId: number;
    tipo: string;
    referencia: string;
    success: boolean;
    message: string;
    requeueInMinutes?: number;
    requeueReason?: string;
  }> {
    try {
      let requeueInMinutes: number | undefined;
      let requeueReason: string | undefined;

      if (job.tipo === $Enums.PagamentoApiSyncJobTipo.LOTE) {
        if (!job.numeroRequisicao) {
          throw new Error('Job de lote sem numeroRequisicao');
        }
        const resposta =
          await this.pagamentosService.consultarSolicitacaoTransferenciaPixOnline(
            job.numeroRequisicao,
            job.contaCorrenteId,
          );
        
        // ✅ CORREÇÃO: Verificar o estado do lote no banco após a consulta
        // Isso garante que se o lote foi marcado como rejeitado (estado 7) devido a itens bloqueados,
        // o job não será reagendado, mesmo que a API retorne outro estado
        const lote = await this.prisma.pagamentoApiLote.findUnique({
          where: { numeroRequisicao: job.numeroRequisicao },
          select: { estadoRequisicaoAtual: true },
        });
        
        // Priorizar o estado do banco (estadoRequisicaoAtual) se disponível
        // Se o lote foi marcado como rejeitado (estado 7) no banco, usar esse estado
        const estadoBanco = lote?.estadoRequisicaoAtual ?? null;
        const estadoApi = typeof resposta?.estadoRequisicao === 'number'
          ? resposta.estadoRequisicao
          : null;
        
        // Se o lote está marcado como rejeitado (7) no banco, usar esse estado
        // Caso contrário, usar o estado retornado pela API
        const estado = estadoBanco === 7 ? 7 : estadoApi;
        
        this.logger.log(
          `[SYNC] Job ${job.id} (LOTE) - Estado API: ${estadoApi}, Estado Banco: ${estadoBanco}, Estado Final: ${estado}`,
        );
        
        if (!this.isLoteEstadoFinal(estado)) {
          requeueInMinutes = this.queueService.getDefaultDelayMinutes();
          requeueReason = this.getDescricaoEstadoLote(estado);
        } else {
          // Estado final - não reagendar
          if (estadoBanco === 7) {
            this.logger.log(
              `[SYNC] Job ${job.id} (LOTE) - Lote marcado como rejeitado (estado 7) no banco, não reagendando`,
            );
          }
        }
      } else if (job.tipo === $Enums.PagamentoApiSyncJobTipo.ITEM) {
        if (!job.identificadorPagamento) {
          throw new Error('Job de item sem identificadorPagamento');
        }
        const resposta =
          await this.pagamentosService.consultarStatusTransferenciaIndividual(
            job.identificadorPagamento,
            job.contaCorrenteId,
          );
        const estadoPagamentoRaw = resposta?.estadoPagamento ?? null;
        const estadoPagamento = this.normalizeEstado(estadoPagamentoRaw);
        
        // ✅ CORREÇÃO: Usar classificarEstadoPagamentoPix para classificar corretamente o estado
        // Isso garante que estados como BLOQUEADO e REJEITADO sejam tratados como finais
        const classificacao = estadoPagamento
          ? this.pagamentosService.classificarEstadoPagamentoPix(estadoPagamento)
          : 'DESCONHECIDO';
        
        this.logger.log(
          `[SYNC] Job ${job.id} (ITEM) - Estado: ${estadoPagamentoRaw ?? estadoPagamento}, Classificação: ${classificacao}`,
        );
        
        // Decidir se deve reagendar baseado na classificação
        if (classificacao === 'PENDENTE' || classificacao === 'DESCONHECIDO') {
          // Estado ainda pendente ou desconhecido - continuar monitorando
          requeueInMinutes = this.queueService.getDefaultDelayMinutes();
          requeueReason = `Estado ${estadoPagamentoRaw ?? estadoPagamento} (${classificacao})`;
          this.logger.log(
            `[SYNC] Job ${job.id} (ITEM) - Reagendando: ${requeueReason}`,
          );
        } else {
          // Estados finais: SUCESSO, CANCELADO, REJEITADO, BLOQUEADO - não reagendar, marcar como DONE
          requeueInMinutes = undefined;
          requeueReason = `Estado final: ${estadoPagamentoRaw ?? estadoPagamento} (${classificacao})`;
          this.logger.log(
            `[SYNC] Job ${job.id} (ITEM) - Marcando como DONE: ${requeueReason}`,
          );
        }
      } else {
        this.logger.warn(`Tipo de job desconhecido: ${job.tipo}`);
      }

      return {
        jobId: job.id,
        tipo: job.tipo,
        referencia: this.getReferencia(job),
        success: true,
        message: requeueInMinutes
          ? `Estado ainda pendente (${requeueReason || 'sem motivo'})`
          : 'Processado com sucesso',
        requeueInMinutes,
        requeueReason,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : `${error}`;
      this.logger.warn(`Erro ao executar job ${job.id}: ${message}`);
      await this.queueService.handleJobError(job, error);
      return {
        jobId: job.id,
        tipo: job.tipo,
        referencia: this.getReferencia(job),
        success: false,
        message,
      };
    }
  }

  private getReferencia(job: PagamentoApiSyncJob): string {
    if (job.tipo === $Enums.PagamentoApiSyncJobTipo.LOTE) {
      return `lote=${job.numeroRequisicao ?? 'N/A'}`;
    }
    if (job.tipo === $Enums.PagamentoApiSyncJobTipo.ITEM) {
      return `item=${job.identificadorPagamento ?? 'N/A'}`;
    }
    return 'N/A';
  }

  private normalizeEstado(valor?: string | null): string | null {
    if (!valor) {
      return null;
    }

    return valor
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
  }

  private isLoteEstadoFinal(estado: number | null): boolean {
    if (estado == null) {
      return false;
    }
    return estado === 6 || estado === 7;
  }

  private getDescricaoEstadoLote(estado: number | null): string {
    const descricao = {
      1: 'Requisição consistente aguardando liberação',
      2: 'Dados com inconsistência parcial',
      4: 'Pendente de ação do conveniado',
      5: 'Processamento interno BB',
      8: 'Preparando remessa não liberada',
      9: 'Liberada aguardando processamento',
      10: 'Preparando remessa liberada',
    } as const;
    if (estado == null) {
      return 'Estado indefinido (aguardando processamento)';
    }
    return `Estado ${estado} (${descricao[estado] ?? 'em processamento'})`;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(date);
  }
}

