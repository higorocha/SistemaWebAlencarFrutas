import { IsEnum, IsNumber, IsOptional, IsPositive, Min, IsArray, ValidateNested, IsNotEmpty, IsDateString, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';

// DTO para precificar cada fruta do pedido
export class UpdatePrecificacaoFrutaDto {
  @ApiProperty({
    description: 'ID da fruta do pedido',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  frutaPedidoId: number;

  @ApiProperty({
    description: 'Valor unitário por unidade de medida',
    example: 2.50,
  })
  @IsNumber()
  @IsPositive()
  valorUnitario: number;

  @ApiPropertyOptional({
    description: 'Unidade de medida que está sendo precificada (quando houver duas no pedido)',
    enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'],
    example: 'KG',
  })
  @IsOptional()
  @IsEnum(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'])
  unidadePrecificada?: UnidadeMedida;

  @ApiPropertyOptional({
    description: 'Quantidade real que será usada para precificação e relatórios',
    example: 1250.75,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantidadePrecificada?: number;
}

export class UpdatePrecificacaoDto {
  @ApiProperty({
    description: 'Array de frutas com suas precificações',
    type: [UpdatePrecificacaoFrutaDto],
    example: [
      {
        frutaPedidoId: 1,
        valorUnitario: 2.50,
        unidadePrecificada: 'KG'
      }
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePrecificacaoFrutaDto)
  @IsNotEmpty()
  frutas: UpdatePrecificacaoFrutaDto[];

  @ApiPropertyOptional({
    description: 'Valor do frete (opcional)',
    example: 150.00,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  frete?: number;

  @ApiPropertyOptional({
    description: 'Valor do ICMS (opcional)',
    example: 89.75,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  icms?: number;

  @ApiPropertyOptional({
    description: 'Valor do desconto (opcional)',
    example: 50.00,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  desconto?: number;

  @ApiPropertyOptional({
    description: 'Valor da avaria (opcional)',
    example: 25.00,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  avaria?: number;

  // Campos específicos para clientes indústria
  @ApiPropertyOptional({
    description: 'Data de entrada (apenas para clientes indústria)',
    example: '2024-03-15',
  })
  @IsOptional()
  @IsDateString()
  indDataEntrada?: string;

  @ApiPropertyOptional({
    description: 'Data de descarga (apenas para clientes indústria)',
    example: '2024-03-16',
  })
  @IsOptional()
  @IsDateString()
  indDataDescarga?: string;

  @ApiPropertyOptional({
    description: 'Peso médio (apenas para clientes indústria)',
    example: 1250.50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  indPesoMedio?: number;

  @ApiPropertyOptional({
    description: 'Média em mililitros (apenas para clientes indústria)',
    example: 500.75,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  indMediaMililitro?: number;

  @ApiPropertyOptional({
    description: 'Número da nota fiscal (apenas para clientes indústria)',
    example: 123456,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  indNumeroNf?: number;
}
