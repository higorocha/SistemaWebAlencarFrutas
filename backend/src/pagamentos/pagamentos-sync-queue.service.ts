import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PagamentoApiSyncJob, $Enums } from '@prisma/client';

interface ScheduleLoteJobParams {
  numeroRequisicao: number;
  contaCorrenteId: number;
  loteId?: number;
  delayMinutes?: number;
}

interface ScheduleItemJobParams {
  identificadorPagamento?: string | null;
  contaCorrenteId: number;
  loteId?: number;
  delayMinutes?: number;
}

@Injectable()
export class PagamentosSyncQueueService {
  private readonly logger = new Logger(PagamentosSyncQueueService.name);
  private readonly defaultDelayMinutes = 15;
  private readonly maxAttempts = 5;

  constructor(private readonly prisma: PrismaService) {}

  async scheduleLoteSync(params: ScheduleLoteJobParams): Promise<void> {
    if (!params.numeroRequisicao || !params.contaCorrenteId) {
      return;
    }

    await this.createOrUpdateJob({
      tipo: $Enums.PagamentoApiSyncJobTipo.LOTE,
      contaCorrenteId: params.contaCorrenteId,
      numeroRequisicao: params.numeroRequisicao,
      loteId: params.loteId,
      delayMinutes: params.delayMinutes,
    });
  }

  async scheduleItemSync(params: ScheduleItemJobParams): Promise<void> {
    if (!params.identificadorPagamento) {
      return;
    }

    await this.createOrUpdateJob({
      tipo: $Enums.PagamentoApiSyncJobTipo.ITEM,
      contaCorrenteId: params.contaCorrenteId,
      identificadorPagamento: params.identificadorPagamento,
      loteId: params.loteId,
      delayMinutes: params.delayMinutes,
    });
  }

  getDefaultDelayMinutes(): number {
    return this.defaultDelayMinutes;
  }

  async claimNextJob(): Promise<PagamentoApiSyncJob | null> {
    const now = new Date();

    while (true) {
      const candidate = await this.prisma.pagamentoApiSyncJob.findFirst({
        where: {
          status: $Enums.PagamentoApiSyncJobStatus.PENDING,
          runAfter: {
            lte: now,
          },
        },
        orderBy: [
          { runAfter: 'asc' },
          { id: 'asc' },
        ],
      });

      if (!candidate) {
        return null;
      }

      const updated = await this.prisma.pagamentoApiSyncJob.updateMany({
        where: {
          id: candidate.id,
          status: $Enums.PagamentoApiSyncJobStatus.PENDING,
        },
        data: {
          status: $Enums.PagamentoApiSyncJobStatus.RUNNING,
          ultimaExecucao: now,
        },
      });

      if (updated.count === 0) {
        continue;
      }

      return this.prisma.pagamentoApiSyncJob.findUnique({
        where: { id: candidate.id },
      });
    }
  }

  async markJobDone(jobId: number): Promise<void> {
    await this.prisma.pagamentoApiSyncJob.update({
      where: { id: jobId },
      data: {
        status: $Enums.PagamentoApiSyncJobStatus.DONE,
        erro: null,
      },
    });
  }

  /**
   * Marca todos os jobs de ITEM de um lote como DONE
   * Usado quando um lote é marcado como rejeitado
   */
  async markAllItemJobsDoneForLote(loteId: number): Promise<number> {
    const result = await this.prisma.pagamentoApiSyncJob.updateMany({
      where: {
        loteId: loteId,
        tipo: $Enums.PagamentoApiSyncJobTipo.ITEM,
        status: {
          in: [
            $Enums.PagamentoApiSyncJobStatus.PENDING,
            $Enums.PagamentoApiSyncJobStatus.RUNNING,
          ],
        },
      },
      data: {
        status: $Enums.PagamentoApiSyncJobStatus.DONE,
        erro: null,
      },
    });

    this.logger.log(
      `[QUEUE] ${result.count} job(s) de ITEM marcado(s) como DONE para lote ${loteId}`,
    );

    return result.count;
  }

  /**
   * Marca todos os jobs de LOTE de um lote como DONE
   * Usado quando o lote é cancelado manualmente
   */
  async markAllLoteJobsDoneForLote(loteId: number): Promise<number> {
    const result = await this.prisma.pagamentoApiSyncJob.updateMany({
      where: {
        loteId: loteId,
        tipo: $Enums.PagamentoApiSyncJobTipo.LOTE,
        status: {
          in: [
            $Enums.PagamentoApiSyncJobStatus.PENDING,
            $Enums.PagamentoApiSyncJobStatus.RUNNING,
          ],
        },
      },
      data: {
        status: $Enums.PagamentoApiSyncJobStatus.DONE,
        erro: null,
      },
    });

    this.logger.log(
      `[QUEUE] ${result.count} job(s) de LOTE marcado(s) como DONE para lote ${loteId}`,
    );

    return result.count;
  }

  async handleJobError(job: PagamentoApiSyncJob, error: unknown): Promise<void> {
    const message = this.normalizeErrorMessage(error);
    const nextTentativas = job.tentativas + 1;
    const nextStatus =
      nextTentativas >= this.maxAttempts
        ? $Enums.PagamentoApiSyncJobStatus.FAILED
        : $Enums.PagamentoApiSyncJobStatus.PENDING;

    const delayMinutes =
      nextStatus === $Enums.PagamentoApiSyncJobStatus.FAILED
        ? undefined
        : this.computeBackoff(job.tentativas);

    await this.prisma.pagamentoApiSyncJob.update({
      where: { id: job.id },
      data: {
        status: nextStatus,
        runAfter:
          nextStatus === $Enums.PagamentoApiSyncJobStatus.PENDING
            ? this.calculateRunAfter(delayMinutes)
            : job.runAfter,
        erro: message,
        tentativas: nextTentativas,
      },
    });
  }

  async ensurePendingLoteJobs(limit = 20): Promise<void> {
    const pendingLotes = await this.prisma.pagamentoApiLote.findMany({
      where: {
        status: {
          in: [
            $Enums.StatusPagamentoLote.PENDENTE,
            $Enums.StatusPagamentoLote.PROCESSANDO,
          ],
        },
      },
      select: {
        id: true,
        numeroRequisicao: true,
        contaCorrenteId: true,
      },
      orderBy: {
        updatedAt: 'asc',
      },
      take: limit,
    });

    for (const lote of pendingLotes) {
      await this.createOrUpdateJob({
        tipo: $Enums.PagamentoApiSyncJobTipo.LOTE,
        contaCorrenteId: lote.contaCorrenteId,
        numeroRequisicao: lote.numeroRequisicao,
        loteId: lote.id,
        delayMinutes: 0,
      });
    }
  }

  private async createOrUpdateJob(params: {
    tipo: $Enums.PagamentoApiSyncJobTipo;
    contaCorrenteId: number;
    numeroRequisicao?: number;
    identificadorPagamento?: string;
    loteId?: number;
    delayMinutes?: number;
  }): Promise<PagamentoApiSyncJob> {
    const delay = params.delayMinutes ?? this.defaultDelayMinutes;
    const runAfter = this.calculateRunAfter(delay);

    const existing = await this.prisma.pagamentoApiSyncJob.findFirst({
      where: {
        tipo: params.tipo,
        numeroRequisicao: params.numeroRequisicao ?? undefined,
        identificadorPagamento: params.identificadorPagamento ?? undefined,
        status: {
          in: [
            $Enums.PagamentoApiSyncJobStatus.PENDING,
            $Enums.PagamentoApiSyncJobStatus.RUNNING,
          ],
        },
      },
    });

    if (existing) {
      if (existing.runAfter > runAfter) {
        const updatedJob = await this.prisma.pagamentoApiSyncJob.update({
          where: { id: existing.id },
          data: {
            runAfter,
            erro: null,
          },
        });
        this.logger.log(
          `[SYNC] Reagendado job ${updatedJob.id} (${params.tipo}) para ${this.formatDate(runAfter)} (≈ ${delay} min)`,
        );
      }
      return existing;
    }

    const job = await this.prisma.pagamentoApiSyncJob.create({
      data: {
        tipo: params.tipo,
        contaCorrenteId: params.contaCorrenteId,
        numeroRequisicao: params.numeroRequisicao,
        identificadorPagamento: params.identificadorPagamento,
        loteId: params.loteId,
        runAfter,
      },
    });

    this.logger.log(
      `[SYNC] Job ${job.id} (${params.tipo}) agendado para ${this.formatDate(runAfter)} (≈ ${delay} min) - referência ${
        params.numeroRequisicao ?? params.identificadorPagamento ?? 'N/A'
      }`,
    );

    return job;
  }

  async rescheduleJob(
    job: PagamentoApiSyncJob,
    minutes: number,
    reason?: string,
  ): Promise<void> {
    const runAfter = this.calculateRunAfter(minutes);
    await this.prisma.pagamentoApiSyncJob.update({
      where: { id: job.id },
      data: {
        status: $Enums.PagamentoApiSyncJobStatus.PENDING,
        runAfter,
      },
    });

    this.logger.log(
      `[SYNC] Job ${job.id} (${job.tipo}) reagendado para ${this.formatDate(runAfter)} (≈ ${minutes} min)${
        reason ? ` | Motivo: ${reason}` : ''
      }`,
    );
  }

  private calculateRunAfter(delayMinutes?: number): Date {
    const minutes = delayMinutes ?? this.defaultDelayMinutes;
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }

  private computeBackoff(tentativas: number): number {
    switch (tentativas) {
      case 0:
      case 1:
        return 15;
      case 2:
        return 30;
      case 3:
        return 60;
      default:
        return 180;
    }
  }

  private normalizeErrorMessage(error: unknown): string {
    if (!error) return 'Erro desconhecido';
    if (error instanceof Error) {
      return error.message.substring(0, 500);
    }
    if (typeof error === 'string') {
      return error.substring(0, 500);
    }
    return JSON.stringify(error).substring(0, 500);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(date);
  }
}

