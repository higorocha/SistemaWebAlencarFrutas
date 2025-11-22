import { Injectable } from '@nestjs/common';
import {
  MeioPagamentoFuncionario,
  StatusFuncionarioPagamento,
} from '@prisma/client';
import { MarcarPagamentoDto } from './dto/marcar-pagamento.dto';

interface StatusPayload {
  statusPagamento?: StatusFuncionarioPagamento;
  pagamentoEfetuado?: boolean;
  dataPagamento?: Date | null;
  meioPagamento?: MeioPagamentoFuncionario;
  pagamentoApiItemId?: number | null;
}

@Injectable()
export class FuncionarioPagamentoStatusService {
  private readonly statusConcluido = new Set<StatusFuncionarioPagamento>([
    StatusFuncionarioPagamento.PAGO,
    StatusFuncionarioPagamento.PROCESSANDO,
    StatusFuncionarioPagamento.ACEITO,
  ]);

  private readonly statusCancelado = new Set<StatusFuncionarioPagamento>([
    StatusFuncionarioPagamento.CANCELADO,
    StatusFuncionarioPagamento.REJEITADO,
    StatusFuncionarioPagamento.ERRO,
  ]);

  buildStatusPayload(dto: MarcarPagamentoDto): StatusPayload {
    const payload: StatusPayload = {};

    if (dto.statusPagamento) {
      payload.statusPagamento = dto.statusPagamento;

      if (this.statusConcluido.has(dto.statusPagamento)) {
        payload.pagamentoEfetuado = true;
        payload.dataPagamento = dto.dataPagamento
          ? new Date(dto.dataPagamento)
          : new Date();
      } else if (this.statusCancelado.has(dto.statusPagamento)) {
        payload.pagamentoEfetuado = false;
        payload.dataPagamento = null;
      }
    }

    if (dto.pagamentoEfetuado !== undefined) {
      payload.pagamentoEfetuado = dto.pagamentoEfetuado;
      payload.dataPagamento =
        dto.pagamentoEfetuado && dto.dataPagamento
          ? new Date(dto.dataPagamento)
          : dto.pagamentoEfetuado
            ? new Date()
            : null;
    }

    if (dto.meioPagamento) {
      payload.meioPagamento = dto.meioPagamento;
    }

    if (dto.pagamentoApiItemId !== undefined) {
      payload.pagamentoApiItemId = dto.pagamentoApiItemId ?? null;
    }

    return payload;
  }

  devePrepararIntegracaoPixApi(
    meioPagamento: MeioPagamentoFuncionario,
  ): boolean {
    return meioPagamento === MeioPagamentoFuncionario.PIX_API;
  }
}

