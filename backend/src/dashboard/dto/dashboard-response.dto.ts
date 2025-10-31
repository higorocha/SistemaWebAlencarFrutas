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
}