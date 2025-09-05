import { ApiProperty } from '@nestjs/swagger';
import { CategoriaArea, CulturaAreaDto } from './create-area.dto';

export class AreaResponseDto {
  @ApiProperty({
    description: 'ID da área',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome da área agrícola',
    example: 'Área 01 - Fazenda São João',
  })
  nome: string;

  @ApiProperty({
    description: 'Categoria da área',
    enum: CategoriaArea,
    example: CategoriaArea.COLONO,
  })
  categoria: CategoriaArea;

  @ApiProperty({
    description: 'Área total em hectares',
    example: 25.5,
  })
  areaTotal: number;

  @ApiProperty({
    description: 'Coordenadas geográficas no formato GeoJSON',
    required: false,
  })
  coordenadas?: any;

  @ApiProperty({
    description: 'Culturas da área',
    type: [CulturaAreaDto],
  })
  culturas: CulturaAreaDto[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
} 