import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Definindo os tipos dos enums
type CategoriaFruta = 'CITRICOS' | 'TROPICAIS' | 'TEMPERADAS' | 'SECAS' | 'EXOTICAS' | 'VERMELHAS' | 'VERDES';
type StatusFruta = 'ATIVA' | 'INATIVA';

export class FrutaResponseDto {
  @ApiProperty({
    description: 'ID da fruta',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome da fruta',
    example: 'Maçã Gala',
  })
  nome: string;

  @ApiPropertyOptional({
    description: 'Código interno da fruta',
    example: 'MAC001',
  })
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Categoria da fruta',
    example: 'TEMPERADAS',
  })
  categoria?: CategoriaFruta;

  @ApiPropertyOptional({
    description: 'Descrição da fruta',
    example: 'Maçã vermelha, doce e crocante',
  })
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Status da fruta',
    example: 'ATIVA',
  })
  status?: StatusFruta;

  @ApiPropertyOptional({
    description: 'Nome científico da fruta',
    example: 'Malus domestica',
  })
  nomeCientifico?: string;

  @ApiPropertyOptional({
    description: 'Cor predominante da fruta',
    example: 'Vermelha',
  })
  corPredominante?: string;

  @ApiPropertyOptional({
    description: 'Época de colheita da fruta',
    example: 'Março a Junho',
  })
  epocaColheita?: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Fruta de clima temperado',
  })
  observacoes?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
} 