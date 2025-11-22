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

export class CreateFuncaoDiaristaDto {
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
  valorDiariaBase: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  duracaoPadraoHoras?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  exigeEpi?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativo?: boolean;
}

