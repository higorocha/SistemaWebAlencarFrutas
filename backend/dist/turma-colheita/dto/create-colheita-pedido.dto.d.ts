type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';
export declare class CreateTurmaColheitaPedidoCustoDto {
    turmaColheitaId: number;
    pedidoId: number;
    frutaId: number;
    quantidadeColhida: number;
    unidadeMedida: UnidadeMedida;
    valorColheita?: number;
    dataColheita?: string;
    pagamentoEfetuado?: boolean;
    observacoes?: string;
}
export {};
