import { IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusPedido } from '@prisma/client';

export class MobilePedidoFiltersDto {
  @ApiProperty({
    description: 'Filtrar por status do pedido',
    enum: StatusPedido,
    isArray: true,
    required: false,
    example: ['AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL']
  })
  @IsOptional()
  @IsArray()
  @IsEnum(StatusPedido, { each: true })
  status?: StatusPedido[];

  @ApiProperty({
    description: 'Filtrar pedidos aguardando colheita (simplificado para mobile)',
    required: false,
    example: true
  })
  @IsOptional()
  aguardandoColheita?: boolean;

  @ApiProperty({
    description: 'Filtrar pedidos com colheita parcial ou realizada',
    required: false,
    example: true
  })
  @IsOptional()
  colheitasPendentes?: boolean;
}
