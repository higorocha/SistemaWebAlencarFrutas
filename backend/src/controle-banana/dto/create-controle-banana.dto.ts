import { IsInt, IsNotEmpty, IsPositive, IsOptional, IsString, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateControleBananaDto {
  @IsInt({ message: 'ID da fita deve ser um número inteiro' })
  @IsNotEmpty({ message: 'ID da fita é obrigatório' })
  @Type(() => Number)
  fitaBananaId: number;

  @IsInt({ message: 'ID da área agrícola deve ser um número inteiro' })
  @IsNotEmpty({ message: 'ID da área agrícola é obrigatório' })
  @Type(() => Number)
  areaAgricolaId: number;

  @IsInt({ message: 'Quantidade de fitas deve ser um número inteiro' })
  @IsPositive({ message: 'Quantidade de fitas deve ser maior que zero' })
  @Type(() => Number)
  quantidadeFitas: number;

  @IsOptional()
  @IsDateString({}, { message: 'Data de registro deve ser uma data válida' })
  dataRegistro?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  observacoes?: string;
}