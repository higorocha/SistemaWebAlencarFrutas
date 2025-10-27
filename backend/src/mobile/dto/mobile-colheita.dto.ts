import {
  IsDateString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsPositive
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO simplificado para colheita de frutas (Mobile)
 * Versão mais enxuta sem sistema de fitas (MVP)
 */
class FrutaColheitaSimples {
  @ApiProperty({
    description: 'ID da fruta no pedido (frutaPedidoId)',
    example: 1
  })
  @IsInt()
  frutaPedidoId: number;

  @ApiProperty({
    description: 'Quantidade real colhida',
    example: 950.5
  })
  @IsNumber()
  @IsPositive()
  quantidadeReal: number;

  @ApiProperty({
    description: 'ID da área agrícola de origem (opcional)',
    required: false,
    example: 5
  })
  @IsOptional()
  @IsInt()
  areaAgricolaId?: number;

  @ApiProperty({
    description: 'ID da área de fornecedor (opcional)',
    required: false,
    example: 3
  })
  @IsOptional()
  @IsInt()
  areaFornecedorId?: number;
}

export class MobileColheitaDto {
  @ApiProperty({
    description: 'Data da colheita (formato ISO)',
    example: '2025-10-22'
  })
  @IsDateString()
  dataColheita: string;

  @ApiProperty({
    description: 'Lista de frutas colhidas com quantidades reais',
    type: [FrutaColheitaSimples]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrutaColheitaSimples)
  frutas: FrutaColheitaSimples[];

  @ApiProperty({
    description: 'IDs das turmas de colheita (opcional)',
    required: false,
    example: [1, 2]
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  turmasIds?: number[];

  @ApiProperty({
    description: 'Observações sobre a colheita',
    required: false,
    example: 'Colheita realizada pela manhã'
  })
  @IsOptional()
  @IsString()
  observacoesColheita?: string;

  @ApiProperty({
    description: 'Custo de frete (opcional)',
    required: false,
    example: 150.00
  })
  @IsOptional()
  @IsNumber()
  custoFrete?: number;
}
