import { MetodoPagamento, ContaDestino } from '@prisma/client';

export class PagamentoResponseDto {
  id: number;
  pedidoId: number;
  lancamentoExtratoPedidoId?: number;
  lancamentoExtratoId?: string;
  dataPagamento: Date;
  valorRecebido: number;
  metodoPagamento: MetodoPagamento;
  contaDestino: ContaDestino;
  observacoesPagamento?: string;
  chequeCompensado?: boolean;
  referenciaExterna?: string;
  createdAt: Date;
  updatedAt: Date;
}
