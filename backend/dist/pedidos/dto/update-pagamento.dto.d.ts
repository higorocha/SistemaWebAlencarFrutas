import { CreatePagamentoDto } from './create-pagamento.dto';
import { MetodoPagamento, ContaDestino } from '@prisma/client';
declare const UpdatePagamentoDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePagamentoDto>>;
export declare class UpdatePagamentoDto extends UpdatePagamentoDto_base {
    dataPagamento?: string;
    valorRecebido?: number;
    metodoPagamento?: MetodoPagamento;
    contaDestino?: ContaDestino;
    observacoesPagamento?: string;
    chequeCompensado?: boolean;
    referenciaExterna?: string;
}
export {};
