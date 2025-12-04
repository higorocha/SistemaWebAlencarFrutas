import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  MeioPagamentoFuncionario,
  StatusFuncionarioPagamento,
} from '@prisma/client';

export class ListLancamentosQueryDto {
  @IsOptional()
  @IsEnum(MeioPagamentoFuncionario)
  meioPagamento?: MeioPagamentoFuncionario;

  @IsOptional()
  @IsEnum(StatusFuncionarioPagamento)
  statusPagamento?: StatusFuncionarioPagamento;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1') return true;
    if (value === 'false' || value === false || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  includePagamentoApiItem?: boolean;
}

