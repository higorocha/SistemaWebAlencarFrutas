import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateAdiantamentoDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  valorTotal: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  @Min(1)
  quantidadeParcelas: number;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
