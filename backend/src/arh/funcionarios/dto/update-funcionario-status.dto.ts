import { IsEnum } from 'class-validator';
import { StatusFuncionario } from '@prisma/client';

export class UpdateFuncionarioStatusDto {
  @IsEnum(StatusFuncionario)
  status: StatusFuncionario;
}

