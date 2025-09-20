// src/dashboard/dto/dashboard-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ReceitaMensalDto {
  @ApiProperty({ example: 'Jan' })
  mes: string;

  @ApiProperty({ example: 145320.50 })
  valor: number;
}

export class ProgramacaoColheitaDto {
  @ApiProperty({ example: 'João Silva Ltda' })
  cliente: string;

  @ApiProperty({ example: 'Banana Prata' })
  fruta: string;

  @ApiProperty({ example: 2500 })
  quantidadePrevista: number;

  @ApiProperty({ example: 'KG' })
  unidade: string;

  @ApiProperty({ example: '2024-01-25T00:00:00.000Z' })
  dataPrevistaColheita: string;

  @ApiProperty({ example: 'AGUARDANDO_COLHEITA' })
  status: string;

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

  @ApiProperty({ example: [{ areaNome: 'Área Norte', fitaNome: 'Fita Vermelha', fitaCor: '#FF0000', quantidadeFitas: 200 }], description: 'Detalhes das fitas por área' })
  detalhes: Array<{
    areaNome: string;
    fitaNome: string;
    fitaCor: string;
    quantidadeFitas: number;
  }>;

  @ApiProperty({ example: 350, description: 'Total de fitas da semana' })
  totalFitas: number;

  @ApiProperty({ example: 'colheita', description: 'Status da maturação (maturacao, colheita, alerta, vencido)' })
  status: string;
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

  // Dados para gráficos
  @ApiProperty({ type: [ReceitaMensalDto], description: 'Receita mensal dos últimos 6 meses' })
  receitaMensal: ReceitaMensalDto[];

  @ApiProperty({ type: [ProgramacaoColheitaDto], description: 'Programação de colheita próxima' })
  programacaoColheita: ProgramacaoColheitaDto[];

  // Nova seção: Previsões de Banana
  @ApiProperty({ type: [PrevisaoBananaDto], description: 'Previsões de colheita de banana por semana' })
  previsoesBanana: PrevisaoBananaDto[];
}