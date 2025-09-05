import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsPositive, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Definindo os tipos dos enums
type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND';

// DTO para cada fruta do pedido
export class FrutaPedidoDto {
  @ApiProperty({
    description: 'ID da fruta',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  frutaId: number;

  @ApiPropertyOptional({
    description: 'ID da área própria (deixe null se for área de terceiro)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaPropriaId?: number;

  @ApiPropertyOptional({
    description: 'ID da área de fornecedor (deixe null se for área própria)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaFornecedorId?: number;

  @ApiProperty({
    description: 'Quantidade prevista',
    example: 1000.5,
  })
  @IsNumber()
  @IsPositive()
  quantidadePrevista: number;

  @ApiProperty({
    description: 'Unidade de medida principal',
    enum: ['KG', 'TON', 'CX', 'UND'],
    example: 'KG',
  })
  @IsEnum(['KG', 'TON', 'CX', 'UND'])
  unidadeMedida1: UnidadeMedida;

  @ApiPropertyOptional({
    description: 'Unidade de medida secundária (opcional)',
    enum: ['KG', 'TON', 'CX', 'UND'],
    example: 'CX',
  })
  @IsOptional()
  @IsEnum(['KG', 'TON', 'CX', 'UND'])
  unidadeMedida2?: UnidadeMedida;
}

export class CreatePedidoDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  clienteId: number;

  @ApiProperty({
    description: 'Data prevista para colheita',
    example: '2024-03-15T00:00:00Z',
  })
  @IsDateString()
  dataPrevistaColheita: string;

  @ApiProperty({
    description: 'Array de frutas do pedido',
    type: [FrutaPedidoDto],
    example: [
      {
        frutaId: 1,
        quantidadePrevista: 1000.5,
        unidadeMedida1: 'KG',
        unidadeMedida2: 'CX'
      }
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrutaPedidoDto)
  @IsNotEmpty()
  frutas: FrutaPedidoDto[];

  @ApiPropertyOptional({
    description: 'Observações do pedido',
    example: 'Cliente prefere colheita pela manhã',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
