import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Definindo os tipos dos enums
type StatusFruta = 'ATIVA' | 'INATIVA';

// DTO para cultura aninhada
class CulturaNestedDto {
  @ApiProperty({
    description: 'ID da cultura',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Descrição da cultura',
    example: 'Frutíferas Temperadas',
  })
  descricao: string;
}

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

  @ApiProperty({
    description: 'ID da cultura associada',
    example: 1,
  })
  culturaId: number;

  @ApiPropertyOptional({
    description: 'Cultura associada à fruta',
    type: CulturaNestedDto,
  })
  cultura?: CulturaNestedDto;

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