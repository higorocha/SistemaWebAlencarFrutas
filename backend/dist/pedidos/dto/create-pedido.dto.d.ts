type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';
export declare class FrutaAreaDto {
    areaPropriaId?: number;
    areaFornecedorId?: number;
    observacoes?: string;
}
export declare class FrutaFitaDto {
    fitaBananaId: number;
    quantidadeFita?: number;
    observacoes?: string;
}
export declare class FrutaPedidoDto {
    frutaId: number;
    quantidadePrevista: number;
    unidadeMedida1: UnidadeMedida;
    unidadeMedida2?: UnidadeMedida;
    areas: FrutaAreaDto[];
    fitas?: FrutaFitaDto[];
}
export declare class CreatePedidoDto {
    clienteId: number;
    dataPedido: string;
    dataPrevistaColheita: string;
    frutas: FrutaPedidoDto[];
    observacoes?: string;
    indDataEntrada?: string;
    indDataDescarga?: string;
    indPesoMedio?: number;
    indMediaMililitro?: number;
    indNumeroNf?: number;
}
export {};
