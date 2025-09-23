type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';
export declare class UpdatePrecificacaoFrutaDto {
    frutaPedidoId: number;
    valorUnitario: number;
    unidadePrecificada?: UnidadeMedida;
    quantidadePrecificada?: number;
}
export declare class UpdatePrecificacaoDto {
    frutas: UpdatePrecificacaoFrutaDto[];
    frete?: number;
    icms?: number;
    desconto?: number;
    avaria?: number;
    indDataEntrada?: string;
    indDataDescarga?: string;
    indPesoMedio?: number;
    indMediaMililitro?: number;
    indNumeroNf?: number;
}
export {};
