import { IsString, IsOptional, IsEnum, IsInt, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Definindo os tipos dos enums
type StatusFruta = 'ATIVA' | 'INATIVA';

export class CreateFrutaDto {
  @ApiProperty({
    description: 'Nome da fruta',
    example: 'Maçã Gala',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({
    description: 'Código interno da fruta',
    example: 'MAC001',
  })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiProperty({
    description: 'ID da cultura associada à fruta',
    example: 1,
    type: 'integer',
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  culturaId: number;

  @ApiPropertyOptional({
    description: 'Descrição da fruta',
    example: 'Maçã vermelha, doce e crocante',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Status da fruta',
    enum: ['ATIVA', 'INATIVA'],
    example: 'ATIVA',
  })
  @IsOptional()
  @IsEnum(['ATIVA', 'INATIVA'])
  status?: StatusFruta;

  @ApiPropertyOptional({
    description: 'Nome científico da fruta',
    example: 'Malus domestica',
  })
  @IsOptional()
  @IsString()
  nomeCientifico?: string;

  @ApiPropertyOptional({
    description: 'Cor predominante da fruta',
    example: 'Vermelha',
  })
  @IsOptional()
  @IsString()
  corPredominante?: string;

  @ApiPropertyOptional({
    description: 'Época de colheita da fruta',
    example: 'Março a Junho',
  })
  @IsOptional()
  @IsString()
  epocaColheita?: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Fruta de clima temperado',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Indica se a fruta é a principal (de primeira) da cultura',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  dePrimeira?: boolean;
} 