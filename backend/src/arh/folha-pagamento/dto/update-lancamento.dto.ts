import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MeioPagamentoFuncionario,
  StatusFuncionarioPagamento,
} from '@prisma/client';

export class UpdateLancamentoDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  diasTrabalhados?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  faltas?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  horasExtras?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorHoraExtra?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ajudaCusto?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extras?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adiantamento?: number;

  @IsOptional()
  @IsEnum(MeioPagamentoFuncionario)
  meioPagamento?: MeioPagamentoFuncionario;

  @IsOptional()
  @IsEnum(StatusFuncionarioPagamento)
  statusPagamento?: StatusFuncionarioPagamento;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;
}

