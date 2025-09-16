export declare class PagamentoPedidoResponseDto {
    id: number;
    pedidoId: number;
    dataPagamento: Date;
    valorRecebido: number;
    metodoPagamento: 'PIX' | 'BOLETO' | 'TRANSFERENCIA' | 'DINHEIRO';
    observacoesPagamento?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class FrutaPedidoResponseDto {
    id: number;
    frutaId: number;
    fruta: {
        id: number;
        nome: string;
    };
    areaPropriaId?: number;
    areaPropria?: {
        id: number;
        nome: string;
    };
    areaFornecedorId?: number;
    areaFornecedor?: {
        id: number;
        nome: string;
        fornecedor: {
            id: number;
            nome: string;
        };
    };
    quantidadePrevista: number;
    quantidadeReal?: number;
    quantidadeReal2?: number;
    unidadeMedida1: 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';
    unidadeMedida2: 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';
    valorUnitario?: number;
    valorTotal?: number;
    unidadePrecificada?: 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';
    fitaColheita?: string;
}
export declare class PedidoResponseDto {
    id: number;
    numeroPedido: string;
    clienteId: number;
    cliente: {
        id: number;
        nome: string;
        industria: boolean;
    };
    dataPrevistaColheita: Date;
    dataColheita?: Date;
    observacoes?: string;
    observacoesColheita?: string;
    status: 'PEDIDO_CRIADO' | 'AGUARDANDO_COLHEITA' | 'COLHEITA_REALIZADA' | 'PRECIFICACAO_REALIZADA' | 'AGUARDANDO_PAGAMENTO' | 'PAGAMENTO_PARCIAL' | 'PAGAMENTO_REALIZADO' | 'PEDIDO_FINALIZADO' | 'CANCELADO';
    frete?: number;
    icms?: number;
    desconto?: number;
    avaria?: number;
    valorFinal?: number;
    valorRecebido?: number;
    dataPedido: Date;
    createdAt: Date;
    updatedAt: Date;
    frutasPedidos: FrutaPedidoResponseDto[];
    pagamentosPedidos: PagamentoPedidoResponseDto[];
    pesagem?: string;
    placaPrimaria?: string;
    placaSecundaria?: string;
    nomeMotorista?: string;
    indDataEntrada?: Date;
    indDataDescarga?: Date;
    indPesoMedio?: number;
    indMediaMililitro?: number;
    indNumeroNf?: number;
}
