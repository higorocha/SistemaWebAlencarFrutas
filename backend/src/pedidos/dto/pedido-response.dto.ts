import { ApiProperty } from '@nestjs/swagger';

// DTO para resposta de pagamento individual
export class PagamentoPedidoResponseDto {
  @ApiProperty({ description: 'ID do pagamento' })
  id: number;

  @ApiProperty({ description: 'ID do pedido' })
  pedidoId: number;

  @ApiProperty({ description: 'Data do pagamento' })
  dataPagamento: Date;

  @ApiProperty({ description: 'Valor recebido' })
  valorRecebido: number;

  @ApiProperty({ description: 'Método de pagamento', enum: ['PIX', 'BOLETO', 'TRANSFERENCIA', 'DINHEIRO', 'CHEQUE'] })
  metodoPagamento: 'PIX' | 'BOLETO' | 'TRANSFERENCIA' | 'DINHEIRO' | 'CHEQUE';

  @ApiProperty({ description: 'Conta destino', enum: ['ALENCAR', 'FRANCIALDA', 'GAVETA'] })
  contaDestino: 'ALENCAR' | 'FRANCIALDA' | 'GAVETA';

  @ApiProperty({ description: 'Observações do pagamento', required: false })
  observacoesPagamento?: string;

  @ApiProperty({ description: 'Referência externa (vale)', required: false })
  referenciaExterna?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

// DTO para resposta de fruta do pedido
export class FrutaPedidoResponseDto {
  @ApiProperty({ description: 'ID da fruta do pedido' })
  id: number;

  @ApiProperty({ description: 'ID da fruta' })
  frutaId: number;

  @ApiProperty({ description: 'Nome da fruta' })
  fruta: {
    id: number;
    nome: string;
  };

  @ApiProperty({ description: 'ID da área própria', required: false })
  areaPropriaId?: number;

  @ApiProperty({ description: 'Nome da área própria', required: false })
  areaPropria?: {
    id: number;
    nome: string;
  };

  @ApiProperty({ description: 'ID da área de fornecedor', required: false })
  areaFornecedorId?: number;

  @ApiProperty({ description: 'Nome da área de fornecedor', required: false })
  areaFornecedor?: {
    id: number;
    nome: string;
    fornecedor: {
      id: number;
      nome: string;
    };
  };

  @ApiProperty({ description: 'Quantidade prevista' })
  quantidadePrevista: number;

  @ApiProperty({ description: 'Quantidade real', required: false })
  quantidadeReal?: number;

  @ApiProperty({ description: 'Quantidade real 2', required: false })
  quantidadeReal2?: number;

  @ApiProperty({ description: 'Unidade de medida 1', enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'] })
  unidadeMedida1: 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';

  @ApiProperty({ description: 'Unidade de medida 2', enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'] })
  unidadeMedida2: 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';

  @ApiProperty({ description: 'Valor unitário', required: false })
  valorUnitario?: number;

  @ApiProperty({ description: 'Valor total', required: false })
  valorTotal?: number;

  @ApiProperty({ description: 'Unidade precificada', enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'], required: false })
  unidadePrecificada?: 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';

  @ApiProperty({ description: 'Cor da fita para identificação', required: false })
  fitaColheita?: string;
}

// DTO principal para resposta de pedido
export class PedidoResponseDto {
  @ApiProperty({ description: 'ID do pedido' })
  id: number;

  @ApiProperty({ description: 'Número do pedido' })
  numeroPedido: string;

  @ApiProperty({ description: 'ID do cliente' })
  clienteId: number;

  @ApiProperty({ description: 'Nome do cliente' })
  cliente: {
    id: number;
    nome: string;
    industria: boolean;
  };

  @ApiProperty({ description: 'Data prevista para colheita' })
  dataPrevistaColheita: Date;



  @ApiProperty({ description: 'Data da colheita', required: false })
  dataColheita?: Date;

  // REMOVIDO: fitaColheita movido para frutasPedidos

  @ApiProperty({ description: 'Observações', required: false })
  observacoes?: string;

  @ApiProperty({ description: 'Observações da colheita', required: false })
  observacoesColheita?: string;

  @ApiProperty({ description: 'Status do pedido', enum: ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_REALIZADA', 'PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL', 'PEDIDO_FINALIZADO', 'CANCELADO'] })
  status: 'PEDIDO_CRIADO' | 'AGUARDANDO_COLHEITA' | 'COLHEITA_REALIZADA' | 'PRECIFICACAO_REALIZADA' | 'AGUARDANDO_PAGAMENTO' | 'PAGAMENTO_PARCIAL' | 'PEDIDO_FINALIZADO' | 'CANCELADO';

  @ApiProperty({ description: 'Frete', required: false })
  frete?: number;

  @ApiProperty({ description: 'ICMS', required: false })
  icms?: number;

  @ApiProperty({ description: 'Desconto', required: false })
  desconto?: number;

  @ApiProperty({ description: 'Avaria', required: false })
  avaria?: number;

  @ApiProperty({ description: 'Valor final', required: false })
  valorFinal?: number;

  @ApiProperty({ description: 'Valor recebido consolidado', required: false })
  valorRecebido?: number;

  @ApiProperty({ description: 'Data do pedido' })
  dataPedido: Date;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiProperty({ description: 'Frutas do pedido', type: [FrutaPedidoResponseDto] })
  frutasPedidos: FrutaPedidoResponseDto[];

  @ApiProperty({ description: 'Pagamentos do pedido', type: [PagamentoPedidoResponseDto] })
  pagamentosPedidos: PagamentoPedidoResponseDto[];

  // NOVOS: Campos de frete
  @ApiProperty({ description: 'Pesagem para controle', required: false })
  pesagem?: string;

  @ApiProperty({ description: 'Placa do carro principal', required: false })
  placaPrimaria?: string;

  @ApiProperty({ description: 'Placa do carro secundário (reboque)', required: false })
  placaSecundaria?: string;

  @ApiProperty({ description: 'Nome do motorista', required: false })
  nomeMotorista?: string;

  // Campos específicos para clientes indústria
  @ApiProperty({ description: 'Data de entrada (apenas para clientes indústria)', required: false })
  indDataEntrada?: Date;

  @ApiProperty({ description: 'Data de descarga (apenas para clientes indústria)', required: false })
  indDataDescarga?: Date;

  @ApiProperty({ description: 'Peso médio (apenas para clientes indústria)', required: false })
  indPesoMedio?: number;

  @ApiProperty({ description: 'Média em mililitros (apenas para clientes indústria)', required: false })
  indMediaMililitro?: number;

  @ApiProperty({ description: 'Número da nota fiscal (apenas para clientes indústria)', required: false })
  indNumeroNf?: number;
}
