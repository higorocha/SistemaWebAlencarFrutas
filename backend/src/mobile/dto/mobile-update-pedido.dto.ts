import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class MobileUpdatePedidoDto {
  @ApiPropertyOptional({
    description: 'Identificador do cliente associado ao pedido',
    example: 123,
  })
  @IsOptional()
  @IsInt()
  clienteId?: number;

  @ApiPropertyOptional({
    description: 'Data do pedido em formato ISO',
    example: '2025-03-15T15:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dataPedido?: string;

  @ApiPropertyOptional({
    description: 'Data prevista de colheita em formato ISO',
    example: '2025-03-20T15:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dataPrevistaColheita?: string;

  @ApiPropertyOptional({
    description: 'Observações gerais do pedido',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Placa primária do veículo',
    example: 'ABC-1234',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  placaPrimaria?: string;

  @ApiPropertyOptional({
    description: 'Placa secundária do veículo',
    example: 'XYZ-5678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  placaSecundaria?: string;
}

