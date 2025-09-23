type StatusPedido = 'PEDIDO_CRIADO' | 'AGUARDANDO_COLHEITA' | 'COLHEITA_REALIZADA' | 'AGUARDANDO_PRECIFICACAO' | 'PRECIFICACAO_REALIZADA' | 'AGUARDANDO_PAGAMENTO' | 'PAGAMENTO_PARCIAL' | 'PEDIDO_FINALIZADO' | 'CANCELADO';
type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';
export declare class UpdateCompletoAreaDto {
    id?: number;
    areaPropriaId?: number;
    areaFornecedorId?: number;
    observacoes?: string;
}
export declare class UpdateCompletoFitaDto {
    id?: number;
    fitaBananaId: number;
    controleBananaId?: number;
    quantidadeFita?: number;
    observacoes?: string;
    detalhesAreas?: Array<{
        fitaBananaId: number;
        areaId: number;
        quantidade: number;
        controleBananaId: number;
    }>;
}
export declare class UpdateFrutaPedidoDto {
    frutaPedidoId?: number;
    frutaId?: number;
    quantidadePrevista?: number;
    quantidadeReal?: number;
    quantidadeReal2?: number;
    unidadeMedida1?: UnidadeMedida;
    unidadeMedida2?: UnidadeMedida | null;
    valorUnitario?: number;
    unidadePrecificada?: UnidadeMedida;
    quantidadePrecificada?: number;
    valorTotal?: number;
    areas?: UpdateCompletoAreaDto[];
    fitas?: UpdateCompletoFitaDto[];
}
export declare class UpdatePedidoCompletoDto {
    clienteId?: number;
    dataPedido?: string;
    dataPrevistaColheita?: string;
    dataColheita?: string;
    observacoes?: string;
    observacoesColheita?: string;
    frete?: number;
    icms?: number;
    desconto?: number;
    avaria?: number;
    valorRecebido?: number;
    status?: StatusPedido;
    frutas?: UpdateFrutaPedidoDto[];
    pesagem?: string;
    placaPrimaria?: string;
    placaSecundaria?: string;
    nomeMotorista?: string;
    indDataEntrada?: string;
    indDataDescarga?: string;
    indPesoMedio?: number;
    indMediaMililitro?: number;
    indNumeroNf?: number;
}
export {};
