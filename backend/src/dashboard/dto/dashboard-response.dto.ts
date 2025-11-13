// src/dashboard/dto/dashboard-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ReceitaMensalDto {
  @ApiProperty({ example: 'Jan' })
  mes: string;

  @ApiProperty({ example: 145320.50 })
  valor: number;
}

export class ProgramacaoColheitaDto {
  @ApiProperty({ example: 123 })
  pedidoId: number;

  @ApiProperty({ example: 'PED-2024-0001', description: 'Número do pedido' })
  numeroPedido: string;

  @ApiProperty({ example: 'ABC-1D23', required: false, description: 'Placa primária associada ao pedido' })
  placaPrimaria?: string;

  @ApiProperty({ example: 'João Silva Ltda' })
  cliente: string;

  @ApiProperty({ example: 'Banana Prata' })
  fruta: string;

  @ApiProperty({ example: 2500 })
  quantidadePrevista: number;

  @ApiProperty({ example: 2400, required: false })
  quantidadeReal?: number;

  @ApiProperty({ example: 'KG' })
  unidade: string;

  @ApiProperty({ example: '2024-01-25T00:00:00.000Z' })
  dataPrevistaColheita: string;

  @ApiProperty({ example: 'AGUARDANDO_COLHEITA' })
  status: string;

  @ApiProperty({ example: 'COLHEITA_REALIZADA', description: 'Status real do pedido' })
  statusPedido: string;

  @ApiProperty({ example: 3 })
  diasRestantes: number;
}

export class PrevisaoBananaDto {
  @ApiProperty({ example: 1, description: 'Número da semana do ano' })
  numeroSemana: number;

  @ApiProperty({ example: '15/01 - 21/01', description: 'Período da semana' })
  periodoSemana: string;

  @ApiProperty({ example: 5, description: 'Dias restantes até a colheita' })
  diasRestantes: number;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z', description: 'Data de início da semana' })
  dataInicio: string;

  @ApiProperty({ example: '2024-01-21T23:59:59.999Z', description: 'Data de fim da semana' })
  dataFim: string;

  @ApiProperty({ 
    example: [{ 
      areaNome: 'Área Norte', 
      fitaNome: 'Fita Vermelha', 
      fitaCor: '#FF0000', 
      quantidadeFitas: 200,
      id: '123',
      dataRegistro: '2024-01-01T10:30:00.000Z'
    }], 
    description: 'Detalhes das fitas por área' 
  })
  detalhes: Array<{
    areaNome: string;
    fitaNome: string;
    fitaCor: string;
    quantidadeFitas: number;
    id: string;
    dataRegistro: string;
  }>;

  @ApiProperty({ example: 350, description: 'Total de fitas da semana' })
  totalFitas: number;

  @ApiProperty({ example: 'colheita', description: 'Status da maturação (maturacao, colheita, alerta, vencido)' })
  status: string;
}

export class PagamentoPendenteDto {
  @ApiProperty({ example: 1, description: 'ID da turma de colheita' })
  id: number;

  @ApiProperty({ example: 'João Silva', description: 'Nome do colhedor' })
  nomeColhedor: string;

  @ApiProperty({ example: 'joao@example.com', description: 'Chave PIX do colhedor' })
  chavePix?: string;

  @ApiProperty({ example: 2500.75, description: 'Valor total pendente de pagamento' })
  totalPendente: number;

  @ApiProperty({ example: 3, description: 'Quantidade de pedidos com pagamento pendente' })
  quantidadePedidos: number;

  @ApiProperty({ example: 2, description: 'Quantidade de frutas diferentes' })
  quantidadeFrutas: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Data de cadastro da turma' })
  dataCadastro: string;

  @ApiProperty({ example: 'Turma experiente', description: 'Observações sobre a turma' })
  observacoes?: string;

  @ApiProperty({
    example: [
      {
        pedidoNumero: 'PED-2024-0001',
        cliente: 'João Silva Ltda',
        fruta: 'Banana Prata',
        quantidadeColhida: 1500,
        unidadeMedida: 'KG',
        valorColheita: 750.50,
        dataColheita: '2024-01-15T10:30:00Z',
        observacoes: 'Colheita sem problemas'
      }
    ],
    description: 'Detalhes dos custos de colheita pendentes'
  })
  detalhes: Array<{
    pedidoNumero: string;
    cliente: string;
    fruta: string;
    quantidadeColhida: number;
    unidadeMedida: string;
    valorColheita: number;
    dataColheita?: string;
    observacoes?: string;
  }>;
}

export class PagamentoEfetuadoDto {
  @ApiProperty({ example: '1-1642262400000', description: 'ID único do agrupamento (turma-timestamp)' })
  id: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome do colhedor' })
  nomeColhedor: string;

  @ApiProperty({ example: 'joao@example.com', description: 'Chave PIX do colhedor' })
  chavePix?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Data do pagamento' })
  dataPagamento: string;

  @ApiProperty({ example: 2500.75, description: 'Valor total pago' })
  totalPago: number;

  @ApiProperty({ example: 3, description: 'Quantidade de pedidos pagos' })
  quantidadePedidos: number;

  @ApiProperty({ example: 2, description: 'Quantidade de frutas diferentes' })
  quantidadeFrutas: number;

  @ApiProperty({ example: '2024-01-10T08:00:00Z', description: 'Data de cadastro da turma' })
  dataCadastro: string;

  @ApiProperty({ example: 'Turma experiente', description: 'Observações sobre a turma' })
  observacoes?: string;

  @ApiProperty({
    example: [
      {
        pedidoNumero: 'PED-2024-0001',
        cliente: 'João Silva Ltda',
        fruta: 'Banana Prata',
        quantidadeColhida: 1500,
        unidadeMedida: 'KG',
        valorColheita: 750.50,
        dataColheita: '2024-01-10T10:30:00Z',
        dataPagamento: '2024-01-15T10:30:00Z',
        observacoes: 'Colheita sem problemas'
      }
    ],
    description: 'Detalhes dos custos de colheita pagos'
  })
  detalhes: Array<{
    pedidoNumero: string;
    cliente: string;
    fruta: string;
    quantidadeColhida: number;
    unidadeMedida: string;
    valorColheita: number;
    dataColheita?: string;
    dataPagamento?: string;
    observacoes?: string;
  }>;
}

export class FornecedorColheitaDetalheDto {
  @ApiProperty({ example: 'PED-2024-0001', description: 'Número do pedido associado' })
  pedidoNumero: string;

  @ApiProperty({ example: 123, description: 'ID do pedido associado' })
  pedidoId: number;

  @ApiProperty({ example: 456, description: 'ID da fruta' })
  frutaId: number;

  @ApiProperty({ example: 789, description: 'ID do frutaPedido' })
  frutaPedidoId: number;

  @ApiProperty({ example: 101, description: 'ID do frutaPedidoArea' })
  frutaPedidoAreaId: number;

  @ApiProperty({ example: 'Fornecedor Oeste', description: 'Nome da área do fornecedor' })
  areaNome: string;

  @ApiProperty({ example: 5, description: 'ID da área do fornecedor' })
  areaFornecedorId: number;

  @ApiProperty({ example: 'Banana Prata' })
  fruta: string;

  @ApiProperty({ example: 1500 })
  quantidade: number;

  @ApiProperty({ example: 'KG' })
  unidade: string;

  @ApiProperty({ example: 1750.5, description: 'Valor proporcional atribuído à colheita nesta área' })
  valor: number;

  @ApiProperty({ example: 2500.75, description: 'Valor total da fruta no pedido', required: false })
  valorTotalFruta?: number;

  @ApiProperty({ example: 'PEDIDO_FINALIZADO', description: 'Status atual do pedido' })
  statusPedido: string;

  @ApiProperty({ example: 'Cliente Exemplo Ltda' })
  cliente: string;

  @ApiProperty({ example: '2024-01-18T00:00:00Z', required: false })
  dataColheita?: string;

  @ApiProperty({ example: 1, description: 'ID do pagamento se existir', required: false })
  pagamentoId?: number;

  @ApiProperty({ example: 'PAGO', description: 'Status do pagamento (PAGO, PENDENTE, PROCESSANDO)', required: false })
  statusPagamento?: string;

  @ApiProperty({ example: 5.50, description: 'Valor unitário do pagamento', required: false })
  valorUnitario?: number;

  @ApiProperty({ example: 8250.00, description: 'Valor total do pagamento', required: false })
  valorTotal?: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Data do pagamento', required: false })
  dataPagamento?: string;

  @ApiProperty({ example: 'PIX', description: 'Forma de pagamento', required: false })
  formaPagamento?: string;
}

export class DistribuicaoPorUnidadeDto {
  @ApiProperty({ example: 'KG', description: 'Unidade de medida' })
  unidade: string;

  @ApiProperty({ example: 1500.50, description: 'Quantidade paga' })
  quantidadePaga: number;

  @ApiProperty({ example: 500.25, description: 'Quantidade pendente' })
  quantidadePendente: number;

  @ApiProperty({ example: 2000.75, description: 'Quantidade total' })
  quantidadeTotal: number;

  @ApiProperty({ example: 8250.00, description: 'Valor pago' })
  valorPago: number;

  @ApiProperty({ example: 2750.50, description: 'Valor pendente' })
  valorPendente: number;

  @ApiProperty({ example: 11000.50, description: 'Valor total' })
  valorTotal: number;
}

export class FornecedorColheitaDto {
  @ApiProperty({ example: 10 })
  id: number;

  @ApiProperty({ example: 'Fazenda União' })
  nomeFornecedor: string;

  @ApiProperty({ example: 3, description: 'Quantidade de pedidos atendidos por este fornecedor' })
  quantidadePedidos: number;

  @ApiProperty({ example: 4, description: 'Quantidade de frutas distintas colhidas' })
  quantidadeFrutas: number;

  @ApiProperty({ example: 5, description: 'Total de colheitas' })
  totalColheitas: number;

  @ApiProperty({ example: 3, description: 'Colheitas pagas' })
  colheitasPagas: number;

  @ApiProperty({ example: 2, description: 'Colheitas em aberto' })
  colheitasEmAberto: number;

  @ApiProperty({ example: 5, description: 'Número de áreas do fornecedor utilizadas' })
  quantidadeAreas: number;

  @ApiProperty({ example: 2500.75, description: 'Total pendente de pagamento (colheitas sem pagamento ou com status PENDENTE/PROCESSANDO)' })
  totalPendente: number;

  @ApiProperty({ example: 1700.60, description: 'Total pago (colheitas com status PAGO)' })
  totalPago: number;

  @ApiProperty({ example: 4200.35, description: 'Somatório de valores proporcionalmente alocados ao fornecedor' })
  totalValor: number;

  @ApiProperty({ example: 3200, description: 'Total de quantidade colhida (soma das quantidades registradas)' })
  totalQuantidade: number;

  @ApiProperty({ type: [FornecedorColheitaDetalheDto] })
  detalhes: FornecedorColheitaDetalheDto[];

  @ApiProperty({ type: [DistribuicaoPorUnidadeDto], description: 'Distribuição por unidade (pago, pendente, total)' })
  distribuicaoPorUnidade: DistribuicaoPorUnidadeDto[];
}

export class PagamentoFornecedorEfetuadoDto {
  @ApiProperty({ example: '1-1642262400000', description: 'ID único do agrupamento (fornecedor-timestamp)' })
  id: string;

  @ApiProperty({ example: 1, description: 'ID do fornecedor' })
  fornecedorId: number;

  @ApiProperty({ example: 'Fazenda União', description: 'Nome do fornecedor' })
  nomeFornecedor: string;

  @ApiProperty({ example: '12.345.678/0001-90', description: 'CNPJ do fornecedor', required: false })
  cnpj?: string;

  @ApiProperty({ example: '123.456.789-00', description: 'CPF do fornecedor', required: false })
  cpf?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Data do pagamento' })
  dataPagamento: string;

  @ApiProperty({ example: 2500.75, description: 'Valor total pago' })
  totalPago: number;

  @ApiProperty({ example: 3, description: 'Quantidade de pedidos pagos' })
  quantidadePedidos: number;

  @ApiProperty({ example: 2, description: 'Quantidade de frutas diferentes' })
  quantidadeFrutas: number;

  @ApiProperty({ example: 'PIX', description: 'Forma de pagamento utilizada' })
  formaPagamento: string;

  @ApiProperty({
    example: [
      {
        pedidoNumero: 'PED-2024-0001',
        cliente: 'Cliente Exemplo Ltda',
        fruta: 'Banana Prata',
        areaNome: 'Área Norte',
        quantidadeColhida: 1500,
        unidadeMedida: 'KG',
        valorUnitario: 5.50,
        valorTotal: 8250.00,
        dataColheita: '2024-01-10T10:30:00Z',
        dataPagamento: '2024-01-15T10:30:00Z',
        formaPagamento: 'PIX',
        observacoes: 'Pagamento realizado via PIX'
      }
    ],
    description: 'Detalhes dos pagamentos efetuados'
  })
  detalhes: Array<{
    pedidoNumero: string;
    cliente: string;
    fruta: string;
    areaNome: string;
    quantidadeColhida: number;
    unidadeMedida: string;
    valorUnitario: number;
    valorTotal: number;
    dataColheita?: string;
    dataPagamento: string;
    formaPagamento: string;
    observacoes?: string;
  }>;
}

export class DashboardResponseDto {
  // Cards principais
  @ApiProperty({ example: 1245780.50, description: 'Faturamento total consolidado' })
  faturamentoTotal: number;

  @ApiProperty({ example: 89450.75, description: 'Valor em aberto (pedidos não finalizados)' })
  faturamentoAberto: number;

  @ApiProperty({ example: 125, description: 'Total de clientes ativos' })
  totalClientes: number;

  @ApiProperty({ example: 847, description: 'Total de pedidos' })
  totalPedidos: number;

  @ApiProperty({ example: 42.5, description: 'Área produtiva em hectares' })
  areasProdutivasHa: number;

  @ApiProperty({ example: 23, description: 'Frutas cadastradas' })
  frutasCadastradas: number;

  @ApiProperty({ example: 18, description: 'Pedidos ativos (não finalizados)' })
  pedidosAtivos: number;

  @ApiProperty({
    example: {
      aguardandoColheita: 7,
      aguardandoPrecificacao: 5,
      aguardandoPagamento: 6
    },
    description: 'Resumo de pedidos não finalizados agrupados por fase operacional'
  })
  pedidosNaoFinalizadosResumo: {
    aguardandoColheita: number;
    aguardandoPrecificacao: number;
    aguardandoPagamento: number;
  };

  // Dados para gráficos
  @ApiProperty({ type: [ReceitaMensalDto], description: 'Receita mensal dos últimos 6 meses' })
  receitaMensal: ReceitaMensalDto[];

  @ApiProperty({ type: [ProgramacaoColheitaDto], description: 'Programação de colheita próxima' })
  programacaoColheita: ProgramacaoColheitaDto[];

  // Nova seção: Previsões de Banana
  @ApiProperty({ type: [PrevisaoBananaDto], description: 'Previsões de colheita de banana por semana' })
  previsoesBanana: PrevisaoBananaDto[];

  // Nova seção: Pagamentos Pendentes
  @ApiProperty({ type: [PagamentoPendenteDto], description: 'Pagamentos pendentes por colheitador' })
  pagamentosPendentes: PagamentoPendenteDto[];

  // Nova seção: Pagamentos Efetuados
  @ApiProperty({ type: [PagamentoEfetuadoDto], description: 'Pagamentos efetuados agrupados por colheitador e data' })
  pagamentosEfetuados: PagamentoEfetuadoDto[];

  @ApiProperty({ type: [FornecedorColheitaDto], description: 'Colheitas realizadas em áreas de fornecedores' })
  pagamentosFornecedores: FornecedorColheitaDto[];

  @ApiProperty({ type: [PagamentoFornecedorEfetuadoDto], description: 'Pagamentos efetuados a fornecedores' })
  pagamentosFornecedoresEfetuados: PagamentoFornecedorEfetuadoDto[];
}