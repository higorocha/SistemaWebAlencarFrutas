type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND';
export declare class UpdatePrecificacaoFrutaDto {
    frutaPedidoId: number;
    valorUnitario: number;
    unidadePrecificada?: UnidadeMedida;
}
export declare class UpdatePrecificacaoDto {
    frutas: UpdatePrecificacaoFrutaDto[];
    frete?: number;
    icms?: number;
    desconto?: number;
    avaria?: number;
}
export {};
