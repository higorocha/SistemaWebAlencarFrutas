import { ApiProperty } from '@nestjs/swagger';
import { PeriodicidadeCultura } from './create-cultura.dto';

export class CulturaResponseDto {
  @ApiProperty({
    description: 'ID da cultura',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Descrição da cultura',
    example: 'Milho',
  })
  descricao: string;

  @ApiProperty({
    description: 'Periodicidade da cultura',
    enum: PeriodicidadeCultura,
    example: PeriodicidadeCultura.PERENE,
  })
  periodicidade: PeriodicidadeCultura;

  @ApiProperty({
    description: 'Se a cultura permite consórcio',
    example: false,
  })
  permitirConsorcio: boolean;

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