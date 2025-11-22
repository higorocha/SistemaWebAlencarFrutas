import { IsEnum, IsOptional } from 'class-validator';
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
}

