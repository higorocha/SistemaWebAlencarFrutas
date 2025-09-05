import { MetodoPagamento, ContaDestino } from '@prisma/client';
export declare class CreatePagamentoDto {
    pedidoId: number;
    dataPagamento: string;
    valorRecebido: number;
    metodoPagamento: MetodoPagamento;
    contaDestino: ContaDestino;
    observacoesPagamento?: string;
    chequeCompensado?: boolean;
    referenciaExterna?: string;
}
