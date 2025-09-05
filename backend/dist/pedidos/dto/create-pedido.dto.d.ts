type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND';
export declare class FrutaPedidoDto {
    frutaId: number;
    areaPropriaId?: number;
    areaFornecedorId?: number;
    quantidadePrevista: number;
    unidadeMedida1: UnidadeMedida;
    unidadeMedida2?: UnidadeMedida;
}
export declare class CreatePedidoDto {
    clienteId: number;
    dataPrevistaColheita: string;
    frutas: FrutaPedidoDto[];
    observacoes?: string;
}
export {};
