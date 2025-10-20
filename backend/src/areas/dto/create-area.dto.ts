import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum CategoriaArea {
  COLONO = 'COLONO',
  TECNICO = 'TECNICO',
  EMPRESARIAL = 'EMPRESARIAL',
  ADJACENTE = 'ADJACENTE',
}

export class CulturaAreaDto {
  @ApiProperty({
    description: 'ID da cultura',
    example: 1,
  })
  @IsNumber()
  culturaId: number;

  @ApiProperty({
    description: 'Área plantada em hectares',
    example: 10.5,
  })
  @IsNumber()
  areaPlantada: number;

  @ApiProperty({
    description: 'Área produzindo em hectares',
    example: 8.0,
    default: 0,
  })
  @IsNumber()
  areaProduzindo: number;

  @ApiProperty({
    description: 'Descrição da cultura',
    example: 'Milho Verde',
    required: false,
  })
  @IsOptional()
  descricao?: string;
}

export class CreateAreaDto {
  @ApiProperty({
    description: 'Nome da área agrícola',
    example: 'Área 01 - Fazenda São João',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'Categoria da área',
    enum: CategoriaArea,
    example: CategoriaArea.COLONO,
  })
  @IsEnum(CategoriaArea)
  categoria: CategoriaArea;

  @ApiProperty({
    description: 'Área total em hectares',
    example: 25.5,
  })
  @IsNumber()
  areaTotal: number;

  @ApiProperty({
    description: 'Coordenadas geográficas no formato GeoJSON',
    required: false,
  })
  @IsOptional()
  coordenadas?: any;

  @ApiProperty({
    description: 'Flag para desativar a área',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  desativar?: boolean;

  @ApiProperty({
    description: 'Culturas da área',
    type: [CulturaAreaDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CulturaAreaDto)
  culturas: CulturaAreaDto[];
} 