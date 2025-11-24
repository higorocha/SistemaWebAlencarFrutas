import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCargoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  salarioMensal: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cargaHorariaMensal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adicionalPericulosidade?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isGerencial?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativo?: boolean;
}

