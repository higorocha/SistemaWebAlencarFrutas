import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export enum PeriodicidadeCultura {
  PERENE = 'PERENE',
  TEMPORARIA = 'TEMPORARIA',
}

export class CreateCulturaDto {
  @ApiProperty({
    description: 'Descrição da cultura',
    example: 'Milho',
  })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({
    description: 'Periodicidade da cultura',
    enum: PeriodicidadeCultura,
    example: PeriodicidadeCultura.PERENE,
  })
  @IsEnum(PeriodicidadeCultura)
  periodicidade: PeriodicidadeCultura;

  @ApiProperty({
    description: 'Se a cultura permite consórcio',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  permitirConsorcio?: boolean;
} 