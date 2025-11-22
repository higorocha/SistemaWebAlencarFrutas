import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

export class CreateFolhaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  competenciaMes: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  competenciaAno: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  periodo: number; // 1 = primeira quinzena, 2 = segunda quinzena

  @IsOptional()
  @IsString()
  @MaxLength(40)
  referencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;
}

