import { ApiProperty } from '@nestjs/swagger';
import { StatusPedido } from '@prisma/client';

/**
 * DTO de resposta simplificado para listagem de pedidos no mobile
 * Contém apenas dados essenciais para exibição no app
 */
export class MobilePedidoSimplificadoDto {
  @ApiProperty({ description: 'ID do pedido', example: 123 })
  id: number;

  @ApiProperty({ description: 'Número do pedido', example: 'PED-2025-0123' })
  numeroPedido: string;

  @ApiProperty({ description: 'Nome do cliente', example: 'João Silva' })
  cliente: string;

  @ApiProperty({ description: 'Status do pedido', enum: StatusPedido })
  status: StatusPedido;

  @ApiProperty({ description: 'Data prevista de colheita', example: '2025-10-25' })
  dataPrevistaColheita: string | null;

  @ApiProperty({ description: 'Data de colheita realizada', example: '2025-10-22', required: false })
  dataColheita?: string | null;

  @ApiProperty({ description: 'Lista de frutas do pedido', type: 'array' })
  frutas: {
    id: number;
    nome: string;
    quantidadePrevista: number;
    quantidadeReal?: number;
    unidade: string;
    cultura?: string;
  }[];

  @ApiProperty({ description: 'Indica se o pedido está vencido', example: false })
  vencido: boolean;

  @ApiProperty({ description: 'Dias desde a previsão de colheita', example: 3, required: false })
  diasDesdePrevisao?: number;
}

export class MobilePedidosListResponseDto {
  @ApiProperty({ description: 'Lista de pedidos', type: [MobilePedidoSimplificadoDto] })
  data: MobilePedidoSimplificadoDto[];

  @ApiProperty({ description: 'Total de pedidos', example: 15 })
  total: number;

  @ApiProperty({ description: 'Filtros aplicados', required: false })
  filtrosAplicados?: {
    status?: string[];
    cultura?: string;
  };
}

export class MobileDashboardDto {
  @ApiProperty({ description: 'Total de pedidos aguardando colheita', example: 5 })
  aguardandoColheita: number;

  @ApiProperty({ description: 'Total de colheitas parciais', example: 2 })
  colheitaParcial: number;

  @ApiProperty({ description: 'Total de colheitas realizadas hoje', example: 3 })
  colheitasRealizadasHoje: number;

  @ApiProperty({ description: 'Total de colheitas desta semana', example: 8 })
  colheitasRealizadasSemana: number;

  @ApiProperty({ description: 'Pedidos recentes (últimos 10)', type: [MobilePedidoSimplificadoDto] })
  pedidosRecentes: MobilePedidoSimplificadoDto[];
}
