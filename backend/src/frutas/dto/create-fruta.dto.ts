import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Definindo os tipos dos enums
type CategoriaFruta = 'CITRICOS' | 'TROPICAIS' | 'TEMPERADAS' | 'SECAS' | 'EXOTICAS' | 'VERMELHAS' | 'VERDES';
type StatusFruta = 'ATIVA' | 'INATIVA';

export class CreateFrutaDto {
  @ApiProperty({
    description: 'Nome da fruta',
    example: 'Maçã Gala',
    maxLength: 100,
  })
  @IsString()
  nome: string;

  @ApiPropertyOptional({
    description: 'Código interno da fruta',
    example: 'MAC001',
  })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Categoria da fruta',
    enum: ['CITRICOS', 'TROPICAIS', 'TEMPERADAS', 'SECAS', 'EXOTICAS', 'VERMELHAS', 'VERDES'],
    example: 'TEMPERADAS',
  })
  @IsOptional()
  @IsEnum(['CITRICOS', 'TROPICAIS', 'TEMPERADAS', 'SECAS', 'EXOTICAS', 'VERMELHAS', 'VERDES'])
  categoria?: CategoriaFruta;

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
} 