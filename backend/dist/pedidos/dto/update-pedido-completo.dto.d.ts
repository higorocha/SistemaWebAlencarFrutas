type StatusPedido = 'PEDIDO_CRIADO' | 'AGUARDANDO_COLHEITA' | 'COLHEITA_REALIZADA' | 'AGUARDANDO_PRECIFICACAO' | 'PRECIFICACAO_REALIZADA' | 'AGUARDANDO_PAGAMENTO' | 'PAGAMENTO_PARCIAL' | 'PAGAMENTO_REALIZADO' | 'PEDIDO_FINALIZADO' | 'CANCELADO';
type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND';
export declare class UpdateFrutaPedidoDto {
    frutaPedidoId?: number;
    frutaId?: number;
    areaPropriaId?: number;
    areaFornecedorId?: number;
    quantidadePrevista?: number;
    quantidadeReal?: number;
    quantidadeReal2?: number;
    unidadeMedida1?: UnidadeMedida;
    unidadeMedida2?: UnidadeMedida;
    valorUnitario?: number;
    unidadePrecificada?: UnidadeMedida;
    valorTotal?: number;
    fitaColheita?: string;
}
export declare class UpdatePedidoCompletoDto {
    clienteId?: number;
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
}
export {};
