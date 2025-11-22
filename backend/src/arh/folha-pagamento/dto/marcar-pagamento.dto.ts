import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
import {
  MeioPagamentoFuncionario,
  StatusFuncionarioPagamento,
} from '@prisma/client';

export class MarcarPagamentoDto {
  @IsOptional()
  @IsEnum(MeioPagamentoFuncionario)
  meioPagamento?: MeioPagamentoFuncionario;

  @IsOptional()
  @IsEnum(StatusFuncionarioPagamento)
  statusPagamento?: StatusFuncionarioPagamento;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pagamentoEfetuado?: boolean;

  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pagamentoApiItemId?: number;
}

