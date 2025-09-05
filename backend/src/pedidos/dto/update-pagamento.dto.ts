import { PartialType } from '@nestjs/mapped-types';
import { CreatePagamentoDto } from './create-pagamento.dto';
import { MetodoPagamento, ContaDestino } from '@prisma/client';

export class UpdatePagamentoDto extends PartialType(CreatePagamentoDto) {
  // Campos opcionais para atualização
  dataPagamento?: string;
  valorRecebido?: number;
  metodoPagamento?: MetodoPagamento;
  contaDestino?: ContaDestino;
  observacoesPagamento?: string;
  chequeCompensado?: boolean;
  referenciaExterna?: string;
}
