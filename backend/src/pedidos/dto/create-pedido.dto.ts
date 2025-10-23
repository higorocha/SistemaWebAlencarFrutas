import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsPositive, IsArray, ValidateNested, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Definindo os tipos dos enums
type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';

// DTO para área da fruta (pode ser própria ou de fornecedor)
export class FrutaAreaDto {
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

  @ApiPropertyOptional({
    description: 'Observações sobre esta área',
    example: 'Área com boa produtividade',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Quantidade colhida nesta área (unidade 1)',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidadeColhidaUnidade1?: number;

  @ApiPropertyOptional({
    description: 'Quantidade colhida nesta área (unidade 2)',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidadeColhidaUnidade2?: number;
}

// DTO para fita da fruta (específico para bananas)
export class FrutaFitaDto {
  @ApiProperty({
    description: 'ID da fita de banana',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  fitaBananaId: number;

  @ApiPropertyOptional({
    description: 'Quantidade desta fita (opcional)',
    example: 500.0,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantidadeFita?: number;

  @ApiPropertyOptional({
    description: 'Observações sobre esta fita',
    example: 'Fita para banana premium',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

// DTO para cada fruta do pedido (NOVA ESTRUTURA)
export class FrutaPedidoDto {
  @ApiProperty({
    description: 'ID da fruta',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  frutaId: number;

  @ApiProperty({
    description: 'Quantidade prevista',
    example: 1000.5,
  })
  @IsNumber()
  @IsPositive()
  quantidadePrevista: number;

  @ApiProperty({
    description: 'Unidade de medida principal',
    enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'],
    example: 'KG',
  })
  @IsEnum(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'])
  unidadeMedida1: UnidadeMedida;

  @ApiPropertyOptional({
    description: 'Unidade de medida secundária (opcional)',
    enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'],
    example: 'CX',
  })
  @IsOptional()
  @IsEnum(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'])
  unidadeMedida2?: UnidadeMedida;

  @ApiProperty({
    description: 'Array de áreas para esta fruta (mínimo 1)',
    type: [FrutaAreaDto],
    example: [
      {
        areaPropriaId: 1,
        observacoes: 'Área principal'
      },
      {
        areaFornecedorId: 2,
        observacoes: 'Área de fornecedor parceiro'
      }
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrutaAreaDto)
  @IsNotEmpty()
  areas: FrutaAreaDto[];

  @ApiPropertyOptional({
    description: 'Array de fitas para esta fruta (apenas para bananas)',
    type: [FrutaFitaDto],
    example: [
      {
        fitaBananaId: 1,
        quantidadeFita: 500.0,
        observacoes: 'Fita vermelha premium'
      },
      {
        fitaBananaId: 2,
        quantidadeFita: 300.0,
        observacoes: 'Fita azul padrão'
      }
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrutaFitaDto)
  fitas?: FrutaFitaDto[];
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
    description: 'Data do pedido (temporário)',
    example: '2024-03-15T00:00:00Z',
  })
  @IsDateString()
  dataPedido: string;

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
        unidadeMedida2: 'CX',
        areas: [
          {
            areaPropriaId: 1,
            observacoes: 'Área principal'
          }
        ],
        fitas: [
          {
            fitaBananaId: 1,
            quantidadeFita: 500.0
          }
        ]
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
    example: 1250.75,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  indPesoMedio?: number;

  @ApiPropertyOptional({
    description: 'Média em mililitros (apenas para clientes indústria)',
    example: 500.25,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  indMediaMililitro?: number;

  @ApiPropertyOptional({
    description: 'Número da nota fiscal (apenas para clientes indústria)',
    example: 123456,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  indNumeroNf?: number;
}
